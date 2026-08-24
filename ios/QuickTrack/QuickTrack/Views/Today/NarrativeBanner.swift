import SwiftUI

/// A tight, evocative one-liner that opens TodayView — rotates daily.
/// Sets the tone: "you're not opening a todo app, you're entering a story."
struct NarrativeBanner: View {
    let accent: Color

    @State private var twinkle = false
    @State private var displayedText: String = ""
    @State private var cursorVisible = true

    private var narrative: String {
        DailyContentEngine.todaysNarrative()
    }

    var body: some View {
        HStack(spacing: 10) {
            // Twinkling sparkle to draw eye
            Image(systemName: "sparkle")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(accent)
                .opacity(twinkle ? 1.0 : 0.5)
                .scaleEffect(twinkle ? 1.0 : 0.85)

            HStack(spacing: 0) {
                Text(displayedText)
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .italic()
                    .foregroundStyle(.primary.opacity(0.85))
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                // Blinking cursor while typing
                if displayedText.count < narrative.count {
                    Text("|")
                        .font(.system(size: 13, weight: .bold, design: .serif))
                        .foregroundStyle(accent)
                        .opacity(cursorVisible ? 1 : 0)
                }
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            LinearGradient(
                colors: [accent.opacity(0.08), accent.opacity(0.0)],
                startPoint: .leading, endPoint: .trailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                twinkle = true
            }
            startTypewriter()
            startCursorBlink()
        }
    }

    private func startTypewriter() {
        displayedText = ""
        let chars = Array(narrative)
        // Total animation duration: ~1.5 seconds
        let perCharDelay = max(0.02, 1.5 / Double(chars.count))

        for (i, c) in chars.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * perCharDelay) {
                displayedText.append(c)
            }
        }
    }

    private func startCursorBlink() {
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { timer in
            cursorVisible.toggle()
            if displayedText.count == narrative.count {
                timer.invalidate()
                cursorVisible = false
            }
        }
    }
}

#if DEBUG
#Preview("Narrative") {
    VStack(spacing: 12) {
        NarrativeBanner(accent: .indigo)
        NarrativeBanner(accent: .pink)
        NarrativeBanner(accent: .green)
    }
    .padding()
    .background(Color.systemBackground)
}
#endif
