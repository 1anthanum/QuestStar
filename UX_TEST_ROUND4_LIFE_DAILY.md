# QuestStar UX Test — Round 4 (Life Mode Daily Section)

**Date:** 2026-05-25 · **Method:** live browser at `localhost:5173` · **Total findings:** 16

## Critical
- **C1 — UI is not reactive to time passage.** Past-due items render with neutral styling until an unrelated action forces re-render. At 12:53, Adderall dose 1 (10:00) and Morning Prep block (07:00–08:00) showed no urgency. After completing Deep work, blocks suddenly flipped to "3 missed" / "2 missed" / red "overdue". Fix: `setInterval(checkOverdue, 60s)` + `visibilitychange` listener. Expansion of #27.

## Major
- **M1 — `Do it · L` single-clicks to L tier with no picker (#3/#12 unresolved).** Tier change requires re-running Plan My Day. Fix: long-press tier menu, or split into `L | M | H` segments.
- **M2 — Identity statement hidden in Focus view (default).** "I'm becoming a disciplined learner · powered by 4 this week" only renders in Stacked view. Focus view also hides Just one thing / Today's rough / briefing / suggestions / inline AI. Fix: keep Identity line in Focus view.
- **M3 — Stale "Good morning" briefing at 13:00.** Briefing says "starting fresh… no plans locked in" with `morningPlanDone: true` and 4/4 done. Same pattern in Plan My Day and End Day ("Save, good night"). Fix: regenerate on entry; use time-of-day variants.
- **M4 — Row-clicks on FIXED items trigger checkbox.** Accidentally checked Adderall dose 2 / t_water / t_focus during testing. Data-integrity risk for medications. Fix: restrict tap zone to checkbox for FIXED items, or add confirmation toast.

## Moderate
- **Mo1 — Plan My Day ignores same-day completions.** Lists already-done habits as "Carried over from yesterday" needing planning. Fix: mark done items with ✓ badge.
- **Mo2 — "Perfect day!" celebration but wallet stays $0.** Per CLAUDE.md, all-clear awards $10. Celebration fires without payoff. Fix: wire reward, or change copy.
- **Mo3 — XP math off by 3.** Popup says "+20 XP" + step "+5", storage delta is +23. Fix: trace `useGameState.toggleStep` + reward chain for duplicate/rounding bug.
- **Mo4 — Energy sliders default to 6/10 across all dimensions** (sleep 7.5h). Risk: user accepts defaults, miscalibrates day's plan. Fix: open with `—` until touched; seed from yesterday.
- **Mo5 — Gentle mode auto-activates from stale `_meta.energyMode`.** Toast appeared on load without user action. `qt_gentle_mode` is null but `_meta.energyMode: "low"` triggers it. Fix: separate session-intent from persisted state; surface source.

## Minor / Low
- **Mi1 — AI Copilot shows "0 day streak"** despite multi-day habit history. Streak counter ignores Life mode habits.
- **Mi2 — Tier label inconsistency.** Zone 2 walk shows "M" in End Day replay but is `layer: 1` (others at layer 1 show "L").
- **Mi3 — View mode count drift.** Handoff said 6; actual is 5 layouts + 5 style variants = 10 buttons. Tooltips unclear on some.
- **Mi4 — Tomorrow-ready trials carry over with no progression signal.** No indication which trial is graduating L1→L0 vs failing forward.
- **Mi5 — "Suggested for you" cards lack ranking rationale.** Morning light / Closing line / Neck stretch — why these? Add a "because".
- **L1 — Deep work appears twice on page** (Do now + Peak Cognitive FLEXIBLE list). Risk of double-completion clicks.

## Positive
- "Today's rough" → Gentle mode transition is clean (badge, palette, "Nothing left." empty state)
- End Day emotion vocabulary: 24 emotions × 4 categories — good ADHD granularity
- "All caught up — rest easy 🌙" copy is warm
- Undo toast after Do it · L — correct pattern for destructive default
- AI Copilot markdown rendering fixed (#18); context awareness in header
- Core / Forming / Explore taxonomy is clear

## Regression vs Round 1–3
| Issue | Status | Note |
|-------|--------|------|
| #3 / #12 | Still open | M1 |
| #10 | Partially open | Mi3 |
| #14, #15, #18, #25 | Fixed | (#15 only in Stacked view, see M2) |
| #27 | Expanded to C1 | All past-due items, not just Adderall |
| #28 | Open | Now confirmed: Focus view = gear icon, strips Identity |

## Priorities
1. **C1** — time-reactive overdue rendering. Single architectural fix, fixes a class of bugs.
2. **M3** — stale time-of-day strings across three modals. Cheap fix, big trust win.
3. **M4** — row-click data integrity on medications. Low effort, high harm reduction.

## Patterns worth naming
- **Non-reactive UI** (C1) — same root cause will surface in deadlines, streak breaks, future medication windows
- **State-from-stale-storage** (M3, Mo5, Mi1) — system trusts persisted strings/flags without recomputing against current state

## Not tested
Study mode AI Decompose · Knowledge Tree · Blossom · Hyperfocus keyboard flow · Settings panel · Onboarding empty states · Cross-mode interactions · Mobile responsive · Celebrations chain · 6 reflection modes · Calendar/ICS

## Tester note
Two of the three M4 accidental checks were mine. Real ADHD users with motor variability or trackpad drift will trigger this far more often.
