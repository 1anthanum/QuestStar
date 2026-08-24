import SwiftUI

/// Wraps any view to support left/right swipe gestures with visual feedback.
/// Used for step rows where swipe-right = complete, swipe-left = delete.
///
/// Drag past `actionThreshold` (80pt) and release to trigger the action.
/// Releasing before threshold snaps back without action.
struct SwipeActionRow<Content: View>: View {
    let content: Content

    let leadingAction: SwipeAction?    // Swipe right (shown on the left side)
    let trailingAction: SwipeAction?   // Swipe left (shown on the right side)

    struct SwipeAction {
        let icon: String
        let color: Color
        let label: String
        let handler: () -> Void
    }

    init(
        leadingAction: SwipeAction? = nil,
        trailingAction: SwipeAction? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.leadingAction = leadingAction
        self.trailingAction = trailingAction
        self.content = content()
    }

    @State private var offset: CGFloat = 0
    @State private var isPressed = false
    @State private var thresholdHapticFired = false

    private let actionThreshold: CGFloat = 80
    private let maxOffset: CGFloat = 120

    var body: some View {
        ZStack {
            // Underlay action indicators
            HStack(spacing: 0) {
                if let leading = leadingAction, offset > 0 {
                    actionIndicator(action: leading, isReady: offset >= actionThreshold)
                        .frame(width: min(offset, maxOffset))
                        .frame(maxHeight: .infinity)
                        .background(leading.color.opacity(offset >= actionThreshold ? 0.9 : 0.4))
                    Spacer()
                }
                Spacer()
                if let trailing = trailingAction, offset < 0 {
                    actionIndicator(action: trailing, isReady: -offset >= actionThreshold)
                        .frame(width: min(-offset, maxOffset))
                        .frame(maxHeight: .infinity)
                        .background(trailing.color.opacity(-offset >= actionThreshold ? 0.9 : 0.4))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 18))

            // Main content
            content
                .offset(x: offset)
                .gesture(
                    DragGesture(minimumDistance: 20)
                        .onChanged { value in
                            // Only respect horizontal swipes (filter out vertical scrolls)
                            guard abs(value.translation.width) > abs(value.translation.height) else { return }
                            var dx = value.translation.width
                            // Clamp based on which action is configured
                            if dx > 0 && leadingAction == nil { dx = 0 }
                            if dx < 0 && trailingAction == nil { dx = 0 }
                            offset = max(-maxOffset, min(maxOffset, dx))

                            // Fire haptic once when crossing threshold (in either direction)
                            let absOffset = abs(offset)
                            if absOffset >= actionThreshold && !thresholdHapticFired {
                                thresholdHapticFired = true
                                #if os(iOS)
                                HapticEngine.swipeThreshold()
                                #endif
                            } else if absOffset < actionThreshold {
                                thresholdHapticFired = false
                            }
                        }
                        .onEnded { _ in
                            if offset >= actionThreshold, let leading = leadingAction {
                                #if os(iOS)
                                HapticEngine.stepComplete()
                                #endif
                                leading.handler()
                            } else if -offset >= actionThreshold, let trailing = trailingAction {
                                #if os(iOS)
                                HapticEngine.selection()
                                #endif
                                trailing.handler()
                            }
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                offset = 0
                            }
                            thresholdHapticFired = false
                        }
                )
        }
    }

    private func actionIndicator(action: SwipeAction, isReady: Bool) -> some View {
        VStack(spacing: 4) {
            Image(systemName: action.icon)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(.white)
            Text(action.label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.white)
        }
        .scaleEffect(isReady ? 1.1 : 1.0)
        .animation(.spring(response: 0.2), value: isReady)
    }
}
