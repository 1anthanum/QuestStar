-- ============================================================
-- Personal Seed: Your custom daily habits (A1–A4 health layers + supplements)
--
-- Run this AFTER you have registered and logged in.
-- Replace YOUR_USER_ID_HERE with your actual Supabase user UUID.
-- Find it in Supabase Dashboard → Authentication → Users
-- ============================================================

-- Get your user ID (run this first to find it):
-- SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- Then replace the UUID below and run:

INSERT INTO public.daily_habits (user_id, time_blocks, daily_checks)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,
  '[
    {
      "key": "morning",
      "icon": "🌅",
      "time": "起床–12:00",
      "activities": [
        {"id": "m_meditate", "icon": "🧘", "label": "冥想 / 呼吸训练 10 min（与 SSRI 协同）"},
        {"id": "m_brush", "icon": "🪥", "label": "刷牙 + 漱口水"},
        {"id": "m_flonase", "icon": "💊", "label": "Flonase + 鼻清洗"},
        {"id": "m_supBrkfst", "icon": "💊", "label": "早餐补剂（Centrum + B + C）"},
        {"id": "m_supSnack", "icon": "💊", "label": "上午加餐补剂（Creatine 5g + Liquid I.V.）"},
        {"id": "m_sun", "icon": "☀️", "label": "出门晒太阳 10 分钟"},
        {"id": "m_veggies", "icon": "🥗", "label": "吃蔬菜 / 沙拉"},
        {"id": "m_water", "icon": "💧", "label": "喝水"}
      ]
    },
    {
      "key": "afternoon",
      "icon": "☀️",
      "time": "12:00–18:00",
      "activities": [
        {"id": "a_cardio", "icon": "🏃", "label": "⭐ 中低强度有氧（Zone 2 步行/骑行）— 最高优先"},
        {"id": "a_supLunch", "icon": "💊", "label": "午餐补剂（Omega-3 + 姜黄 + 锌）"},
        {"id": "a_training", "icon": "🏋️", "label": "力量训练（非有氧日）"},
        {"id": "a_squat", "icon": "🦵", "label": "深蹲"},
        {"id": "a_goout", "icon": "🚶", "label": "出门（不要待在家）"},
        {"id": "a_session", "icon": "💬", "label": "Session Check-in（不强制，想做就做）"},
        {"id": "a_nobed", "icon": "🚫", "label": "不趴床用电脑"},
        {"id": "a_veggies2", "icon": "🍎", "label": "水果摄入"}
      ]
    },
    {
      "key": "evening",
      "icon": "🌙",
      "time": "18:00–入睡",
      "activities": [
        {"id": "e_floss", "icon": "🦷", "label": "牙线 + 冲牙 + 刷牙"},
        {"id": "e_hepa", "icon": "🌬️", "label": "关窗 + 开 HEPA"},
        {"id": "e_supSleep", "icon": "💊", "label": "Magnesium L-Threonate（21:30）"},
        {"id": "e_writing", "icon": "✍️", "label": "表达性写作（自由书写 10 min）"},
        {"id": "e_nobed2", "icon": "🚫", "label": "不躺床上用电脑"},
        {"id": "e_sleepby", "icon": "😴", "label": "00:00–02:00 之间入睡"},
        {"id": "e_sleepdebt", "icon": "📊", "label": "记录：上床秒睡了吗？（睡眠债代理指标）"}
      ]
    }
  ]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  time_blocks = EXCLUDED.time_blocks,
  updated_at = now();
