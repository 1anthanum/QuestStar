import SwiftUI

struct AddQuestView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared
    @State private var name = ""
    @State private var stepsText = ""
    @State private var tag = ""
    @State private var selectedCategory: QuestCategory = .learning
    @State private var selectedType: QuestType = .daily
    @State private var hasDeadline = false
    @State private var deadline = Date().addingTimeInterval(7 * 86400) // default 1 week
    @State private var isSaving = false
    @State private var showSuccess = false

    let onSaved: () async -> Void

    private let client = SupabaseClient.shared
    private var accent: Color { theme.current.accent }
    private var accentGradient: LinearGradient { theme.accentGradient }

    enum QuestCategory: String, CaseIterable {
        case learning, code, work, habit

        var icon: String {
            switch self {
            case .learning: "book.fill"
            case .code: "chevron.left.forwardslash.chevron.right"
            case .work: "briefcase.fill"
            case .habit: "heart.fill"
            }
        }

        var color: Color {
            switch self {
            case .learning: Color(hex: "#6366F1")
            case .code: Color(hex: "#10B981")
            case .work: Color(hex: "#F59E0B")
            case .habit: Color(hex: "#EC4899")
            }
        }
    }

    enum QuestType: String, CaseIterable {
        case daily, bonus, challenge

        var icon: String {
            switch self {
            case .daily: "sun.max.fill"
            case .bonus: "star.fill"
            case .challenge: "flame.fill"
            }
        }

        var multiplier: String {
            switch self {
            case .daily: "1x"
            case .bonus: "1.5x"
            case .challenge: "2x"
            }
        }

        var color: Color {
            switch self {
            case .daily: .blue
            case .bonus: .orange
            case .challenge: .red
            }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                MeshBackground()

                ScrollView {
                    VStack(spacing: 24) {
                        // Hero icon — reflects selected category
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [selectedCategory.color.opacity(0.15), selectedCategory.color.opacity(0.05)],
                                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                                .frame(width: 70, height: 70)
                            Image(systemName: selectedCategory.icon)
                                .font(.system(size: 28))
                                .foregroundStyle(
                                    LinearGradient(colors: [selectedCategory.color, selectedCategory.color.opacity(0.7)],
                                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                        }
                        .padding(.top, 8)
                        .animation(.spring(response: 0.3), value: selectedCategory)

                        // Quest name
                        VStack(alignment: .leading, spacing: 8) {
                            sectionLabel(icon: "pencil.line", text: "Quest Name", color: accent)
                            TextField("What will you conquer?", text: $name)
                                .font(.body)
                                .padding(14)
                                .background(inputBackground(active: !name.isEmpty))
                        }

                        // Category picker
                        VStack(alignment: .leading, spacing: 10) {
                            sectionLabel(icon: "square.grid.2x2.fill", text: "Category", color: accent)
                            HStack(spacing: 8) {
                                ForEach(QuestCategory.allCases, id: \.self) { cat in
                                    categoryChip(cat)
                                }
                            }
                        }

                        // Quest type picker
                        VStack(alignment: .leading, spacing: 10) {
                            sectionLabel(icon: "bolt.circle.fill", text: "Quest Type", color: accent)
                            HStack(spacing: 8) {
                                ForEach(QuestType.allCases, id: \.self) { type in
                                    typeChip(type)
                                }
                            }
                        }

                        // Tag
                        VStack(alignment: .leading, spacing: 8) {
                            sectionLabel(icon: "tag.fill", text: "Tag (optional)", color: .secondary)
                            TextField("e.g. Week 1, Chapter 3...", text: $tag)
                                .font(.body)
                                .padding(14)
                                .background(inputBackground(active: false))
                        }

                        // Deadline
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                sectionLabel(icon: "calendar.badge.clock", text: "Deadline", color: hasDeadline ? .orange : .secondary)
                                Spacer()
                                Toggle("", isOn: $hasDeadline)
                                    .labelsHidden()
                                    .tint(accent)
                            }

                            if hasDeadline {
                                DatePicker("", selection: $deadline, in: Date()..., displayedComponents: .date)
                                    .datePickerStyle(.graphical)
                                    .tint(accent)
                                    .padding(12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(Color.systemBackground.opacity(0.8))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 14)
                                                    .stroke(accent.opacity(0.2), lineWidth: 1)
                                            )
                                    )
                                    .transition(.opacity.combined(with: .move(edge: .top)))
                            }
                        }
                        .animation(.spring(response: 0.3), value: hasDeadline)

                        // Steps
                        VStack(alignment: .leading, spacing: 10) {
                            sectionLabel(icon: "list.bullet.indent", text: "Steps", color: accent)

                            TextEditor(text: $stepsText)
                                .font(.body)
                                .frame(minHeight: 160)
                                .padding(12)
                                .scrollContentBackground(.hidden)
                                .background(inputBackground(active: !stepsText.isEmpty))

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
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
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

    // MARK: - Subviews

    private func sectionLabel(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(color)
            Text(text)
                .font(.subheadline.bold())
                .foregroundStyle(color == .secondary ? .secondary : .primary)
        }
    }

    private func inputBackground(active: Bool) -> some View {
        RoundedRectangle(cornerRadius: 14)
            .fill(Color.systemBackground.opacity(0.8))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(
                        active ? accent.opacity(0.4) : Color.systemGray4.opacity(0.5),
                        lineWidth: active ? 1.5 : 1
                    )
            )
            .shadow(color: active ? accent.opacity(0.1) : .clear, radius: 8, y: 4)
    }

    @ViewBuilder
    private func categoryChip(_ cat: QuestCategory) -> some View {
        let selected = selectedCategory == cat
        Button {
            withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                selectedCategory = cat
            }
        } label: {
            VStack(spacing: 6) {
                Image(systemName: cat.icon)
                    .font(.system(size: 16))
                Text(cat.rawValue.capitalized)
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(selected ? .white : cat.color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(selected
                          ? AnyShapeStyle(LinearGradient(colors: [cat.color, cat.color.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing))
                          : AnyShapeStyle(cat.color.opacity(0.08)))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(selected ? .clear : cat.color.opacity(0.2), lineWidth: 1)
            )
            .shadow(color: selected ? cat.color.opacity(0.3) : .clear, radius: 8, y: 4)
            .scaleEffect(selected ? 1.02 : 1.0)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func typeChip(_ type: QuestType) -> some View {
        let selected = selectedType == type
        Button {
            withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                selectedType = type
            }
        } label: {
            VStack(spacing: 5) {
                HStack(spacing: 4) {
                    Image(systemName: type.icon)
                        .font(.system(size: 13))
                    Text(type.rawValue.capitalized)
                        .font(.system(size: 11, weight: .semibold))
                }
                Text("XP \(type.multiplier)")
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .foregroundStyle(selected ? .white.opacity(0.8) : type.color.opacity(0.6))
            }
            .foregroundStyle(selected ? .white : type.color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(selected
                          ? AnyShapeStyle(LinearGradient(colors: [type.color, type.color.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing))
                          : AnyShapeStyle(type.color.opacity(0.08)))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selected ? .clear : type.color.opacity(0.2), lineWidth: 1)
            )
            .shadow(color: selected ? type.color.opacity(0.3) : .clear, radius: 8, y: 4)
            .scaleEffect(selected ? 1.02 : 1.0)
        }
        .buttonStyle(.plain)
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

    // MARK: - Create

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
        var body: [String: Any] = [
            "id": questId,
            "user_id": userId,
            "name": name,
            "tag": tag.isEmpty ? NSNull() : tag,
            "category": selectedCategory.rawValue,
            "quest_type": selectedType.rawValue,
            "steps": steps,
            "created_at": Int(Date().timeIntervalSince1970 * 1000)
        ]

        if hasDeadline {
            let fmt = DateFormatter()
            fmt.dateFormat = "yyyy-MM-dd"
            fmt.locale = Locale(identifier: "en_US_POSIX")
            body["deadline"] = fmt.string(from: deadline)
        }

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
