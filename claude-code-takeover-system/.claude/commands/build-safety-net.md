---
description: 建立安全网（BEHAVIOR_SPEC + E2E 测试 + Python 特征测试 + CI）。分阶段执行。
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Bash(pytest:*), Bash(npm:*), Write
argument-hint: --phase=spec|e2e|characterization|ci [--module=<path>]
---

# /build-safety-net

建立安全网。**这是接手流程中唯一不能跳的阶段**。

支持四个子阶段，按顺序执行：

- `--phase=spec` — 生成 BEHAVIOR_SPEC.md
- `--phase=e2e` — 基于 BEHAVIOR_SPEC 生成端到端测试
- `--phase=characterization --module=<path>` — 为指定 Python 模块生成特征测试
- `--phase=ci` — 配置 CI

参数：$ARGUMENTS

## 阶段一：spec（最关键）

读 `docs/templates/BEHAVIOR_SPEC.md` 模板，扫描代码生成 `BEHAVIOR_SPEC.md`。规则：

1. 每条用「当 [触发条件]，系统应该 [可观察结果]」的中文格式
2. 严禁描述代码内部如何实现
3. 必须包含错误路径：「如果 [异常]，系统应该 [响应]」
4. 必须包含安静路径：「以下操作不应该产生任何副作用：…」
5. 不确定的行为写在末尾的「待澄清」段，让用户回答

**生成后停下**，提示用户：

> 这一步要求您花 2-4 小时审阅。BEHAVIOR_SPEC 的质量决定整个安全网的质量。
> 请删掉 AI 编造的、补全 AI 看不到的业务规则、给「待澄清」段填答案。
> 审完告诉我「BEHAVIOR_SPEC 审完了」我再进入下一阶段。

## 阶段二：e2e

基于 `BEHAVIOR_SPEC.md`，为**每一条规则**生成一个端到端测试到 `tests/e2e/`。

- 测试名称用中文，原样引用规则文本
- 只通过用户能做的操作触发（HTTP 调用、点击、传文件）
- 只断言用户能观察到的结果（响应内容、文件内容、URL、可见元素）
- 严禁调用项目内部函数
- 测试失败时报错信息用中文，让不懂代码的人能读懂

**如果某条规则你无法写出测试**（缺数据、依赖外部服务），停下来告诉用户，不要跳过。

生成后跑一遍：`pytest tests/e2e/` 或 `npx playwright test tests/e2e/`。报告通过率。

## 阶段三：characterization

为参数 `--module=<path>` 指定的 Python 模块写 characterization tests 到 `tests/characterization/`。

- **不要"修正"现有行为**，即使看起来像 bug——目的是固化当前行为
- 覆盖：正常输入、边界输入、空输入、错误输入
- 不修改被测代码
- 列出无法测试的行为（依赖外部服务/随机数/当前时间）+ mock 方案
- 若代码无法被测（全局状态等），把原因写在测试文件顶部注释里

## 阶段四：ci

生成最小可用的 CI 配置（GitHub Actions 优先；或项目已用的工具）：

1. 只跑 lint + type check + 现有测试
2. 不引入新的 lint 规则
3. 配置完成后告诉用户需要手动做什么（启用 Actions 权限、设置 secrets 等）

不修改任何源代码文件。

## 完成后

完成 spec + e2e + ci 后（characterization 可选），提示：

> 安全网已建立。下一步：运行 `/diagnose` 产出 ISSUES.md，进入诊断阶段。
