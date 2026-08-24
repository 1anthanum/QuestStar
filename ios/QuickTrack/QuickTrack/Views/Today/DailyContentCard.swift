import SwiftUI

/// Alternates daily between an inspirational quote and an ADHD productivity tip.
/// Breaks up the visual monotony of the TodayView with text content variety.
struct DailyContentCard: View {
    let accent: Color

    private var content: DailyContentEngine.DailyContent {
        DailyContentEngine.todaysCard()
    }

    var body: some View {
        switch content {
        case .quote(let text, let author):
            quoteCard(text: text, author: author)
        case .tip(let text):
            tipCard(text: text)
        }
    }

    // MARK: - Quote Card

    private func quoteCard(text: String, author: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "quote.opening")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(accent)
                Text("Today's Wisdom")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Spacer()
            }

            Text(text)
                .font(.system(size: 14, weight: .semibold, design: .serif))
                .italic()
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
                .lineSpacing(2)

            HStack {
                Spacer()
                Text("— \(author)")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            LinearGradient(
                                colors: [accent.opacity(0.3), accent.opacity(0.05)],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }

    // MARK: - Tip Card

    private func tipCard(text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.yellow.opacity(0.15))
                    .frame(width: 36, height: 36)
                Image(systemName: "lightbulb.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(.yellow)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("ADHD Tip")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)

                Text(text)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                    .lineSpacing(1)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.yellow.opacity(0.2), lineWidth: 1)
                )
        )
    }
}

#if DEBUG
#Preview("Quote") {
    DailyContentCard(accent: .indigo)
        .padding()
        .background(Color.systemBackground)
}
#endif
