import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var isOAuthLoading = false
    @State private var errorMessage: String?
    @State private var isLoggedIn = AppGroupManager.shared.isAuthenticated
    @State private var webAuthSession: ASWebAuthenticationSession?

    var body: some View {
        if isLoggedIn {
            loggedInView
        } else {
            loginForm
        }
    }

    // MARK: - Logged In

    private var loggedInView: some View {
        VStack(spacing: 12) {
            Label(
                AppGroupManager.shared.supabaseEmail ?? "Authenticated",
                systemImage: "checkmark.circle.fill"
            )
            .foregroundStyle(.green)
            .font(.headline)

            Text("User ID: \(AppGroupManager.shared.supabaseUserId ?? "?")")
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            Button("Sign Out", role: .destructive) {
                AppGroupManager.shared.clearAuth()
                isLoggedIn = false
            }
        }
        .padding()
    }

    // MARK: - Login Form

    private var loginForm: some View {
        VStack(spacing: 16) {
            Text("Supabase Login")
                .font(.headline)

            // GitHub OAuth button
            Button {
                loginWithGitHub()
            } label: {
                HStack(spacing: 8) {
                    if isOAuthLoading {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Image(systemName: "chevron.left.forwardslash.chevron.right")
                    }
                    Text("Sign in with GitHub")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.black)
            .disabled(isOAuthLoading || isLoading)

            // Divider
            HStack {
                Rectangle().frame(height: 1).foregroundStyle(.secondary.opacity(0.3))
                Text("or")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Rectangle().frame(height: 1).foregroundStyle(.secondary.opacity(0.3))
            }

            // Email/password fields
            TextField("Email", text: $email)
                .textContentType(.emailAddress)
                .autocorrectionDisabled()
                #if os(iOS)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                #endif

            SecureField("Password", text: $password)
                .textContentType(.password)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }

            Button {
                Task { await login() }
            } label: {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Sign In")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(email.isEmpty || password.isEmpty || isLoading || isOAuthLoading)
        }
        .padding()
    }

    // MARK: - Actions

    private func login() async {
        isLoading = true
        errorMessage = nil

        do {
            _ = try await SupabaseClient.shared.login(email: email, password: password)
            isLoggedIn = true
            password = ""
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func loginWithGitHub() {
        isOAuthLoading = true
        errorMessage = nil

        do {
            let authURL = try SupabaseClient.shared.gitHubOAuthURL()

            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: SupabaseClient.callbackScheme
            ) { callbackURL, error in
                Task { @MainActor in
                    defer { isOAuthLoading = false }

                    if let error = error as? ASWebAuthenticationSessionError,
                       error.code == .canceledLogin {
                        return
                    }

                    if let error {
                        errorMessage = error.localizedDescription
                        return
                    }

                    guard let callbackURL else {
                        errorMessage = "No callback received"
                        return
                    }

                    do {
                        try await SupabaseClient.shared.handleOAuthCallback(callbackURL)
                        isLoggedIn = true
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                }
            }

            session.prefersEphemeralWebBrowserSession = false
            #if os(iOS)
            session.presentationContextProvider = OAuthPresentationContext.shared
            #endif
            session.start()

            webAuthSession = session
        } catch {
            errorMessage = error.localizedDescription
            isOAuthLoading = false
        }
    }
}

// MARK: - Presentation Context (iOS)

#if os(iOS)
class OAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = OAuthPresentationContext()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first else {
            return ASPresentationAnchor()
        }
        return window
    }
}
#endif
