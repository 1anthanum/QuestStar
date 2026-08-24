import WidgetKit
import SwiftUI

@main
struct QuickTrackWidgetBundle: WidgetBundle {
    var body: some Widget {
        MedicationWidget()
        WaterWidget()
        QuestStarWidget()
        SleepWidget()
        DailyProgressWidget()

        // Live Activity (iOS 16.2+, ActivityKit not available on macOS)
        #if os(iOS)
        if #available(iOS 16.2, *) {
            QuestSessionLiveActivity()
        }
        #endif
    }
}
