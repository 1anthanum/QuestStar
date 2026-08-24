import SwiftUI

/// Banner card shown above a quest's step list when no commitment for today exists.
/// Lets the user commit to "just N steps" before facing the full list.
///
/// Once committed, transforms into a progress indicator showing N/target done.
struct MicroCommitmentCard: View {
    let quest: QuestRow
    let accent: Color
    @ObservedObject private var store = MicroCommitmentStore.shared

    private var currentDone: Int {
        quest.steps.filter(\.done).count
    }

    private var commitment: MicroCommitment? {
        store.commitment(for: quest.id)
    }

    var body: some View {
        if let c = commitment {
            progressView(c)
        } else if !quest.isComplete {
            commitPrompt
        }
    }

    // MARK: - Prompt (no active commitment)

    private var commitPrompt: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "target")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(accent)
                Text("Pick a tiny target")
                    .font(.subheadline.bold())
            }

            Text("How many steps will you do right now? Small wins compound.")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 8) {
                commitButton(target: 1, label: "1", subtitle: "is enough")
                commitButton(target: 3, label: "3", subtitle: "steps")
                commitButton(target: 5, label: "5", subtitle: "steps")
                commitButton(target: 0, label: "∞", subtitle: "no limit")
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(accent.opacity(0.25), lineWidth: 1)
                )
        )
    }

    private func commitButton(target: Int, label: String, subtitle: String) -> some View {
        Button {
            #if os(iOS)
            HapticEngine.commitmentSet()
            #endif
            withAnimation(.spring(response: 0.3)) {
                store.setCommitment(for: quest.id, target: target, currentDone: currentDone)
            }
        } label: {
            VStack(spacing: 2) {
                Text(label)
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(accent)
                Text(subtitle)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(accent.opacity(0.08))
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Progress (active commitment)

    @ViewBuilder
    private func progressView(_ c: MicroCommitment) -> some View {
        let done = c.progress(currentDone: currentDone)
        let target = c.target
        let isHit = c.isHit(currentDone: currentDone)

        HStack(spacing: 12) {
            ZStack {
                if target > 0 {
                    Circle()
                        .stroke(accent.opacity(0.15), lineWidth: 4)
                        .frame(width: 40, height: 40)
                    Circle()
                        .trim(from: 0, to: min(Double(done) / Double(target), 1.0))
                        .stroke(
                            isHit ? Color.green : accent,
                            style: StrokeStyle(lineWidth: 4, lineCap: .round)
                        )
                        .frame(width: 40, height: 40)
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.4), value: done)
                    Image(systemName: isHit ? "checkmark" : "target")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(isHit ? .green : accent)
                } else {
                    // "Any" / unlimited mode
                    Image(systemName: "infinity")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(accent)
                        .frame(width: 40, height: 40)
                        .background(accent.opacity(0.1), in: Circle())
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                if target == 0 {
                    Text("\(done) step\(done == 1 ? "" : "s") so far")
                        .font(.system(size: 13, weight: .bold))
                    Text("Open-ended session")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                } else if isHit {
                    Text("Target hit! \(done)/\(target)")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.green)
                    Text("Keep going or stop guilt-free")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                } else {
                    Text("\(done)/\(target) steps committed")
                        .font(.system(size: 13, weight: .bold))
                    Text("\(target - done) more to your target")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Button {
                #if os(iOS)
                HapticEngine.selection()
                #endif
                withAnimation {
                    store.clear(questId: quest.id)
                }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(.tertiary)
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke((isHit ? Color.green : accent).opacity(0.3), lineWidth: 1)
                )
        )
    }
}

#if DEBUG
#Preview("No Commitment") {
    MicroCommitmentCard(quest: .sampleLearning, accent: .indigo)
        .padding()
        .background(Color.systemBackground)
        .onAppear {
            // Clear any test commitment
            MicroCommitmentStore.shared.clear(questId: QuestRow.sampleLearning.id)
        }
}

#Preview("Active - 1/3") {
    MicroCommitmentCard(quest: .sampleLearning, accent: .indigo)
        .padding()
        .background(Color.systemBackground)
        .onAppear {
            MicroCommitmentStore.shared.setCommitment(
                for: QuestRow.sampleLearning.id,
                target: 3,
                currentDone: 0
            )
        }
}

#Preview("Target Hit") {
    MicroCommitmentCard(quest: .sampleLearning, accent: .indigo)
        .padding()
        .background(Color.systemBackground)
        .onAppear {
            // Baseline 0, currentDone 1 (sampleLearning has 1 done step), target 1 → hit
            MicroCommitmentStore.shared.setCommitment(
                for: QuestRow.sampleLearning.id,
                target: 1,
                currentDone: 0
            )
        }
}
#endif
