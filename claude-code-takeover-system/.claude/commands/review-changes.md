---
description: 调用 code-reviewer 子代理做对抗式代码审查。必须在新会话中调用。
allowed-tools: Read, Bash(git diff:*), Bash(git show:*), Bash(git log:*), Task
---

# /review-changes

⚠️ **使用前提**：本命令必须在**新会话**中运行，不能是刚才写代码的同一会话。
原因：同会话袒护——AI 不会真的找自己代码的问题。

## 流程

### 步骤一：收集材料

询问用户：

1. 您要审查的是哪个 commit？（提供 commit hash 或"未 commit 的当前 diff"）
2. 这次改动声称要解决的问题是什么？（粘贴 ISSUES.md 中的条目）
3. 涉及哪些目录的 CLAUDE.md？（用户可粘贴或您用 grep 找）

### 步骤二：准备 diff

根据用户回答：

- 未 commit：`git diff` 或 `git diff --cached`
- 已 commit：`git show <hash>`

读取涉及目录的 CLAUDE.md 全文。

### 步骤三：调用子代理

使用 Task 工具调用 `code-reviewer` 子代理，传入：

- git diff 完整内容
- 改动声称解决的问题描述
- 涉及目录的 CLAUDE.md（改动后版本）

### 步骤四：呈现报告

把 code-reviewer 的中文审查报告直接呈现给用户。

提示用户：

> 把这份审查报告带回**原会话**给写代码的 AI 看，让它逐条回应。
> 它的回应方式能让您判断哪些是真问题、哪些是误报。
>
> 如果审稿建议「拒绝」或多处「修改后合并」，请先 git reset / git revert 回滚，再让原 AI 重做。
