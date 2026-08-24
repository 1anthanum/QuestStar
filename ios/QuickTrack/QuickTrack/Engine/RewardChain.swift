import Foundation

/// Result of the full dopamine reward chain after completing a step.
/// Mirrors web's handleToggleStep chain: XP → coin (8%) → lore (12%) → level-up? → quest complete?
struct RewardChainResult: Equatable {
    let xpGained: Int
    let newTotalXp: Int
    let coinDrop: Int?              // nil = no drop, else $1–$5
    let loreDrop: LoreFragment?     // nil = no drop
    let leveledUp: Bool
    let newLevelName: String?
    let questCompleted: Bool
    let questName: String?
    let streakBonus: Int            // Extra XP from streak
    let isFirstWinToday: Bool
}

/// A lore fragment that dropped
struct LoreFragment: Equatable {
    let id: String
    let title: String
    let bookTitle: String
    let rarity: LoreRarity
}

enum LoreRarity: String, CaseIterable {
    case common = "common"
    case rare = "rare"
    case epic = "epic"
}

/// Engine that runs the full reward chain, matching the web's dopamine sequence.
enum RewardChain {

    // MARK: - Coin Drop (8% chance, $1–$5)

    static func rollCoinDrop() -> Int? {
        guard Double.random(in: 0..<1) < 0.08 else { return nil }
        return Int.random(in: 1...5)
    }

    // MARK: - Lore Drop (12% chance, 18% for challenge quests)

    /// Pool of lore fragments for random drops
    private static let lorePool: [(title: String, book: String, rarity: LoreRarity)] = [
        ("The First Spark", "Origins", .common),
        ("Ancient Code Fragment", "Origins", .common),
        ("Moonlit Algorithm", "Algorithms of Night", .common),
        ("Dawn Protocol", "Origins", .rare),
        ("The Pattern Within", "Algorithms of Night", .common),
        ("Recursive Dreams", "Algorithms of Night", .rare),
        ("Silent Variables", "The Lost Compiler", .common),
        ("The Memory Keeper", "The Lost Compiler", .rare),
        ("Infinite Loop Escape", "The Lost Compiler", .epic),
        ("Hashmap of Stars", "Cosmic Data", .common),
        ("Binary Sunset", "Cosmic Data", .rare),
        ("Quantum Entanglement", "Cosmic Data", .epic),
        ("The Observer Effect", "Emergence", .common),
        ("Butterfly Function", "Emergence", .rare),
        ("Chaos to Order", "Emergence", .epic),
        ("Thread of Fate", "Threads of Time", .common),
        ("Temporal Cache", "Threads of Time", .rare),
        ("Time Complexity", "Threads of Time", .epic),
    ]

    static func rollLoreDrop(isChallenge: Bool = false) -> LoreFragment? {
        let chance = isChallenge ? 0.18 : 0.12
        guard Double.random(in: 0..<1) < chance else { return nil }
        let item = lorePool.randomElement()!
        return LoreFragment(
            id: "lore_\(Int(Date().timeIntervalSince1970 * 1000))",
            title: item.title,
            bookTitle: item.book,
            rarity: item.rarity
        )
    }

    // MARK: - Level Check

    static func checkLevelUp(oldXp: Int, newXp: Int) -> (didLevel: Bool, newName: String?) {
        let oldLevel = Config.level(for: oldXp).index
        let newLevel = Config.level(for: newXp)
        if newLevel.index > oldLevel {
            return (true, newLevel.name)
        }
        return (false, nil)
    }

    // MARK: - Quest Completion Check

    static func isQuestComplete(steps: [QuestStep], completingStepId: String) -> Bool {
        steps.filter { !$0.done && $0.id != completingStepId }.isEmpty
    }

    // MARK: - Full Chain

    /// Run the entire reward chain after a step completion.
    /// Call this AFTER SyncManager.toggleStep() returns the XP.
    static func evaluate(
        xpGained: Int,
        oldXp: Int,
        newXp: Int,
        quest: QuestRow,
        completedStep: QuestStep,
        isFirstWinToday: Bool,
        streak: Int
    ) -> RewardChainResult {
        let coin = rollCoinDrop()
        let lore = rollLoreDrop(isChallenge: quest.quest_type == "challenge")
        let (leveled, levelName) = checkLevelUp(oldXp: oldXp, newXp: newXp)
        let questDone = isQuestComplete(steps: quest.steps, completingStepId: completedStep.id)
        let streakBonus = xpGained - (Config.XP.difficulty[completedStep.difficulty ?? ""] ?? Config.XP.defaultStepXp)

        return RewardChainResult(
            xpGained: xpGained,
            newTotalXp: newXp,
            coinDrop: coin,
            loreDrop: lore,
            leveledUp: leveled,
            newLevelName: levelName,
            questCompleted: questDone,
            questName: questDone ? quest.name : nil,
            streakBonus: max(0, streakBonus),
            isFirstWinToday: isFirstWinToday
        )
    }
}
