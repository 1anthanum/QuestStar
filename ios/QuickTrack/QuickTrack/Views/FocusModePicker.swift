import SwiftUI

/// Horizontal chip selector for the focus mode.
/// Shows "All" + one chip per category present in the quest list.
/// Selecting a chip filters the visible quests via FocusFilterStore.
struct FocusModePicker: View {
    let availableCategories: [String]  // e.g. ["learning", "code", "habit"]
    let accent: Color
    @ObservedObject private var store = FocusFilterStore.shared

    private var modes: [String?] {
        [nil] + availableCategories.sorted()
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(modes, id: \.self) { mode in
                    chip(mode: mode)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
        }
    }

    private func chip(mode: String?) -> some View {
        let isActive = store.currentMode == mode

        return Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            withAnimation(.spring(response: 0.3)) {
                store.currentMode = mode
            }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: FocusFilterStore.icon(for: mode))
                    .font(.system(size: 10, weight: .bold))
                Text(FocusFilterStore.label(for: mode))
                    .font(.system(size: 11, weight: .bold))
            }
            .padding(.horizontal, 11)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(isActive ? accent : Color.systemGray6)
            )
            .foregroundStyle(isActive ? .white : .primary)
            .overlay(
                Capsule()
                    .stroke(isActive ? Color.clear : accent.opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("Focus Picker") {
    VStack(spacing: 16) {
        FocusModePicker(
            availableCategories: ["learning", "code", "habit", "work"],
            accent: .indigo
        )
        FocusModePicker(
            availableCategories: ["learning", "code"],
            accent: .orange
        )
    }
    .padding()
    .background(Color.systemBackground)
}
#endif
