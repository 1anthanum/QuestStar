import Foundation
import SwiftUI

/// Stores the user's personal mantra — a self-written sentence that surfaces
/// at meaningful moments (app open, after celebration, on streak warning).
/// Like a private inner voice, captured in their own words.
@MainActor
final class MantraStore: ObservableObject {
    static let shared = MantraStore()

    @Published var mantra: String {
        didSet {
            defaults.set(mantra, forKey: key)
        }
    }

    private let defaults = UserDefaults.standard
    private let key = "quicktrack_personal_mantra"

    private init() {
        mantra = defaults.string(forKey: key) ?? ""
    }

    var hasMantra: Bool { !mantra.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
}
