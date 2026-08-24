import Foundation

/// Manages shared state between the host app and widget extension via App Group UserDefaults.
/// UserDefaults is documented thread-safe by Apple — `@unchecked Sendable` is appropriate here.
/// All access goes through the singleton, so we can guarantee a single instance.
final class AppGroupManager: @unchecked Sendable {
    static let shared = AppGroupManager()

    let defaults: UserDefaults?

    private init() {
        defaults = UserDefaults(suiteName: Config.appGroupID)
    }

    // MARK: - Supabase Configuration

    var supabaseURL: String? {
        get { defaults?.string(forKey: Config.Keys.supabaseURL) }
        set { defaults?.set(newValue, forKey: Config.Keys.supabaseURL) }
    }

    var supabaseAnonKey: String? {
        get { defaults?.string(forKey: Config.Keys.supabaseAnonKey) }
        set { defaults?.set(newValue, forKey: Config.Keys.supabaseAnonKey) }
    }

    var supabaseJWT: String? {
        get { defaults?.string(forKey: Config.Keys.supabaseJWT) }
        set { defaults?.set(newValue, forKey: Config.Keys.supabaseJWT) }
    }

    var supabaseUserId: String? {
        get { defaults?.string(forKey: Config.Keys.supabaseUserId) }
        set { defaults?.set(newValue, forKey: Config.Keys.supabaseUserId) }
    }

    var supabaseEmail: String? {
        get { defaults?.string(forKey: Config.Keys.supabaseEmail) }
        set { defaults?.set(newValue, forKey: Config.Keys.supabaseEmail) }
    }

    // MARK: - Status

    var isConfigured: Bool {
        guard let url = supabaseURL, let key = supabaseAnonKey else { return false }
        return !url.isEmpty && !key.isEmpty
    }

    var isAuthenticated: Bool {
        guard let jwt = supabaseJWT, let userId = supabaseUserId else { return false }
        return !jwt.isEmpty && !userId.isEmpty
    }

    // MARK: - Cache

    func cacheData(_ data: Data, forKey key: String) {
        defaults?.set(data, forKey: "quicktrack_cache_\(key)")
        defaults?.set(Date().timeIntervalSince1970, forKey: "quicktrack_cache_\(key)_timestamp")
    }

    func cachedData(forKey key: String) -> (data: Data, age: TimeInterval)? {
        guard let data = defaults?.data(forKey: "quicktrack_cache_\(key)"),
              let timestamp = defaults?.double(forKey: "quicktrack_cache_\(key)_timestamp"),
              timestamp > 0 else {
            return nil
        }
        let age = Date().timeIntervalSince1970 - timestamp
        return (data, age)
    }

    // MARK: - Reset

    func clearAuth() {
        defaults?.removeObject(forKey: Config.Keys.supabaseJWT)
        defaults?.removeObject(forKey: Config.Keys.supabaseUserId)
        defaults?.removeObject(forKey: Config.Keys.supabaseEmail)
    }

    func clearAll() {
        let keys = [
            Config.Keys.supabaseURL,
            Config.Keys.supabaseAnonKey,
            Config.Keys.supabaseJWT,
            Config.Keys.supabaseUserId,
            Config.Keys.supabaseEmail
        ]
        for key in keys {
            defaults?.removeObject(forKey: key)
        }
    }
}
