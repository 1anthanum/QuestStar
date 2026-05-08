import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            TrackerListView()
                .toolbar {
                    NavigationLink {
                        SettingsView()
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
        }
    }
}
