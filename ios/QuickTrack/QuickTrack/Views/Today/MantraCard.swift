import SwiftUI

/// Surfaces the user's personal mantra (set in Settings) as a quiet card.
/// Tap to edit. Hidden if no mantra is set.
struct MantraCard: View {
    let accent: Color

    @ObservedObject private var store = MantraStore.shared
    @State private var showEditor = false

    var body: some View {
        if store.hasMantra {
            Button {
                #if os(iOS)
                HapticEngine.selection()
                #endif
                showEditor = true
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "quote.bubble.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(accent.opacity(0.5))

                    Text(store.mantra)
                        .font(.system(size: 13, weight: .semibold, design: .serif))
                        .italic()
                        .foregroundStyle(.primary.opacity(0.85))
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer(minLength: 0)

                    Image(systemName: "pencil")
                        .font(.system(size: 10))
                        .foregroundStyle(.tertiary)
                }
                .padding(12)
                .background(
                    LinearGradient(
                        colors: [accent.opacity(0.06), accent.opacity(0.0)],
                        startPoint: .leading, endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(accent.opacity(0.15), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .sheet(isPresented: $showEditor) {
                MantraEditorSheet(accent: accent)
            }
        }
    }
}

/// Editor for the personal mantra — accessible from MantraCard tap or Settings.
struct MantraEditorSheet: View {
    let accent: Color
    @ObservedObject private var store = MantraStore.shared
    @Environment(\.dismiss) private var dismiss
    @State private var draft: String = ""

    let suggestions: [String] = [
        "Done is better than perfect.",
        "One step is enough.",
        "I am building who I want to become.",
        "My past doesn't decide my today.",
        "Show up, even imperfectly.",
        "I trust my future self.",
    ]

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your private mantra")
                        .font(.system(size: 16, weight: .bold))
                    Text("One sentence in your own voice — surfaces throughout the app when you need it.")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }

                TextEditor(text: $draft)
                    .font(.system(size: 16, weight: .medium, design: .serif))
                    .italic()
                    .frame(minHeight: 100, maxHeight: 150)
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.systemGray6)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(accent.opacity(0.2), lineWidth: 1)
                    )

                VStack(alignment: .leading, spacing: 8) {
                    Text("Or pick a starting point:")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .tracking(0.5)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(suggestions, id: \.self) { suggestion in
                            Button {
                                draft = suggestion
                            } label: {
                                Text(suggestion)
                                    .font(.system(size: 11, weight: .medium, design: .serif))
                                    .italic()
                                    .foregroundStyle(.primary)
                                    .multilineTextAlignment(.leading)
                                    .padding(8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(accent.opacity(0.08))
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                Spacer()
            }
            .padding(20)
            .navigationTitle("Mantra")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        store.mantra = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        dismiss()
                    }
                    .bold()
                }
            }
            .onAppear {
                draft = store.mantra
            }
        }
    }
}

#if DEBUG
#Preview("With Mantra") {
    MantraCard(accent: .indigo)
        .padding()
        .background(Color.systemBackground)
        .onAppear {
            MantraStore.shared.mantra = "One small step is enough. I trust my future self."
        }
}

#Preview("Editor") {
    MantraEditorSheet(accent: .indigo)
}
#endif
