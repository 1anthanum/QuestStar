---
description: 单点重构 ISSUES.md 中的某一项。强制走完整六步流程。
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(pytest:*), Bash(npm:*), Bash(npx:*), Edit, Write
argument-hint: <issue_id>  # 例如 #3
---

# /refactor

修复 ISSUES.md 中的 **$ARGUMENTS** 这一项。

严格走完整六步流程，**任一步停下来都不要擅自继续**。

## 流程

### 步骤一：读上下文

按宪法第 11 条，依次读：
1. 项目根 `CLAUDE.md`
2. 涉及目录的 `CLAUDE.md`（用 grep 找出本问题涉及的所有目录，包括所有父目录）
3. `BEHAVIOR_SPEC.md` 中与本问题相关的条目
4. `ISSUES.md` 中 $ARGUMENTS 的完整描述

用一句话告诉用户「已经读过 X、Y、Z」。

### 步骤二：改动声明

用中文一段话说明：

- 你打算怎么改
- 为什么这样改
- 涉及哪些文件（**明确列出**，每个文件一句话改动性质）
- 本次改动属于「修改对外契约」还是「只改内部实现」
- 哪些调用方会被波及（若改对外契约）
- 估算 diff 行数

**停下，等用户说「可以」**。如果用户说要换方案，按宪法第 9 条先把理由说出来等用户决定。

### 步骤三：实现改动

- 单次 diff ≤ 30 行（宪法第 3 条）。超过请先停下来征求同意
- 只动改动声明里列出的文件
- 不顺手清理、不顺手重命名（宪法第 4 条）
- 引入任何新依赖前必须征求同意（宪法第 7 条）
- 如果改动要求修改 BEHAVIOR_SPEC.md 的某条规则，**先停下来在对话里说明哪条、为什么**

### 步骤四：跑测试

```bash
# Python
pytest tests/ -v

# 或前端
npx playwright test
```

**全绿才能继续**。若有测试失败：

- 立刻停下来告诉用户
- **禁止「修复」测试来掩盖问题**
- 让用户判断是代码错了、还是规格错了

### 步骤五：同步更新 CLAUDE.md

按宪法第 12 条：

- 若改了对外契约：更新本目录 CLAUDE.md 的「对外契约」段 + 所有调用方目录 CLAUDE.md 的「依赖」段 + `BEHAVIOR_SPEC.md`
- 若只改了内部实现：更新本目录 CLAUDE.md 的「内部实现」段

如果不确定要更新哪些 CLAUDE.md，调用 `claude-md-keeper` 子代理（让用户在新会话里跑）。

### 步骤六：中文导读 + Commit 草稿

输出：

1. **中文导读**：把每个改动的函数 / 关键逻辑用中文一句话解释
2. **Commit message 草稿**（用户来执行 commit）：
   ```
   [模块名] 一句话说明做了什么 - 为什么这样做

   - 改动的关键点 1
   - 改动的关键点 2
   - 涉及的 CLAUDE.md：…
   ```

## 完成后提示

> 改动已完成。请您按 TAKEOVER_GUIDE 第 6.3 节验收清单核对：
> 1. BEHAVIOR_SPEC 仍满足？
> 2. 测试全跑了？
> 3. CLAUDE.md 同步了？
> 4. git diff 完整看过？
> 5. 中文导读读懂了？
>
> **强烈建议**：开新会话运行 `/review-changes` 做对抗式审查，再 commit。
