# QuestStar

ADHD-friendly gamified task management system. Break big goals into small steps with RPG mechanics (XP, levels, streaks) and progressive learning theory.

**Live**: [quest-star.vercel.app](https://quest-star.vercel.app)

## Features

### Core
- **AI Task Decomposition** — Multi-provider (Claude / GLM / DeepSeek / Qwen) with Anchored Learning Method
- **Gamification** — XP, 10 levels, streaks, daily first-win bonus, quest type multipliers
- **Reward System** — Wallet, streak milestones, surprise drops, streak shield
- **Lore Collection** — Fragment drops per step, 8 books, path card unlocks
- **Blossom Mode** — Progressive concept mastery with fate decisions (deep/dormant/bridge/release)
- **Dual Mode** — Study track + Life habits track with independent dashboards

### ADHD Behavioral Engine
- **Smart Launcher** — "Just This One" anti-paralysis step recommender with doom timer rescue
- **Friction Calibrator** — Step timing vs expected duration, difficulty mismatch alerts
- **Energy Scheduling** — Time-of-day energy profiling, difficulty-aware recommendations
- **Ghost Race** — Compete against your past self (last week same day)
- **Boss Rush** — Gamified overdue quest clearing with boss HP mechanics
- **Accountability Pact** — Stake wallet money on commitments (loss aversion)
- **Parallel Tracks** — Dual-quest anti-boredom switching
- **Hyperfocus Mode** — Distraction-free timer with keyboard shortcuts

### RPG & Narrative
- **Quest Narratives** — Auto-generated RPG story frames per quest archetype
- **Seasonal Events** — Monthly rotating world themes
- **Flying XP** — Arc animation from step to XP counter

### Reflection & Planning
- **6 Reflection Modes** — OneTap, Campfire, Chat Companion, Prompt Roulette, Body Tap, Mood Terrain
- **AI Daily Planner** — Generate daily activity schedules
- **Calendar + ICS** — Calendar view with iCalendar import/export

### Infrastructure
- **Supabase Auth** — Email + Google + GitHub OAuth
- **Cloud Sync** — Transparent localStorage-to-Supabase bidirectional sync
- **Step Reordering** — Drag-and-drop step ordering (dnd-kit)
- **6 Themes** — Aurora, Sunset, Ocean, Sakura, Forest, Midnight
- **Bilingual** — EN/ZH i18n
- **iOS Widget** — QuickTrack native widget project (see `ios/`)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

Create a `.env` file:

```env
# Optional — AI decomposition (can also set in Settings UI)
VITE_CLAUDE_API_KEY=sk-ant-...

# Optional — Auth & cloud sync
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## AI Providers

| Provider | Setup |
|----------|-------|
| Claude (Anthropic) | API key from [console.anthropic.com](https://console.anthropic.com/) |
| GLM (Zhipu) | API key from [open.bigmodel.cn](https://open.bigmodel.cn/) |
| DeepSeek | API key from [platform.deepseek.com](https://platform.deepseek.com/) |
| Qwen (Tongyi) | API key from [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |

Set keys in Settings panel (gear icon). All AI calls go direct from browser.

## Deploy

```bash
npm run build      # Production build to dist/
npm run deploy     # Build + gh-pages deploy
```

Vercel: auto-deploys from `main` branch. Set env vars in Vercel dashboard.

## Stack

- Vite 6 + React 18 + Tailwind CSS 3
- Supabase (Auth + PostgreSQL)
- @dnd-kit (drag-and-drop)
- KaTeX (LaTeX math rendering)
- No state management library — pure React hooks + localStorage

## Documentation

- [CLAUDE.md](CLAUDE.md) — Full architecture, conventions, and maintenance guide
- [ios/CLAUDE.md](ios/CLAUDE.md) — iOS QuickTrack widget documentation
- [supabase/SETUP.md](supabase/SETUP.md) — Database setup guide

## License

Private project.
