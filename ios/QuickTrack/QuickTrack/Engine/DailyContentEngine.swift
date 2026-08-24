import Foundation

/// Curated daily content — quotes, ADHD tips, RPG narrative intros.
/// Rotates deterministically by day-of-year so the same item shows all day,
/// changes each new day, and cycles back without repetition for ~1 year.
enum DailyContentEngine {

    // MARK: - Quotes (productivity / ADHD / focus / habits)

    private static let quotes: [(text: String, author: String)] = [
        ("Tiny gains, compounded daily, create extraordinary results.", "James Clear"),
        ("You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"),
        ("Motivation gets you started. Habit keeps you going.", "Jim Rohn"),
        ("Productivity is never an accident. It is always the result of a commitment to excellence.", "Paul J. Meyer"),
        ("ADHD isn't a deficit of attention — it's a difficulty regulating it.", "Russell Barkley"),
        ("Done is better than perfect.", "Sheryl Sandberg"),
        ("The way to get started is to quit talking and begin doing.", "Walt Disney"),
        ("Action is the antidote to despair.", "Joan Baez"),
        ("If you want to know your past, look at your present. If you want to know your future, look at your present.", "Buddhist saying"),
        ("Your brain is like a puppy. It needs structure, kindness, and frequent walks.", "Mel Robbins"),
        ("Start where you are. Use what you have. Do what you can.", "Arthur Ashe"),
        ("Discipline is choosing between what you want now and what you want most.", "Abraham Lincoln"),
        ("The cave you fear to enter holds the treasure you seek.", "Joseph Campbell"),
        ("Habits are the compound interest of self-improvement.", "James Clear"),
        ("It always seems impossible until it's done.", "Nelson Mandela"),
        ("Continuous improvement is better than delayed perfection.", "Mark Twain"),
        ("You don't have to be great to start, but you have to start to be great.", "Zig Ziglar"),
        ("Procrastination is the thief of time.", "Edward Young"),
        ("Focus is a matter of deciding what things you're not going to do.", "John Carmack"),
        ("Small daily improvements over time lead to stunning results.", "Robin Sharma"),
        ("Energy and persistence conquer all things.", "Benjamin Franklin"),
        ("Worry is interest paid on trouble before it falls due.", "Dean Inge"),
        ("The journey of a thousand miles begins with one step.", "Lao Tzu"),
        ("Don't count the days, make the days count.", "Muhammad Ali"),
        ("Stillness is the master of restlessness.", "Lao Tzu"),
        ("The chains of habit are too light to be felt until they are too heavy to be broken.", "Warren Buffett"),
        ("You will never always be motivated. You have to learn to be disciplined.", "Anonymous"),
        ("Hard choices, easy life. Easy choices, hard life.", "Jerzy Gregorek"),
        ("The two most important days in your life are the day you are born and the day you find out why.", "Mark Twain"),
        ("Imperfect action beats perfect inaction every time.", "Harry Truman"),
    ]

    // MARK: - ADHD Tips (practical, evidence-based)

    private static let tips: [String] = [
        "Two-minute rule: if it takes <2 minutes, do it right now.",
        "Body doubling works — even just having someone in the room boosts focus.",
        "Externalize working memory — write everything down, your brain isn't a hard drive.",
        "Use 'when-then' planning: 'when I sit at my desk, then I open one task.'",
        "Reward immediately after the task, not later. ADHD brains discount future rewards.",
        "Set a timer for 5 minutes — promise yourself you can stop after.",
        "Pair boring tasks with stimulation: music, walking, fidget toys.",
        "Hyperfocus is a feature, not a bug — set boundaries around it.",
        "Sleep is the #1 ADHD intervention. Protect your bedtime.",
        "Movement before thinking. Walk for 5 min before tackling a hard problem.",
        "Procrastination is emotional, not lazy. Identify the feeling first.",
        "Caffeine works differently for ADHD brains — track what dose helps focus vs jitter.",
        "Notifications are dopamine slot machines. Default everything to off.",
        "One screen, one task. Multi-tasking is task-switching with a cost.",
        "If a task takes 5 days but only 2 hours of work, batch it on one day.",
        "Decision fatigue is real. Make important decisions in the morning.",
        "Eat protein with breakfast — stabilizes dopamine for the morning.",
        "If you can't start, lower the bar. Start with 1 minute, not 25.",
        "Visualize your future self thanking you for the work you do today.",
        "Boredom is the enemy. Add novelty: new playlist, new room, new tool.",
        "Habit stacking: anchor a new habit to one you already do.",
        "Sunday planning > Monday panicking. 15 min review = whole week of clarity.",
        "Forgive past procrastination — guilt fuels more procrastination.",
        "Pick the 3 most important tasks for tomorrow before sleeping.",
        "Stand up and move every 25-50 minutes. ADHD brains need motion.",
    ]

    // MARK: - RPG Narrative Intros (top of TodayView)

    private static let narrativeIntros: [String] = [
        "The hero awakens. Dawn light spills across the kingdom.",
        "Ancient scrolls call your name. New quests await.",
        "The forge of focus burns bright today.",
        "A new chapter opens in the chronicles of QuestStar.",
        "The stars align. Your path is illuminated.",
        "Mist clears from the trail. Today's challenges reveal themselves.",
        "The training grounds beckon. Sharpen your skills.",
        "A council of wise minds gathers within. Listen carefully.",
        "The library is open. Knowledge fragments shimmer in the air.",
        "Storm clouds part. Clarity descends upon the realm.",
        "The chronometer turns. A fresh window of focus appears.",
        "Echoes of yesterday's victories ripple into today.",
        "The wanderer pauses, breathes, and begins anew.",
        "A subtle wind carries whispers of future achievement.",
        "The arena gates open. Worthy opponents stand ready.",
        "The map unrolls. Mark your destination wisely.",
        "Even the smallest step echoes across the realm.",
        "Today the apprentice teaches the master.",
        "The compass spins, then settles. Your direction is found.",
        "Dragons of distraction can be tamed with patience.",
        "Old habits dissolve as new constellations form.",
        "The lantern flickers, then steadies. Walk forward.",
        "A messenger arrives with news of opportunity.",
        "The harvest comes to those who tend their fields daily.",
        "An ally appears. Their name is Consistency.",
        "The mountain knows you are ready for its summit.",
        "Small wins are stitches in the tapestry of mastery.",
        "Today's quiet effort is tomorrow's loud success.",
        "The phoenix rises again. Reset, rebirth, recommit.",
        "Even gods began as students. Begin where you stand.",
    ]

    // MARK: - Day-of-Year Selector

    private static var dayOfYear: Int {
        Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
    }

    /// Today's quote (changes daily, consistent across opens)
    static func todaysQuote() -> (text: String, author: String) {
        let idx = dayOfYear % quotes.count
        return quotes[idx]
    }

    /// Today's ADHD tip
    static func todaysTip() -> String {
        let idx = (dayOfYear + 7) % tips.count   // offset so quote + tip aren't always paired
        return tips[idx]
    }

    /// Today's RPG narrative intro
    static func todaysNarrative() -> String {
        let idx = (dayOfYear * 3) % narrativeIntros.count
        return narrativeIntros[idx]
    }

    /// Pick which content type to show today (rotate to add variety)
    enum DailyContent {
        case quote(text: String, author: String)
        case tip(String)
    }

    static func todaysCard() -> DailyContent {
        // Even days = quote, odd days = tip
        if dayOfYear % 2 == 0 {
            let q = todaysQuote()
            return .quote(text: q.text, author: q.author)
        } else {
            return .tip(todaysTip())
        }
    }
}
