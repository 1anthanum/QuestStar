# Supabase Setup Guide — QuestStar

## 1. 创建项目

1. 访问 https://supabase.com → 注册/登录
2. 点击 "New Project"
3. 填写项目名称（如 `queststar`），设置数据库密码，选择区域
4. 等待项目创建完成（约2分钟）

## 2. 获取 API 凭据

1. 进入项目 → Settings → API
2. 复制以下两个值：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` 开头的长字符串

3. 在项目根目录创建 `.env` 文件（或在 Vercel 环境变量中设置）：
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3. 创建数据库表

1. 进入 Supabase Dashboard → SQL Editor
2. 点击 "New Query"
3. 粘贴 `schema.sql` 的全部内容
4. 点击 "Run" 执行

验证：进入 Table Editor，应该看到以下表：
- profiles
- game_state
- quests
- reward_state
- daily_habits
- blossom_progress
- lore_state
- user_settings
- extra_state

## 4. 开启 GitHub OAuth（可选）

1. 进入 Authentication → Providers → GitHub
2. 开启 Enable
3. 去 GitHub → Settings → Developer Settings → OAuth Apps → New
4. 填写：
   - Application name: `QuestStar`
   - Homepage URL: `https://quest-star.vercel.app`
   - Authorization callback URL: `https://xxxxx.supabase.co/auth/v1/callback`
5. 获取 Client ID 和 Client Secret
6. 回到 Supabase 填入 Client ID + Secret → Save

## 5. 配置 Auth 设置

1. Authentication → URL Configuration:
   - Site URL: `https://quest-star.vercel.app`
   - Redirect URLs 添加: `https://quest-star.vercel.app`, `http://localhost:5173`

## 6. 安装依赖

```bash
npm install @supabase/supabase-js
```

## 7. 导入个人健康数据（仅你自己）

1. 注册并登录你的账号
2. 在 Supabase Dashboard → Authentication → Users 中找到你的 UUID
3. 编辑 `seed-personal.sql`，替换 `YOUR_USER_ID_HERE` 为你的 UUID
4. 在 SQL Editor 中运行 `seed-personal.sql`

完成后，你登录后就会看到个人化的健康活动列表，其他用户只会看到通用默认活动。

## 8. Vercel 部署配置

在 Vercel Dashboard → Project Settings → Environment Variables 中添加：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

重新部署即可生效。

---

## 架构说明

```
未登录（访客）：
  数据 → localStorage → 单机使用

已登录：
  数据 → localStorage（本地缓存）← → Supabase（云同步）
  首次登录 → 自动迁移本地数据到云端
  后续 → 双向同步（拉取云端 → 本地 / 本地变更 → 推送云端）
```

**数据隔离**：所有表都启用了 Row Level Security (RLS)，
每行数据的 `user_id` 必须匹配当前登录用户的 `auth.uid()`。
即使有人直接调用 API，也无法读取其他用户的数据。
