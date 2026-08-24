import Foundation
import os

/// Queues failed Supabase write operations and retries them with exponential backoff.
/// Works alongside SyncManager's optimistic UI — the UI stays optimistic while retries happen.
/// After max retries, triggers a full refresh to revert to server truth.
@MainActor
final class RetryQueue: ObservableObject {

    static let shared = RetryQueue()

    private let logger = Logger(subsystem: "QuickTrack", category: "RetryQueue")

    @Published private(set) var pendingCount: Int = 0
    @Published private(set) var isRetrying: Bool = false
    @Published private(set) var lastError: String?

    private var queue: [RetryItem] = []
    private var retryTask: Task<Void, Never>?

    private let maxRetries = 3
    private let baseDelay: TimeInterval = 2.0 // seconds, doubles each retry

    /// True if there are pending writes that haven't been confirmed by the server.
    var hasPending: Bool { pendingCount > 0 }

    // MARK: - Queue a failed operation

    /// Enqueue a failed write for retry. Pass the async closure that performs the write.
    /// `revert` is called if all retries exhaust (triggers full refresh).
    func enqueue(
        label: String,
        operation: @escaping @MainActor () async throws -> Void,
        revert: @escaping @MainActor () async -> Void
    ) {
        let item = RetryItem(
            label: label,
            operation: operation,
            revert: revert,
            retryCount: 0
        )
        queue.append(item)
        pendingCount = queue.count
        lastError = "Offline — \(pendingCount) pending write\(pendingCount == 1 ? "" : "s")"
        logger.warning("Queued retry: \(label) (pending: \(self.queue.count))")
        scheduleRetry()
    }

    /// Manually trigger retry of all pending items (e.g. user taps "Retry" button).
    func retryNow() {
        retryTask?.cancel()
        processQueue()
    }

    /// Clear all pending items (e.g. on logout).
    func clear() {
        retryTask?.cancel()
        queue.removeAll()
        pendingCount = 0
        isRetrying = false
        lastError = nil
    }

    // MARK: - Internal

    private struct RetryItem {
        let label: String
        let operation: @MainActor () async throws -> Void
        let revert: @MainActor () async -> Void
        var retryCount: Int
    }

    private func scheduleRetry() {
        guard retryTask == nil else { return }
        let delay = baseDelay
        retryTask = Task {
            try? await Task.sleep(for: .seconds(delay))
            guard !Task.isCancelled else { return }
            processQueue()
        }
    }

    private func processQueue() {
        retryTask = nil
        guard !queue.isEmpty, !isRetrying else { return }
        isRetrying = true

        Task {
            var remaining: [RetryItem] = []

            for var item in queue {
                do {
                    try await item.operation()
                    logger.info("Retry succeeded: \(item.label)")
                } catch {
                    item.retryCount += 1
                    if item.retryCount >= maxRetries {
                        logger.error("Max retries reached for: \(item.label), reverting")
                        await item.revert()
                    } else {
                        remaining.append(item)
                        logger.warning("Retry \(item.retryCount)/\(self.maxRetries) failed for: \(item.label)")
                    }
                }
            }

            queue = remaining
            pendingCount = queue.count
            isRetrying = false

            if queue.isEmpty {
                lastError = nil
            } else {
                let delay = baseDelay * pow(2.0, Double(queue.first?.retryCount ?? 0))
                lastError = "Retrying in \(Int(delay))s — \(pendingCount) pending"
                retryTask = Task {
                    try? await Task.sleep(for: .seconds(delay))
                    guard !Task.isCancelled else { return }
                    processQueue()
                }
            }
        }
    }
}
