import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var isLoggedIn = AppGroupManager.shared.isAuthenticated

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
            .disabled(email.isEmpty || password.isEmpty || isLoading)
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
}
