import Foundation
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

        var errorDescription: String? {
            switch self {
            case .notConfigured: "Supabase not configured. Enter URL and key in Settings."
            case .notAuthenticated: "Not logged in. Sign in from Settings."
            case .httpError(let code, let msg): "HTTP \(code): \(msg)"
            case .invalidResponse: "Invalid response from server."
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

    // MARK: - REST Queries

    /// Fetch a single row (expects one object, not array).
    func fetchOne<T: Decodable>(table: String, query: String) async throws -> T {
        let data = try await rawFetch(table: table, query: query, singleObject: true)
        return try decoder.decode(T.self, from: data)
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
