import SwiftUI

struct WaterCardView: View {
    @ObservedObject var sync: SyncManager
    @Binding var waterBounce: String?

    var body: some View {
        let todayKey = SyncManager.todayString()
        let todayChecks = sync.habits?.daily_checks?[todayKey] ?? [:]
        let completedCount = WaterAdapter.intervals.filter { todayChecks[$0.id] == true }.count
        let waterProgress = Double(completedCount) / 3.0

        GradientCard(accent: .cyan) {
            VStack(spacing: 12) {
                HStack {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [.cyan.opacity(0.2), .blue.opacity(0.1)],
                                                  startPoint: .top, endPoint: .bottom)
                                )
                                .frame(width: 30, height: 30)
                            Image(systemName: "drop.fill")
                                .font(.system(size: 13))
                                .foregroundStyle(
                                    LinearGradient(colors: [.cyan, .blue], startPoint: .top, endPoint: .bottom)
                                )
                        }
                        Text("Water")
                            .font(.subheadline.bold())
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .stroke(Color.cyan.opacity(0.12), lineWidth: 3)
                        Circle()
                            .trim(from: 0, to: waterProgress)
                            .stroke(Color.cyan, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        Text("\(completedCount)/3")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundStyle(.cyan)
                    }
                    .frame(width: 30, height: 30)
                }

                HStack(spacing: 10) {
                    ForEach(WaterAdapter.intervals, id: \.id) { interval in
                        let done = todayChecks[interval.id] == true
                        let isBouncing = waterBounce == interval.id
                        AnimatedButton {
                            #if os(iOS)
                            HapticEngine.selection()
                            #endif
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.4)) {
                                waterBounce = interval.id
                            }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                                waterBounce = nil
                            }
                            Task { await sync.toggleCheck(interval.id) }
                        } label: {
                            VStack(spacing: 6) {
                                ZStack {
                                    Circle()
                                        .fill(done
                                              ? LinearGradient(colors: [.cyan, .blue.opacity(0.8)], startPoint: .top, endPoint: .bottom)
                                              : LinearGradient(colors: [.cyan.opacity(0.3), .blue.opacity(0.2)], startPoint: .top, endPoint: .bottom)
                                        )
                                        .frame(width: 48, height: 48)
                                    Circle()
                                        .stroke(
                                            done
                                                ? LinearGradient(colors: [.cyan, .blue], startPoint: .top, endPoint: .bottom)
                                                : LinearGradient(colors: [.cyan.opacity(0.5), .blue.opacity(0.3)], startPoint: .top, endPoint: .bottom),
                                            lineWidth: done ? 2.5 : 1.5
                                        )
                                        .frame(width: 48, height: 48)
                                    Image(systemName: done ? "drop.fill" : "drop")
                                        .font(.system(size: 18))
                                        .foregroundStyle(
                                            done
                                                ? LinearGradient(colors: [.white, .white.opacity(0.9)], startPoint: .top, endPoint: .bottom)
                                                : LinearGradient(colors: [.cyan.opacity(0.7), .blue.opacity(0.5)], startPoint: .top, endPoint: .bottom)
                                        )
                                    if done {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 12))
                                            .foregroundStyle(.white)
                                            .background(Circle().fill(.cyan).frame(width: 12, height: 12))
                                            .offset(x: 14, y: 14)
                                    }
                                }
                                .scaleEffect(isBouncing ? 1.15 : 1.0)

                                Text(interval.label)
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(done ? .cyan : .secondary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .accessibilityLabel("\(interval.label) water, \(done ? "checked" : "not checked")")
                        .accessibilityHint(done ? "Double tap to uncheck" : "Double tap to mark drunk")
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Water tracking, \(completedCount) of 3 complete")
    }
}

#if DEBUG
#Preview("Water Card") {
    WaterCardView(
        sync: SyncManager.samplePopulated(),
        waterBounce: .constant(nil)
    )
    .padding()
    .background(Color.systemBackground)
}
#endif
