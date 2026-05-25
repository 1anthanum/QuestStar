---
description: 全项目侦察扫描，产出 INVENTORY/DEPENDENCIES/PLAIN_LANGUAGE_MAP
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Bash(wc:*), Write
---

# /takeover-scan

执行项目接手的第一阶段：全项目侦察。**全程只读源代码，不修改任何源码文件**。

## 前置条件

- 您已经填写了根 CLAUDE.md 中的「一句话项目说明」「技术栈」
- 项目在 Git 仓库中，工作树是干净的（`git status` 无 uncommitted changes）

## 流程

### 1. 产出 INVENTORY.md

扫描代码库根目录，生成 `INVENTORY.md`，包含：

- **目录结构**：最多三层，每个主目录用一句中文说明用途（基于代码内容推断，禁止猜）
- **入口文件**：main、index、CLI 命令、HTTP 路由注册点
- **外部依赖**：package.json / requirements.txt / pyproject.toml / go.mod 等。标注实际使用 / 可能未使用
- **技术栈**：编程语言、框架、构建工具及版本
- **异常文件**：>500 行、命名可疑、临时脚本、TODO/FIXME/HACK 注释

### 2. 产出 DEPENDENCIES.md

分析模块耦合，生成 `DEPENDENCIES.md`：

- 主要模块之间的引用关系（用 Mermaid 图）
- 循环依赖（若有）
- 「中心模块」：被引用最多，改动风险最高
- 「孤岛文件」：零引用，可能已死亡

### 3. 产出 PLAIN_LANGUAGE_MAP.md

为每个源代码文件生成中文说明，写入 `PLAIN_LANGUAGE_MAP.md`：

- 文件路径
- 这个文件存在的目的（一句中文，假设读者完全不懂编程）
- 输入 / 输出（用日常语言）
- 依赖哪些其他文件
- 哪些情况下需要修改它

## 约束

- 严格只读，不修改任何源代码文件
- 不确定的地方写「不确定」，禁止编造
- PLAIN_LANGUAGE_MAP 中一个文件 ≤ 5 行说明，宁可少写不要凑数
- 不使用未解释过的术语；必须用术语时立刻用一句中文解释
- 不使用 `Bash` 中受限的危险命令（rm、force push 等）

## 完成后

给用户一段中文总结：

1. 项目大概是做什么的（一段话）
2. 规模如何（文件数、代码行数、主要语言）
3. **最值得关注的三个发现**（异常文件、循环依赖、可疑模式等）
4. 提示用户下一步运行 `/init-claude-md`
