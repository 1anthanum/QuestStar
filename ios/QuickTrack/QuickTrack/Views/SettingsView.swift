import SwiftUI

struct SettingsView: View {
    @State private var supabaseURL: String = AppGroupManager.shared.supabaseURL ?? ""
    @State private var supabaseAnonKey: String = AppGroupManager.shared.supabaseAnonKey ?? ""
    @State private var showSaved = false

    var body: some View {
        Form {
            Section("Supabase Connection") {
                TextField("Project URL", text: $supabaseURL)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.URL)
                    #endif

                SecureField("Anon Key", text: $supabaseAnonKey)
                    .autocorrectionDisabled()

                Button("Save") {
                    saveConfig()
                }
                .disabled(supabaseURL.isEmpty || supabaseAnonKey.isEmpty)

                if showSaved {
                    Label("Saved to App Group", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                        .font(.caption)
                }
            }

            Section("Account") {
                LoginView()
            }

            Section("Status") {
                statusRow("App Group", isOK: AppGroupManager.shared.defaults != nil)
                statusRow("Supabase URL", isOK: !supabaseURL.isEmpty)
                statusRow("Anon Key", isOK: !supabaseAnonKey.isEmpty)
                statusRow("Authenticated", isOK: AppGroupManager.shared.isAuthenticated)
            }

            Section("Data Sources") {
                ForEach(Tracker.allTrackers) { tracker in
                    Label(tracker.displayName, systemImage: tracker.icon)
                }
            }

            Section("About") {
                LabeledContent("Version", value: "1.0.0")
                LabeledContent("App Group", value: Config.appGroupID)
            }
        }
        .navigationTitle("Settings")
    }

    private func saveConfig() {
        AppGroupManager.shared.supabaseURL = supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        AppGroupManager.shared.supabaseAnonKey = supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        showSaved = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            showSaved = false
        }
    }

    private func statusRow(_ label: String, isOK: Bool) -> some View {
        LabeledContent(label) {
            Image(systemName: isOK ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundStyle(isOK ? .green : .red)
        }
    }
}
