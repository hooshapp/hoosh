import SwiftUI
import DeviceActivity
import FamilyControls

private enum HistoryScreenPalette {
    static let background = Color(red: 1.0, green: 241 / 255, blue: 221 / 255)
    static let cardSurface = Color(red: 1.0, green: 250 / 255, blue: 241 / 255)
    static let primaryText = Color(red: 64 / 255, green: 41 / 255, blue: 0)
    static let secondaryText = Color(red: 130 / 255, green: 115 / 255, blue: 92 / 255)
    static let green = Color(red: 44 / 255, green: 198 / 255, blue: 83 / 255)
    static let border = Color(red: 235 / 255, green: 216 / 255, blue: 181 / 255)
    static let segmentTrack = Color(red: 241 / 255, green: 233 / 255, blue: 219 / 255)
}

struct HistoryDashboardHeaderBar: View {
    var body: some View {
        Text("HISTORY")
            .font(.system(size: 13, weight: .heavy))
            .tracking(1.6)
            .foregroundStyle(HistoryScreenPalette.primaryText)
            .frame(height: 72)
            .frame(maxWidth: .infinity)
            .background(HistoryScreenPalette.background)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(HistoryScreenPalette.border)
                    .frame(height: 1)
            }
    }
}

struct DashboardHistoryView:View {
    @State private var period:HistoryPeriod = .week
    @State private var now=Date()
    @State private var events:[HistoryTurnOff]=[]
    @State private var verifiedAt:Date?
    @State private var coverageStart:Date?
    @State private var selection=AppSelectionStore.load()
    @State private var reportRefresh=UUID()
    @State private var refreshFailed=false
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage(DatabaseService.statusKey,store:ShieldPresentationStore.defaults) private var syncStatus=""
    private var count:Int? {
        let value=HistoryTurnOff.count(events,period:period,now:now)
        let start=period.window(now:now).currentStart
        if let verifiedAt,let coverageStart,verifiedAt>=start,coverageStart<=start { return value }
        return value>0 ? value : nil
    }
    var body:some View {
        ScrollView {
            VStack(alignment:.leading,spacing:12) {
                Text("Your stats")
                    .font(.system(size:24,weight:.heavy))
                    .foregroundStyle(HistoryScreenPalette.primaryText)
                HistoryPeriodSelector(period: $period)
                VStack(alignment:.leading,spacing:8) {
                    HStack(alignment:.firstTextBaseline,spacing:10) {
                        Text(count.map(String.init) ?? "—")
                            .font(.system(size:48,weight:.heavy))
                            .foregroundStyle(HistoryScreenPalette.green)
                        Text("turn-offs")
                            .font(.system(size:16,weight:.bold))
                            .foregroundStyle(HistoryScreenPalette.primaryText)
                    }
                    Text("Times you chose to close a protected app or end a session from a nudge \(period == .week ? "this week" : "this month").")
                        .font(.system(size:13)).foregroundStyle(HistoryScreenPalette.secondaryText)
                    if let verifiedAt {
                        Text("Last synced \(verifiedAt.formatted(date:.abbreviated,time:.shortened)). New choices on this phone are included.")
                            .font(.caption).foregroundStyle(HistoryScreenPalette.secondaryText)
                    } else { Text("Your recorded study choices will appear after a successful sync.").font(.caption).foregroundStyle(HistoryScreenPalette.secondaryText) }
                }.historyCard()
                VStack(alignment:.leading,spacing:12) {
                    if selection.applicationTokens.isEmpty {
                        Text("Choose protected apps in Settings to see usage comparisons.")
                            .font(.system(size:14,weight:.medium)).foregroundStyle(HistoryScreenPalette.secondaryText)
                    } else if AuthorizationCenter.shared.authorizationStatus != .approved {
                        Text("Allow Screen Time access in Settings to see usage comparisons.")
                            .font(.system(size:14,weight:.medium)).foregroundStyle(HistoryScreenPalette.secondaryText)
                    } else {
                        DeviceActivityReport(.init(period.reportContext),filter:makeFilter())
                            .id(period.reportContext+reportRefresh.uuidString)
                            // The remote report needs a bounded height inside this scroll view.
                            .frame(height: 340)
                    }
                }.historyCard()
                if refreshFailed {
                    Text("Couldn’t refresh online. Your saved history is still available; pull down to retry.")
                        .font(.caption).foregroundStyle(HistoryScreenPalette.secondaryText)
                }
            }.padding(.horizontal,24).padding(.top,8).padding(.bottom,16)
        }
        .background(HistoryScreenPalette.background)
        .foregroundStyle(HistoryScreenPalette.primaryText)
        .environment(\.colorScheme,.light)
        .task { reload();await refreshHistory() }
        .refreshable { await refreshHistory() }
        .onChange(of:scenePhase) { phase in if phase == .active { reload() } }
        .onChange(of:syncStatus) { _ in reload() }
    }
    private func reload() {
        now=Date();selection=AppSelectionStore.load()
        let saved=HistoryTurnOffStore.load();events=saved.events;verifiedAt=saved.verifiedAt;coverageStart=saved.coverageStart
    }
    private func refreshHistory() async {
        do { try await DatabaseService.shared.refreshHistory();refreshFailed=false }
        catch { refreshFailed=true }
        reload();reportRefresh=UUID()
    }
    private func makeFilter()->DeviceActivityFilter {
        let window=period.window(now:now)
        return DeviceActivityFilter(segment:.daily(during:DateInterval(start:window.previousStart,end:now)),
            users:.all,devices:.init([.iPhone]),applications:selection.applicationTokens)
    }
}

private struct HistoryPeriodSelector: View {
    @Binding var period: HistoryPeriod

    var body: some View {
        HStack(spacing: 0) {
            ForEach(HistoryPeriod.allCases, id: \.self) { value in
                Button {
                    period = value
                } label: {
                    Text(value.title)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(HistoryScreenPalette.primaryText)
                        .frame(maxWidth: .infinity)
                        .frame(height: 28)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(period == value ? HistoryScreenPalette.cardSurface : Color.clear)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(period == value ? .isSelected : [])
            }
        }
        .padding(2)
        .background(RoundedRectangle(cornerRadius: 16).fill(HistoryScreenPalette.segmentTrack))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(HistoryScreenPalette.border, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("History period")
    }
}

private extension View {
    func historyCard()->some View {
        self.padding(12).frame(maxWidth:.infinity,alignment:.leading)
            .background(RoundedRectangle(cornerRadius:14).fill(HistoryScreenPalette.cardSurface))
            .overlay(RoundedRectangle(cornerRadius:14).stroke(HistoryScreenPalette.border,lineWidth:1))
    }
}
