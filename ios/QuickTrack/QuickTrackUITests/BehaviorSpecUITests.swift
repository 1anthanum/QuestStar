// ============================================================================
// BehaviorSpecUITests — iOS/macOS 端到端测试骨架（XCUITest）
//
// 对应 BEHAVIOR_SPEC.md 中 iOS App（QuickTrack）也涉及的"用户可见行为"。
//
// ⚠️ 重要：此文件是【骨架，无法在当前命令行环境运行】。
//   iOS 端到端测试需要 Xcode + 模拟器（XCUITest），不能用 Playwright/Node 跑。
//   每个测试都先用中文【原样引用规则文本】作为可见标签（XCTContext.runActivity），
//   再 throw XCTSkip 注明"需在 Xcode 中补全操作脚本"。
//   只通过用户能做的操作（点按、输入、滑动）触发，只断言界面可见结果——
//   不调用 App 内部任何函数（XCUITest 本身就只能看到界面，天然满足）。
//
// ── 如何启用（在 Mac 上）────────────────────────────────────────────────────
//   1. 在 ios/QuickTrack/project.yml 增加一个 UI 测试 target：
//        QuickTrackUITests:
//          type: bundle.ui-testing
//          platform: iOS
//          sources: [QuickTrackUITests]
//          dependencies: [ { target: QuickTrack } ]
//   2. 运行 `xcodegen generate` 重新生成工程。
//   3. 在 Xcode 里对每个 testXX 方法，按其中文标签描述补全"点击/断言"脚本，
//      去掉对应的 XCTSkip。
// ============================================================================

import XCTest

final class BehaviorSpecUITests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch() // 用户能做的操作：打开 App
    }

    /// 小工具：把"规则原文"作为可见标签登记，并以中文说明跳过（待在 Xcode 补脚本）。
    private func 规则(_ 文本: String, _ 待办: () throws -> Void = {}) throws {
        try XCTContext.runActivity(named: 文本) { _ in
            try 待办()
            throw XCTSkip("iOS 端到端骨架：需在 Xcode/模拟器中补全『点击 + 可见结果断言』脚本后启用。")
        }
    }

    // —— 第1节 进入应用与账号 ——
    func test01() throws { try 规则("当用户通过密码界面（或该部署未设密码）后，系统应该直接进入可用的主界面，即使没有登录账号。") }
    func test02() throws { try 规则("当用户未登录时，系统应该以「访客」身份正常使用全部本机功能。") }
    func test03() throws { try 规则("当用户成功登录后，系统应该显示其账号标识（如名字首字母的彩色圆点），并把本机已有的数据与该账号关联起来。") }
    func test04() throws { try 规则("如果登录或注册失败（密码错误、邮箱已占用、网络不通等），系统应该显示明确的失败原因，并保持在未登录状态，不清空用户已填的内容。") }

    // —— 第2节 任务与步骤 ——
    func test05() throws { try 规则("当用户手动创建一个任务时，系统应该要求至少有任务名称，创建后该任务出现在任务列表中。") }
    func test06() throws { try 规则("当用户打开一个任务时，系统应该显示它的全部步骤、完成进度，以及（若有）截止日期。") }
    func test07() throws { try 规则("当用户请求删除一个任务时，系统应该先弹出确认提示；取消则不删除，确认则移除。") }
    func test08() throws { try 规则("当用户把一个步骤标记为完成时，系统应该把它显示为已完成，并触发完成反馈。") }
    func test09() throws { try 规则("当用户取消一个步骤的完成标记时，系统应该不发放任何奖励，也不扣回之前已获得的经验值。") }
    func test10() throws { try 规则("当一个任务的所有步骤都完成时，系统应该把该任务显示为已完成。") }

    // —— 第3、4节 完成反馈与经验等级 ——
    func test11() throws { try 规则("当用户完成一个步骤时，系统应该展示一次获得经验值的提示动画。") }
    func test12() throws { try 规则("当完成步骤导致经验值跨过升级线时，系统应该展示一次升级庆祝。") }
    func test13() throws { try 规则("当完成步骤导致整个任务首次全部完成时，系统应该展示一次任务完成庆祝。") }

    // —— 第6节 奖励钱包 ——
    func test14() throws { try 规则("当用户查看奖励面板时，系统应该显示钱包余额、各里程碑的状态。") }

    // —— 第9节 生活习惯每日打卡 ——
    func test15() throws { try 规则("当用户在某个时间块里勾选一项习惯活动时，系统应该把它标为今日已完成，并更新当日完成度。") }
    func test16() throws { try 规则("当进入新的一天时，系统应该把习惯打卡重置为未完成（昨天的勾选不带入今天）。") }

    // —— 第13节 专注模式 ——
    func test17() throws { try 规则("当用户进入「专注模式」时，系统应该提供无干扰的计时执行界面。") }

    // —— 第16节 外观与语言 ——
    func test18() throws { try 规则("当用户切换主题时，系统应该立即改变整体配色，其余内容不变。") }
    func test19() throws { try 规则("当用户切换语言（中文 / 英文）时，系统应该立即把界面文字切换为对应语言，其余数据不变。") }
    func test20() throws { try 规则("当用户下次再打开应用时，系统应该沿用其上次选择的主题与语言。") }

    // —— 第18节 数据保存与跨设备 ——
    func test21() throws { try 规则("当用户做出任何会改变数据的操作后，系统应该自动保存；重新打开应用后这些数据仍然存在。") }
    func test22() throws { try 规则("如果保存到云端暂时失败，系统应该让本机继续可用、改动不丢失，并在恢复后继续同步。") }

    // —— iOS 专属：小组件 ——
    // 说明：桌面小组件无法用 XCUITest 直接驱动，需用快照/Springboard 交互专门处理；此处仅登记。
    func test23() throws { try 规则("当用户在桌面小组件上点击打卡/完成步骤时，系统应该记录该操作并在 App 内可见。") }
}
