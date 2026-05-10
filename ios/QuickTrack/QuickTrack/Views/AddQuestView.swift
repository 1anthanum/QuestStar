import SwiftUI

struct AddQuestView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var stepsText = ""
    @State private var tag = ""
    @State private var isSaving = false
    @State private var showSuccess = false

    let onSaved: () async -> Void

    private let client = SupabaseClient.shared
    private let accent = Color(hex: "#6366F1")
    private let accentGradient = LinearGradient(
        colors: [Color(hex: "#6366F1"), Color(hex: "#8B5CF6")],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    var body: some View {
        NavigationStack {
            ZStack {
                MeshBackground()

                ScrollView {
                    VStack(spacing: 24) {
                        // Hero icon
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [accent.opacity(0.1), .purple.opacity(0.05)],
                                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                                .frame(width: 70, height: 70)
                            Image(systemName: "scroll.fill")
                                .font(.system(size: 28))
                                .foregroundStyle(accentGradient)
                        }
                        .padding(.top, 8)

                        // Quest name
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 6) {
                                Image(systemName: "pencil.line")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(accent)
                                Text("Quest Name")
                                    .font(.subheadline.bold())
                            }
                            TextField("What will you conquer?", text: $name)
                                .font(.body)
                                .padding(14)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(Color(.systemBackground).opacity(0.8))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 14)
                                                .stroke(
                                                    name.isEmpty
                                                        ? Color(.systemGray4).opacity(0.5)
                                                        : accent.opacity(0.4),
                                                    lineWidth: 1.5
                                                )
                                        )
                                        .shadow(color: name.isEmpty ? .clear : accent.opacity(0.1), radius: 8, y: 4)
                                )
                        }

                        // Tag
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 6) {
                                Image(systemName: "tag.fill")
                                    .font(.system(size: 12))
                                    .foregroundStyle(.secondary)
                                Text("Tag (optional)")
                                    .font(.subheadline.bold())
                                    .foregroundStyle(.secondary)
                            }
                            TextField("e.g. Week 1, Chapter 3...", text: $tag)
                                .font(.body)
                                .padding(14)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(Color(.systemBackground).opacity(0.8))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 14)
                                                .stroke(Color(.systemGray4).opacity(0.5), lineWidth: 1)
                                        )
                                )
                        }

                        // Steps
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(spacing: 6) {
                                Image(systemName: "list.bullet.indent")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(accent)
                                Text("Steps")
                                    .font(.subheadline.bold())
                            }

                            TextEditor(text: $stepsText)
                                .font(.body)
                                .frame(minHeight: 160)
                                .padding(12)
                                .scrollContentBackground(.hidden)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(Color(.systemBackground).opacity(0.8))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 14)
                                                .stroke(
                                                    stepsText.isEmpty
                                                        ? Color(.systemGray4).opacity(0.5)
                                                        : accent.opacity(0.4),
                                                    lineWidth: 1.5
                                                )
                                        )
                                        .shadow(color: stepsText.isEmpty ? .clear : accent.opacity(0.1), radius: 8, y: 4)
                                )

                            // Difficulty legend
                            HStack(spacing: 10) {
                                difficultyChip("e", "Easy", .green, "leaf.fill")
                                difficultyChip("m", "Med", .orange, "flame.fill")
                                difficultyChip("h", "Hard", .red, "bolt.fill")
                            }

                            Text("One step per line. Prefix with [e] [m] [h] to set difficulty.")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }

                        // Preview count
                        if !stepsText.isEmpty {
                            let lineCount = stepsText.components(separatedBy: .newlines)
                                .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count
                            HStack(spacing: 6) {
                                Image(systemName: "number.circle.fill")
                                    .font(.caption)
                                    .foregroundStyle(accent)
                                Text("\(lineCount) step\(lineCount == 1 ? "" : "s")")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(accent.opacity(0.06), in: Capsule())
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .navigationTitle("New Quest")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await createQuest() }
                    } label: {
                        HStack(spacing: 5) {
                            if isSaving {
                                ProgressView()
                                    .scaleEffect(0.6)
                                    .tint(.white)
                            } else {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 11, weight: .bold))
                            }
                            Text("Create")
                                .font(.subheadline.bold())
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(canCreate ? accentGradient : LinearGradient(colors: [.gray.opacity(0.3), .gray.opacity(0.2)], startPoint: .leading, endPoint: .trailing))
                                .shadow(color: canCreate ? accent.opacity(0.3) : .clear, radius: 8, y: 4)
                        )
                    }
                    .disabled(!canCreate || isSaving)
                }
            }
            .overlay {
                if showSuccess {
                    successOverlay
                }
            }
        }
    }

    private var canCreate: Bool {
        !name.isEmpty && !stepsText.isEmpty
    }

    @ViewBuilder
    private func difficultyChip(_ prefix: String, _ label: String, _ color: Color, _ icon: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 9))
            Text("[\(prefix)] \(label)")
                .font(.system(size: 10, weight: .semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(color.opacity(0.1), in: Capsule())
    }

    private var successOverlay: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color.green.opacity(0.15))
                        .frame(width: 80, height: 80)
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.green)
                }
                Text("Quest Created!")
                    .font(.title3.bold())
                Text("May your journey be legendary")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(36)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24))
            .shadow(color: .black.opacity(0.1), radius: 20, y: 10)
            .transition(.scale(scale: 0.8).combined(with: .opacity))
        }
    }

    private func createQuest() async {
        guard let userId = AppGroupManager.shared.supabaseUserId else { return }
        isSaving = true

        let lines = stepsText.components(separatedBy: .newlines).filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        let steps: [[String: Any]] = lines.enumerated().map { index, line in
            let (text, difficulty) = parseLine(line)
            return [
                "id": "\(Int(Date().timeIntervalSince1970 * 1000))_\(index)",
                "text": text,
                "done": false,
                "difficulty": difficulty
            ]
        }

        let questId = "\(Int(Date().timeIntervalSince1970 * 1000))"
        let body: [String: Any] = [
            "id": questId,
            "user_id": userId,
            "name": name,
            "tag": tag.isEmpty ? NSNull() : tag,
            "category": "learning",
            "quest_type": "daily",
            "steps": steps,
            "created_at": Int(Date().timeIntervalSince1970 * 1000)
        ]

        do {
            try await client.upsert(table: "quests", body: body)
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                showSuccess = true
            }
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            await onSaved()
            dismiss()
        } catch {
            isSaving = false
        }
    }

    private func parseLine(_ line: String) -> (text: String, difficulty: String) {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        if trimmed.hasPrefix("[e]") || trimmed.hasPrefix("[E]") {
            return (String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces), "easy")
        }
        if trimmed.hasPrefix("[m]") || trimmed.hasPrefix("[M]") {
            return (String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces), "medium")
        }
        if trimmed.hasPrefix("[h]") || trimmed.hasPrefix("[H]") {
            return (String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces), "hard")
        }
        return (trimmed, "medium")
    }
}
