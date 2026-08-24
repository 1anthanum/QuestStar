import SwiftUI

/// Compact home-screen card showing today's check-in state.
/// Two modes:
///   - **Not done**: shows a single-line CTA button → opens the multi-step flow
///   - **Done**: shows mood emoji + energy bar + stress dot + intention (truncated)
struct CheckInSummaryCard: View {
    let accent: Color

    @ObservedObject private var store = DailyCheckInStore.shared
    @State private var showFlow = false

    var body: some View {
        Button {
            #if os(iOS)
            HapticEngine.selection()
            #endif
            showFlow = true
        } label: {
            if let today = store.today, today.date == Config.todayString() {
                completedView(today)
            } else {
                ctaView
            }
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showFlow) {
            DailyCheckInFlow(accent: accent) { _ in }
                .presentationDetents([.large])
        }
    }

    // MARK: - CTA (no check-in today)

    private var ctaView: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(accent.opacity(0.12))
                    .frame(width: 36, height: 36)
                Image(systemName: "questionmark.bubble.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(accent)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("How's today going?")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                Text("4 quick questions, ~30 seconds")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(accent.opacity(0.5))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(accent.opacity(0.2), lineWidth: 1)
                )
        )
    }

    // MARK: - Done summary

    private func completedView(_ today: DailyCheckInStore.CheckIn) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(DailyCheckInStore.moodEmojis[today.mood - 1])
                    .font(.system(size: 24))

                VStack(alignment: .leading, spacing: 1) {
                    Text("Today's check-in")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .tracking(0.5)
                    Text(DailyCheckInStore.moodLabels[today.mood - 1])
                        .font(.system(size: 13, weight: .bold))
                }
                Spacer()
                Image(systemName: "pencil")
                    .font(.system(size: 10))
                    .foregroundStyle(.tertiary)
            }

            // Quick stat row: energy + stress
            HStack(spacing: 12) {
                statPill(
                    icon: DailyCheckInStore.energyIcons[today.energy - 1],
                    label: DailyCheckInStore.energyLabels[today.energy - 1],
                    color: today.energy >= 2 ? .green : .orange
                )
                statPill(
                    icon: "circle.fill",
                    label: DailyCheckInStore.stressLabels[today.stress - 1],
                    color: DailyCheckInStore.stressColors[today.stress - 1]
                )
            }

            if !today.intention.isEmpty {
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: "target")
                        .font(.system(size: 11))
                        .foregroundStyle(accent.opacity(0.7))
                        .padding(.top, 1)
                    Text(today.intention)
                        .font(.system(size: 12, weight: .medium, design: .serif))
                        .italic()
                        .foregroundStyle(.primary.opacity(0.85))
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                    Spacer(minLength: 0)
                }
                .padding(.top, 2)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
    }

    private func statPill(icon: String, label: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.primary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(color.opacity(0.12))
        )
    }
}

#if DEBUG
#Preview("CTA") {
    CheckInSummaryCard(accent: .indigo)
        .padding()
        .background(Color.systemBackground)
        .onAppear { DailyCheckInStore.shared.clearForTesting() }
}

#Preview("Completed") {
    CheckInSummaryCard(accent: .indigo)
        .padding()
        .background(Color.systemBackground)
        .onAppear {
            DailyCheckInStore.shared.save(.init(
                mood: 4, energy: 2, stress: 2,
                intention: "Finish the React Hooks chapter and commit.",
                date: Config.todayString(),
                completedAt: Date()
            ))
        }
}
#endif
