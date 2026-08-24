import Foundation
import AuthenticationServices
import os

/// Lightweight Supabase REST client using URLSession.
/// No third-party dependencies.
actor SupabaseClient {
    static let shared = SupabaseClient()

    private let logger = Logger(subsystem: "QuickTrack", category: "Supabase")
    private let session = URLSession.shared
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    /// Custom URL scheme for OAuth callback
    static let callbackScheme = "quicktrack"
    static let callbackURL = "\(callbackScheme)://login-callback"

    // MARK: - Auth

    struct AuthResponse: Decodable {
        let access_token: String
        let user: AuthUser
    }

    struct AuthUser: Decodable {
        let id: String
        let email: String?
    }

    enum SupabaseError: LocalizedError {
        case notConfigured
        case notAuthenticated
        case httpError(Int, String)
        case invalidResponse
        case oauthCancelled
        case oauthFailed(String)

        var errorDescription: String? {
            switch self {
            case .notConfigured: "Supabase not configured. Enter URL and key in Settings."
            case .notAuthenticated: "Not logged in. Sign in from Settings."
            case .httpError(let code, let msg): "HTTP \(code): \(msg)"
            case .invalidResponse: "Invalid response from server."
            case .oauthCancelled: "Login was cancelled."
            case .oauthFailed(let msg): "OAuth failed: \(msg)"
            }
        }
    }

    /// Login with email + password, stores JWT and userId in App Group.
    func login(email: String, password: String) async throws -> AuthResponse {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty else {
            throw SupabaseError.notConfigured
        }

        let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(appGroup.supabaseAnonKey, forHTTPHeaderField: "apikey")

        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            logger.error("Login failed: HTTP \(statusCode) - \(message)")
            throw SupabaseError.httpError(statusCode, message)
        }

        let authResponse = try decoder.decode(AuthResponse.self, from: data)

        // Store credentials in App Group
        appGroup.supabaseJWT = authResponse.access_token
        appGroup.supabaseUserId = authResponse.user.id
        appGroup.supabaseEmail = authResponse.user.email

        logger.info("Login successful for user \(authResponse.user.id)")
        return authResponse
    }

    /// Build the GitHub OAuth URL for ASWebAuthenticationSession.
    nonisolated func gitHubOAuthURL() throws -> URL {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty else {
            throw SupabaseError.notConfigured
        }

        var components = URLComponents(string: "\(baseURL)/auth/v1/authorize")!
        components.queryItems = [
            URLQueryItem(name: "provider", value: "github"),
            URLQueryItem(name: "redirect_to", value: Self.callbackURL)
        ]
        return components.url!
    }

    /// Parse the OAuth callback URL and extract + store credentials.
    /// Supabase returns tokens in the URL fragment: #access_token=...&...&user_id=...
    func handleOAuthCallback(_ url: URL) async throws {
        // Supabase puts tokens in the fragment (after #), not in query params
        // Convert fragment to query format for URLComponents parsing
        let fragment = url.fragment ?? ""
        guard !fragment.isEmpty else {
            throw SupabaseError.oauthFailed("No token in callback URL")
        }

        let params = Self.parseFragment(fragment)

        guard let accessToken = params["access_token"], !accessToken.isEmpty else {
            // Check for error
            if let error = params["error_description"] ?? params["error"] {
                throw SupabaseError.oauthFailed(error)
            }
            throw SupabaseError.oauthFailed("No access_token in callback")
        }

        let appGroup = AppGroupManager.shared

        // Store the token
        appGroup.supabaseJWT = accessToken

        // Fetch user info using the token
        guard let baseURL = appGroup.supabaseURL,
              let anonKey = appGroup.supabaseAnonKey else {
            throw SupabaseError.notConfigured
        }

        let userURL = URL(string: "\(baseURL)/auth/v1/user")!
        var request = URLRequest(url: userURL)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw SupabaseError.httpError(statusCode, message)
        }

        let user = try decoder.decode(AuthUser.self, from: data)
        appGroup.supabaseUserId = user.id
        appGroup.supabaseEmail = user.email

        logger.info("GitHub OAuth login successful for user \(user.id)")
    }

    /// Parse URL fragment string "key1=value1&key2=value2" into dictionary.
    private nonisolated static func parseFragment(_ fragment: String) -> [String: String] {
        var result: [String: String] = [:]
        for pair in fragment.split(separator: "&") {
            let kv = pair.split(separator: "=", maxSplits: 1)
            if kv.count == 2 {
                let key = String(kv[0])
                let value = String(kv[1]).removingPercentEncoding ?? String(kv[1])
                result[key] = value
            }
        }
        return result
    }

    // MARK: - REST Queries

    /// Fetch a single row (expects one object, not array).
    func fetchOne<T: Decodable>(table: String, query: String) async throws -> T {
        let data = try await rawFetch(table: table, query: query, singleObject: true)
        return try decoder.decode(T.self, from: data)
    }

    /// Fetch a single row, returning nil if no rows found (406 from PostgREST).
    func fetchOneOptional<T: Decodable>(table: String, query: String) async throws -> T? {
        do {
            return try await fetchOne(table: table, query: query)
        } catch SupabaseError.httpError(406, _) {
            return nil
        }
    }

    /// Fetch multiple rows.
    func fetchMany<T: Decodable>(table: String, query: String) async throws -> [T] {
        let data = try await rawFetch(table: table, query: query, singleObject: false)
        return try decoder.decode([T].self, from: data)
    }

    private func rawFetch(table: String, query: String, singleObject: Bool) async throws -> Data {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty,
              let anonKey = appGroup.supabaseAnonKey, !anonKey.isEmpty else {
            throw SupabaseError.notConfigured
        }
        guard let jwt = appGroup.supabaseJWT, !jwt.isEmpty else {
            throw SupabaseError.notAuthenticated
        }

        let urlString = "\(baseURL)/rest/v1/\(table)?\(query)"
        guard let url = URL(string: urlString) else {
            throw SupabaseError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        if singleObject {
            request.setValue("application/vnd.pgrst.object+json", forHTTPHeaderField: "Accept")
        } else {
            request.setValue("application/json", forHTTPHeaderField: "Accept")
        }

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            logger.error("Fetch \(table) failed: HTTP \(statusCode)")
            throw SupabaseError.httpError(statusCode, message)
        }

        return data
    }

    // MARK: - Write (Phase 3)

    /// UPSERT a row (insert or update on conflict). Requires user_id in body.
    func upsert(table: String, body: [String: Any]) async throws {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty,
              let anonKey = appGroup.supabaseAnonKey, !anonKey.isEmpty else {
            throw SupabaseError.notConfigured
        }
        guard let jwt = appGroup.supabaseJWT, !jwt.isEmpty else {
            throw SupabaseError.notAuthenticated
        }

        let urlString = "\(baseURL)/rest/v1/\(table)"
        guard let url = URL(string: urlString) else {
            throw SupabaseError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            logger.error("Upsert \(table) failed: HTTP \(statusCode)")
            throw SupabaseError.httpError(statusCode, message)
        }
    }

    /// PATCH with custom query filter.
    func patchWithQuery(table: String, query: String, body: [String: Any]) async throws {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty,
              let anonKey = appGroup.supabaseAnonKey, !anonKey.isEmpty else {
            throw SupabaseError.notConfigured
        }
        guard let jwt = appGroup.supabaseJWT, !jwt.isEmpty else {
            throw SupabaseError.notAuthenticated
        }

        let urlString = "\(baseURL)/rest/v1/\(table)?\(query)"
        guard let url = URL(string: urlString) else {
            throw SupabaseError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            logger.error("Patch \(table) failed: HTTP \(statusCode)")
            throw SupabaseError.httpError(statusCode, message)
        }
    }

    /// DELETE rows matching a query filter.
    func deleteWithQuery(table: String, query: String) async throws {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty,
              let anonKey = appGroup.supabaseAnonKey, !anonKey.isEmpty else {
            throw SupabaseError.notConfigured
        }
        guard let jwt = appGroup.supabaseJWT, !jwt.isEmpty else {
            throw SupabaseError.notAuthenticated
        }

        let urlString = "\(baseURL)/rest/v1/\(table)?\(query)"
        guard let url = URL(string: urlString) else {
            throw SupabaseError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            logger.error("Delete \(table) failed: HTTP \(statusCode)")
            throw SupabaseError.httpError(statusCode, message)
        }
    }

    /// PATCH a single row by user_id.
    func patch(table: String, body: [String: Any]) async throws {
        let appGroup = AppGroupManager.shared
        guard let baseURL = appGroup.supabaseURL, !baseURL.isEmpty,
              let anonKey = appGroup.supabaseAnonKey, !anonKey.isEmpty else {
            throw SupabaseError.notConfigured
        }
        guard let jwt = appGroup.supabaseJWT, !jwt.isEmpty,
              let userId = appGroup.supabaseUserId, !userId.isEmpty else {
            throw SupabaseError.notAuthenticated
        }

        let urlString = "\(baseURL)/rest/v1/\(table)?user_id=eq.\(userId)"
        guard let url = URL(string: urlString) else {
            throw SupabaseError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            logger.error("Patch \(table) failed: HTTP \(statusCode)")
            throw SupabaseError.httpError(statusCode, message)
        }
    }
}
