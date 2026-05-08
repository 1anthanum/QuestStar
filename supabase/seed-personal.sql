-- ============================================================
-- Personal Seed: Phased daily schedules + 4 new tracking items
--
-- Two schedule presets:
--   A. 过渡周 (5/8 – 5/13)  — 11:00 起床, 渐进调整
--   B. 目标版 (5/13 后)     — 8:30 起床, 相位稳定
--
-- New tracking items (all present in BOTH schedules):
--   ☀️ 起床见光 10 分钟
--   🛁 睡前淋浴
--   💊 服药打卡（第一剂 / 第二剂分开记录）
--   🧠 情绪一句话打分 1–10
--
-- Owner: GitHub user @1anthanum
-- Run AFTER first GitHub OAuth login to Quest Tracker.
-- Replace YOUR_USER_ID_HERE with your Supabase auth.users UUID.
-- ============================================================

-- ── How to find your user UUID after first GitHub login ──
-- Option A: Supabase Dashboard → Authentication → Users → find GitHub row → copy UUID
-- Option B: SQL Editor:
--   SELECT id, raw_user_meta_data->>'user_name' AS github_user
--   FROM auth.users
--   WHERE raw_user_meta_data->>'user_name' = '1anthanum';
--
-- NOTE: With the auto-load feature in TimeBlockCard, running this SQL
-- is optional. The app now auto-loads OWNER_PRESETS on first Life mode
-- visit (from the hardcoded constant in LifeHabitDashboard.jsx).
-- This SQL seed is for cloud sync persistence after login.

-- ── Step 1: Seed active time_blocks (Transition Week) + presets ──

INSERT INTO public.daily_habits (user_id, time_blocks, daily_checks)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,

  -- Active schedule: 过渡周 (Transition Week, 11:00 wake)
  '[
    {
      "key": "morning",
      "icon": "🌅",
      "time": "11:00–12:00",
      "activities": [
        {"id": "t_water",    "icon": "💧", "label": "喝水 300–500ml 温水（起床第一件事）"},
        {"id": "t_sun",      "icon": "☀️", "label": "见光 10 分钟（窗边或出门，相位前移核心）"},
        {"id": "t_breakfast", "icon": "🍳", "label": "健康早餐（三文鱼罐头 + 水果 + 鱼油）"},
        {"id": "t_med1",     "icon": "💊", "label": "第一剂 Adderall（与早餐同服）"}
      ]
    },
    {
      "key": "afternoon",
      "icon": "☀️",
      "time": "12:00–18:00",
      "activities": [
        {"id": "t_walk",    "icon": "🚶", "label": "散步 30–60 分钟（户外优先）"},
        {"id": "t_focus",   "icon": "🎯", "label": "深度专注（13:00–16:00 峰值窗口，单段 ≤90min）"},
        {"id": "t_stretch", "icon": "🧘", "label": "拉伸 / 活动身体（16:00–16:30）"},
        {"id": "t_med2",    "icon": "💊", "label": "第二剂 Adderall"},
        {"id": "t_cardio",  "icon": "🏃", "label": "运动（本周 Zone 2 散步即可，不做深蹲）"}
      ]
    },
    {
      "key": "evening",
      "icon": "🌙",
      "time": "18:00–入睡",
      "activities": [
        {"id": "t_dinner",  "icon": "🍽️", "label": "晚餐（18:00 后零兴奋剂：药+咖啡+功能饮料）"},
        {"id": "t_screen",  "icon": "🔕", "label": "关屏放松（23:00 起，项目硬关闭）"},
        {"id": "t_shower",  "icon": "🛁", "label": "淋浴（睡前 60–90 分钟，体温调节入睡触发器）"},
        {"id": "t_mood",    "icon": "🧠", "label": "情绪打分 1–10（给 5/19 复诊提供 trend）"},
        {"id": "t_sleep",   "icon": "😴", "label": "按时入睡（渐进：3:00 → 一周内推到 24:00）"}
      ]
    }
  ]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  time_blocks = EXCLUDED.time_blocks,
  updated_at = now();


-- ── Step 2: Seed schedule presets into user_settings ──
-- Stores both versions so the in-app preset switcher can toggle.
-- The key qt_schedule_presets is read by TimeBlockCard.

-- NOTE: If user_settings doesn't have a schedule_presets column yet,
-- run this first:
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS schedule_presets JSONB DEFAULT NULL;

-- For now, presets are stored in localStorage (qt_schedule_presets).
-- To pre-populate via SQL, use extra_state:

INSERT INTO public.extra_state (user_id, schedule_presets)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,
  '{
    "过渡周 (11:00起)": [
      {
        "key": "morning",
        "icon": "🌅",
        "time": "11:00–12:00",
        "activities": [
          {"id": "t_water",    "icon": "💧", "label": "喝水 300–500ml 温水（起床第一件事）"},
          {"id": "t_sun",      "icon": "☀️", "label": "见光 10 分钟（窗边或出门，相位前移核心）"},
          {"id": "t_breakfast", "icon": "🍳", "label": "健康早餐（三文鱼罐头 + 水果 + 鱼油）"},
          {"id": "t_med1",     "icon": "💊", "label": "第一剂 Adderall（与早餐同服）"}
        ]
      },
      {
        "key": "afternoon",
        "icon": "☀️",
        "time": "12:00–18:00",
        "activities": [
          {"id": "t_walk",    "icon": "🚶", "label": "散步 30–60 分钟（户外优先）"},
          {"id": "t_focus",   "icon": "🎯", "label": "深度专注（13:00–16:00 峰值窗口，单段 ≤90min）"},
          {"id": "t_stretch", "icon": "🧘", "label": "拉伸 / 活动身体（16:00–16:30）"},
          {"id": "t_med2",    "icon": "💊", "label": "第二剂 Adderall"},
          {"id": "t_cardio",  "icon": "🏃", "label": "运动（本周 Zone 2 散步即可，不做深蹲）"}
        ]
      },
      {
        "key": "evening",
        "icon": "🌙",
        "time": "18:00–入睡",
        "activities": [
          {"id": "t_dinner",  "icon": "🍽️", "label": "晚餐（18:00 后零兴奋剂：药+咖啡+功能饮料）"},
          {"id": "t_screen",  "icon": "🔕", "label": "关屏放松（23:00 起，项目硬关闭）"},
          {"id": "t_shower",  "icon": "🛁", "label": "淋浴（睡前 60–90 分钟，体温调节入睡触发器）"},
          {"id": "t_mood",    "icon": "🧠", "label": "情绪打分 1–10（给 5/19 复诊提供 trend）"},
          {"id": "t_sleep",   "icon": "😴", "label": "按时入睡（渐进：3:00 → 一周内推到 24:00）"}
        ]
      }
    ],
    "目标版 (8:30起)": [
      {
        "key": "morning",
        "icon": "🌅",
        "time": "8:30–12:00",
        "activities": [
          {"id": "g_water",    "icon": "💧", "label": "喝水 + 见光 10 分钟"},
          {"id": "g_sun",      "icon": "☀️", "label": "☀️ 见光（窗边或出门，不可跳过）"},
          {"id": "g_breakfast", "icon": "🍳", "label": "早餐"},
          {"id": "g_med1",     "icon": "💊", "label": "第一剂 Adderall（与早餐同服 9:00）"},
          {"id": "g_stretch",  "icon": "🧘", "label": "拉伸（10:00–10:30）"},
          {"id": "g_focus1",   "icon": "🎯", "label": "深度专注上午段（9:30–12:00）"}
        ]
      },
      {
        "key": "afternoon",
        "icon": "☀️",
        "time": "12:00–18:00",
        "activities": [
          {"id": "g_walk",    "icon": "🚶", "label": "散步（12:00–13:00）"},
          {"id": "g_focus2",  "icon": "🎯", "label": "深度专注下午段（13:30–16:00）"},
          {"id": "g_med2",    "icon": "💊", "label": "第二剂 Adderall"},
          {"id": "g_cardio",  "icon": "🏃", "label": "运动（16:30–17:30）"}
        ]
      },
      {
        "key": "evening",
        "icon": "🌙",
        "time": "18:30–入睡",
        "activities": [
          {"id": "g_dinner",  "icon": "🍽️", "label": "晚餐（18:30–19:30）"},
          {"id": "g_screen",  "icon": "🔕", "label": "关屏放松（22:00 起）"},
          {"id": "g_shower",  "icon": "🛁", "label": "淋浴（睡前 60–90 分钟）"},
          {"id": "g_mood",    "icon": "🧠", "label": "情绪打分 1–10"},
          {"id": "g_sleep",   "icon": "😴", "label": "入睡（24:00）"}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  schedule_presets = EXCLUDED.schedule_presets,
  updated_at = now();

-- ============================================================
-- IMPORTANT: After 5/13 when phase is stable, switch to 目标版:
--   1. In the app: tap the preset name badge → select "目标版 (8:30起)"
--   2. Or manually: UPDATE daily_habits SET time_blocks = (
--        SELECT schedule_presets->'目标版 (8:30起)'
--        FROM extra_state WHERE user_id = 'YOUR_USER_ID_HERE'
--      ) WHERE user_id = 'YOUR_USER_ID_HERE';
-- ============================================================
