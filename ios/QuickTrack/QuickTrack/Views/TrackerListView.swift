import SwiftUI

struct TrackerListView: View {
    @State private var summaries: [String: TrackerSummary] = [:]
    @State private var errors: [String: String] = [:]
    @State private var isLoading = false

    private let adapters: [any TrackerDataSource] = [
        MedicationAdapter(),
        QuestStarAdapter(),
        SleepAdapter()
    ]

    var body: some View {
        List {
            if !AppGroupManager.shared.isAuthenticated {
                Section {
                    Label("Sign in from Settings to see your data", systemImage: "person.crop.circle.badge.exclamationmark")
                        .foregroundStyle(.secondary)
                }
            }

            ForEach(Tracker.allTrackers) { tracker in
                Section {
                    trackerCard(tracker)
                }
            }
        }
        .navigationTitle("QuickTrack")
        .refreshable {
            await refreshAll()
        }
        .task {
            if summaries.isEmpty {
                await refreshAll()
            }
        }
    }

    // MARK: - Tracker Card

    @ViewBuilder
    private func trackerCard(_ tracker: Tracker) -> some View {
        if let summary = summaries[tracker.id] {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label(tracker.displayName, systemImage: tracker.icon)
                        .font(.headline)
                        .foregroundStyle(Color(hex: tracker.color))

                    Spacer()

                    if let progress = summary.progress {
                        progressRing(progress: progress, color: Color(hex: tracker.color))
                    }
                }

                Text(summary.label)
                    .font(.title3.bold())

                if let subtitle = summary.subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if let items = summary.actionItems, !items.isEmpty {
                    Divider()
                    ForEach(items.prefix(3)) { item in
                        Label(item.label, systemImage: item.isCompleted ? "checkmark.circle.fill" : "circle")
                            .font(.caption)
                            .foregroundStyle(item.isCompleted ? .secondary : .primary)
                    }
                }
            }
            .padding(.vertical, 4)
        } else if let error = errors[tracker.id] {
            VStack(alignment: .leading, spacing: 4) {
                Label(tracker.displayName, systemImage: tracker.icon)
                    .font(.headline)
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        } else if isLoading {
            HStack {
                Label(tracker.displayName, systemImage: tracker.icon)
                    .font(.headline)
                Spacer()
                ProgressView()
            }
        } else {
            Label(tracker.displayName, systemImage: tracker.icon)
                .font(.headline)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Progress Ring

    private func progressRing(progress: Double, color: Color) -> some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.2), lineWidth: 4)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(Int(progress * 100))%")
                .font(.caption2.bold())
        }
        .frame(width: 44, height: 44)
    }

    // MARK: - Data Loading

    private func refreshAll() async {
        isLoading = true
        await withTaskGroup(of: (String, Result<TrackerSummary, Error>).self) { group in
            for adapter in adapters {
                group.addTask {
                    do {
                        let summary = try await adapter.fetchSummary()
                        return (adapter.trackerId, .success(summary))
                    } catch {
                        return (adapter.trackerId, .failure(error))
                    }
                }
            }
            for await (id, result) in group {
                switch result {
                case .success(let summary):
                    summaries[id] = summary
                    errors.removeValue(forKey: id)
                case .failure(let error):
                    errors[id] = error.localizedDescription
                }
            }
        }
        isLoading = false
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255.0
        let g = Double((int >> 8) & 0xFF) / 255.0
        let b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
