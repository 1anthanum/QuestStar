import WidgetKit
import SwiftUI

@main
struct QuickTrackWidgetBundle: WidgetBundle {
    var body: some Widget {
        MedicationWidget()
        WaterWidget()
        QuestStarWidget()
        SleepWidget()
    }
}
