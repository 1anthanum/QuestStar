---
description: 诊断代码库，产出按风险×成本排序的 ISSUES.md
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Bash(wc:*), Write
---

# /diagnose

基于阶段一、二的产出（INVENTORY / DEPENDENCIES / PLAIN_LANGUAGE_MAP / BEHAVIOR_SPEC），输出 `ISSUES.md`。

## 前置条件

- `INVENTORY.md`、`DEPENDENCIES.md`、`PLAIN_LANGUAGE_MAP.md` 已存在
- `BEHAVIOR_SPEC.md` 已存在并被用户审阅过
- 各子目录 CLAUDE.md 已生成

## 输出

`ISSUES.md`，每个问题用以下结构：

```
## #N [一句话标题]

- 位置：file/path:行号（若适用）
- 类别：[重复代码 / 死代码 / 紧耦合 / 不一致命名 / 缺乏测试 / 安全风险 / 性能隐患 / 前端 / 后端 / 架构 / 其他]
- 描述：一两句中文
- 风险等级：低 / 中 / 高
- 修复成本：低 / 中 / 高
- 修复建议：一句话方向（不要写实现）
```

按 **风险 × 成本** 排序，把「高风险低成本」放最上面。

## 约束

- 不修改任何代码
- 每条问题都要标注类别（方便按类别统计）
- 不要把"代码不优雅"列为问题；只列真实风险或债务
- 不重复 BEHAVIOR_SPEC 已经覆盖的条目

## 完成后

输出统计摘要给用户：

```
共发现 N 个问题：
- 按类别：前端 X / 后端 Y / 架构 Z / 其他 W
- 按风险：高 A / 中 B / 低 C
- 按成本：高 D / 中 E / 低 F

⚠️ 前端类问题占比：X%
```

并提示用户：

> 请您亲自审阅 ISSUES.md：
> 1. 划掉 AI 误判的
> 2. 补全 AI 看不到的（业务 bug、用户反馈、生产事故）
> 3. 重新调整风险等级
>
> **关键决定**：如果前端类占比 > 30%，进入 `/refactor` 之前先评估整体换栈的可能性。
> 审完后运行 `/refactor #<id>` 处理第一项。
