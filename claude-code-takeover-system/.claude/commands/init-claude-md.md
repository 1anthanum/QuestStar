---
description: 初始化 CLAUDE.md 体系：更新根 CLAUDE.md + 为合格子目录生成 CLAUDE.md
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Write, Edit
---

# /init-claude-md

为本项目建立 CLAUDE.md 网络——根目录已有 CLAUDE.md 模板，本命令负责：

1. 更新根 CLAUDE.md 的「子目录地图」段
2. 逐个评估子目录，为合格目录生成独立 CLAUDE.md

## 前置条件

- `/takeover-scan` 已完成，INVENTORY/DEPENDENCIES/PLAIN_LANGUAGE_MAP 三份文件已存在
- 用户已手工填写根 CLAUDE.md 中的「项目特定的禁区」

## 流程

### 步骤一：扫描所有一级子目录

列出项目根下所有一级子目录（除 `.git`、`.claude`、`node_modules`、`__pycache__`、`venv`、`.venv`、`dist`、`build`、`docs` 之外）。

### 步骤二：判断每个子目录是否值得独立 CLAUDE.md

对每个子目录，按以下**三条标准**判断（至少满足两条才建）：

- 包含 ≥ 3 个相关功能文件
- 对系统其他部分暴露明确的接口（被其他目录的文件 import / require / call）
- 有非显而易见的约定或陷阱（基于 PLAIN_LANGUAGE_MAP.md 中的描述判断）

**用 Grep / Read 验证**，不要猜。

### 步骤三：报告给用户清单

用中文输出：

```
建议建立独立 CLAUDE.md 的子目录：
- src/api/    理由：8 个相关文件、被 src/cli/ 和 tests/ 引用、有 X 约定
- src/core/   理由：...

不建议建立 CLAUDE.md 的子目录：
- src/utils/  理由：仅 2 个文件，无非显而易见约定
- scripts/    理由：临时脚本集合
```

**停下来等用户批准清单**。用户可能要调整（强加 / 否决某个目录）。

### 步骤四：更新根 CLAUDE.md 子目录地图

根据批准的清单，更新根 CLAUDE.md「子目录地图」段。保留用户已填写的其他段落不变。

### 步骤五：逐个生成子目录 CLAUDE.md

对清单中的**每一个**目录：

1. 读 `docs/templates/CLAUDE_subdirectory.md` 模板
2. 用 grep / 静态分析填充：
   - 「对外契约」：只列出真正被本目录之外的代码引用的接口；私有/未被外部引用的不写
   - 「内部实现」：简短中文说明
   - 「依赖」：入（被谁调用）+ 出（调用谁），用实际 grep 结果
   - 「替换难度自评」：用 grep 数出真实数字（被引用次数、涉及 BEHAVIOR_SPEC 条目）
   - 「本模块的常见陷阱」：留 `[由用户补充]`，禁止猜
   - 「相关 ADR」：暂无的话写「暂无」
3. 写入 `<目录>/CLAUDE.md`
4. **停下来等用户审阅**，确认后再处理下一个

## 完成后

汇总报告：

- 共创建了 N 个子目录 CLAUDE.md
- 哪些目录的「对外契约」段最宽（建议未来收窄）
- 哪些目录的「常见陷阱」段需要用户尽快补充
- 提示下一步运行 `/build-safety-net`
