---
description: 周例行健康检查，输出 docs/health-check/YYYY-MM-DD.md
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(pytest:*), Bash(npm:*), Bash(wc:*), Bash(date:*), Write
---

# /health-check

每周固定一天跑一次。**只输出报告，不修改任何文件**。

## 流程

读取当前日期，将报告写入 `docs/health-check/YYYY-MM-DD.md`。

## 报告内容

### 1. 测试状态

```bash
pytest tests/ --tb=no -q   # 或对应的测试命令
```

- 总测试数、通过、失败、跳过
- 与上周报告（最近的 `docs/health-check/*.md`）对比变化
- 如有新增的失败测试，单独标出

### 2. 依赖状态

对比 `package.json` / `requirements.txt` / `pyproject.toml` 与上周报告：

- 列出有更新可用的第三方依赖
- 标记类别：
  - 🔴 **安全更新**（CVE 修复）：必须升
  - 🟡 **小版本**：建议升
  - 🟢 **大版本**：先评估
- **不要直接升级**，只报告

### 3. 新出现的 TODO / FIXME / HACK

```bash
grep -rn "TODO\|FIXME\|HACK" --include="*.py" --include="*.js" --include="*.ts" .
```

与上次报告对比新增的标记。标注所在文件和行号。

### 4. 代码体积变化

各主目录代码行数变化（用 `wc -l`）。

出现超过 500 行的新文件请单独标出。

### 5. BEHAVIOR_SPEC.md 同步状况

- 检查每条规格是否仍有对应的端到端测试（按 spec 文件中条目名搜索 tests/e2e/）
- 列出失去测试覆盖的规格条目

### 6. CLAUDE.md 存在性检查

- 列出项目中所有 CLAUDE.md 文件
- 标出本周新增 / 删除的子目录是否需要新增 / 删除 CLAUDE.md
- 标出本周代码改动较多但 CLAUDE.md 未更新的目录（基于 `git log --name-only` 本周提交）

## 完成后

给用户一段中文总结：

- 本周整体健康度（用一句中文描述）
- **最值得本周关注的 1-2 件事**
- 是否建议本周做 `/claude-md-drift`（若 6 项里有警告则建议）
