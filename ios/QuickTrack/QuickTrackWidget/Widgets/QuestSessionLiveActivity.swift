import WidgetKit
import SwiftUI
#if os(iOS)
import ActivityKit
#endif

#if os(iOS)
@available(iOS 16.2, *)
struct QuestSessionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: QuestSessionAttributes.self) { context in
            // MARK: - Lock screen view
            LockScreenView(
                attributes: context.attributes,
                state: context.state
            )
            .activityBackgroundTint(Color(hex: context.attributes.themeAccentHex).opacity(0.15))
            .activitySystemActionForegroundColor(Color(hex: context.attributes.themeAccentHex))

        } dynamicIsland: { context in
            // MARK: - Dynamic Island
            DynamicIsland {
                // Expanded — split into regions
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Image(systemName: "scroll.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Color(hex: context.attributes.themeAccentHex))
                        Text(context.attributes.questName)
                            .font(.system(size: 13, weight: .bold))
                            .lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(.orange)
                        Text("\(context.state.streak)d")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    let progress = context.attributes.totalSteps > 0
                        ? Double(context.state.doneSteps) / Double(context.attributes.totalSteps)
                        : 0
                    ProgressView(value: progress)
                        .tint(Color(hex: context.attributes.themeAccentHex))
                        .frame(maxWidth: .infinity)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                        Text(context.state.currentStepText)
                            .font(.system(size: 12, weight: .medium))
                            .lineLimit(1)
                        Spacer()
                        Text("\(context.state.doneSteps)/\(context.attributes.totalSteps)")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "scroll.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(Color(hex: context.attributes.themeAccentHex))
            } compactTrailing: {
                let progress = context.attributes.totalSteps > 0
                    ? Double(context.state.doneSteps) / Double(context.attributes.totalSteps)
                    : 0
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: context.attributes.themeAccentHex))
            } minimal: {
                Image(systemName: "scroll.fill")
                    .font(.system(size: 11))
                    .foregroundStyle(Color(hex: context.attributes.themeAccentHex))
            }
            .widgetURL(URL(string: "quicktrack://quest/\(context.attributes.questId)"))
            .keylineTint(Color(hex: context.attributes.themeAccentHex))
        }
    }
}

// MARK: - Lock Screen View

@available(iOS 16.1, *)
private struct LockScreenView: View {
    let attributes: QuestSessionAttributes
    let state: QuestSessionAttributes.SessionState

    private var accent: Color { Color(hex: attributes.themeAccentHex) }
    private var progress: Double {
        attributes.totalSteps > 0
            ? Double(state.doneSteps) / Double(attributes.totalSteps)
            : 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header
            HStack(spacing: 6) {
                Image(systemName: "scroll.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(accent)
                Text(attributes.questName)
                    .font(.system(size: 13, weight: .bold))
                    .lineLimit(1)
                Spacer()
                HStack(spacing: 3) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 10))
                    Text("\(state.streak)d")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                }
                .foregroundStyle(.orange)
            }

            // Progress
            HStack(spacing: 8) {
                Text("\(state.doneSteps)")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(accent)
                Text("of \(attributes.totalSteps)")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(state.xp) XP")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.yellow)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.yellow.opacity(0.15), in: Capsule())
            }

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(accent.opacity(0.15))
                        .frame(height: 6)
                    Capsule()
                        .fill(accent)
                        .frame(width: max(6, geo.size.width * progress), height: 6)
                }
            }
            .frame(height: 6)

            // Next step
            HStack(spacing: 6) {
                Image(systemName: "arrow.right.circle.fill")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                Text(state.currentStepText)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
            }
        }
        .padding(12)
    }
}
#endif
