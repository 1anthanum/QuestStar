# Claude Code 接手系统

一套面向"接手成熟/半成熟项目"场景的 Claude Code 配置包。
让 Claude Code 在每次会话自动继承项目知识、强制走可验收的工作流。

## 包含内容

```
.
├── CLAUDE.md                          根契约（项目级上下文 + 会话宪法）
├── SYSTEM_DESIGN.md                   系统设计文档（先读这个）
├── TAKEOVER_GUIDE.md                  Day-1 走查（按这个操作）
│
├── .claude/
│   ├── settings.json                  权限边界
│   ├── commands/                      11 个斜杠命令
│   ├── agents/                        2 个子代理
│   └── hooks/                         Git pre-commit hook
│
└── docs/
    ├── templates/                     3 份文档模板
    ├── adr/                           （运行时填充）
    ├── health-check/                  （运行时填充）
    └── review/                        （运行时填充）
```

## 安装（5 分钟）

### 1. 解压到您的项目根

```bash
unzip claude-code-takeover-system.zip
mv claude-code-takeover-system/* claude-code-takeover-system/.[!.]* /path/to/your/project/
rmdir claude-code-takeover-system
```

### 2. 验证骨架

```bash
cd /path/to/your/project
ls -la CLAUDE.md .claude/ docs/templates/
```

应当看到 CLAUDE.md（项目根）、.claude/ 目录、docs/templates/ 目录。

### 3. 安装 Git pre-commit hook

```bash
chmod +x .claude/hooks/check-claude-md-updated.sh
ln -sf ../../.claude/hooks/check-claude-md-updated.sh .git/hooks/pre-commit
```

测试 hook 工作正常：

```bash
.git/hooks/pre-commit
echo $?  # 应当输出 0（当前无暂存改动，通过）
```

### 4. 填充根 CLAUDE.md 的占位符

打开 `CLAUDE.md`，找到下列段落，手工填写：

- 「一句话项目说明」
- 「技术栈」
- 「项目特定的禁区」

`「子目录地图」` 段留空，运行 `/init-claude-md` 后由 AI 填充。

### 5. 初次 commit

```bash
git add CLAUDE.md .claude/ docs/ SYSTEM_DESIGN.md TAKEOVER_GUIDE.md README.md
git commit -m "[setup] 安装 Claude Code 接手系统"
```

## 下一步

打开 `TAKEOVER_GUIDE.md`，从「Day 1」开始。

不要跳过 `SYSTEM_DESIGN.md` 第二节「五层结构」——它解释了所有命令为什么这样设计。

## 紧急情况

若 Claude Code 的某次改动让您不安：

```bash
git status
git diff
git checkout -- .          # 未 commit
git revert HEAD            # 已 commit 未 push
```

更详细的回滚剧本见 `TAKEOVER_GUIDE.md` 第十节。
