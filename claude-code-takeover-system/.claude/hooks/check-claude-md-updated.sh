#!/usr/bin/env bash
# .claude/hooks/check-claude-md-updated.sh
#
# Git pre-commit hook：检查源代码改动是否伴随 CLAUDE.md 更新。
# 实现宪法第 12 条的机器强制版本。
#
# 安装方式（在项目根目录执行）：
#   chmod +x .claude/hooks/check-claude-md-updated.sh
#   ln -sf ../../.claude/hooks/check-claude-md-updated.sh .git/hooks/pre-commit
#
# 临时跳过（仅当确认本次改动确实不影响任何 CLAUDE.md，罕见）：
#   git commit --no-verify

set -e

# 获取本次 commit 暂存的所有文件
staged_files=$(git diff --cached --name-only)

# 如果没有任何暂存文件，直接通过（理论上 git 不会让你 commit 空 diff，但保险起见）
if [ -z "$staged_files" ]; then
  exit 0
fi

source_changed=false
claude_md_changed=false
spec_or_test_changed=false

while IFS= read -r file; do
  case "$file" in
    # 源代码扩展名（可按项目调整）
    *.py|*.js|*.ts|*.jsx|*.tsx|*.html|*.vue|*.svelte|*.go|*.rs|*.java|*.kt|*.rb|*.php)
      source_changed=true
      ;;
    # CLAUDE.md 任意位置
    CLAUDE.md|*/CLAUDE.md)
      claude_md_changed=true
      ;;
    # 行为规格或测试也视为「已同步」的合法情况
    BEHAVIOR_SPEC.md|tests/*|*/tests/*)
      spec_or_test_changed=true
      ;;
  esac
done <<< "$staged_files"

# 仅改文档/配置/测试的 commit 直接通过
if ! $source_changed; then
  exit 0
fi

# 改了源代码但同时改了 CLAUDE.md，通过
if $claude_md_changed; then
  exit 0
fi

# 改了源代码 + 只改了测试/规格，没改 CLAUDE.md → 警告但通过（罕见合法场景）
if $spec_or_test_changed; then
  echo "⚠️  本次 commit 改动了源代码与测试/规格，但未更新任何 CLAUDE.md。"
  echo "    若您确认本次改动不影响任何目录的 CLAUDE.md 对外契约或内部实现描述，"
  echo "    请用 'git commit --no-verify' 跳过本检查。"
  echo "    否则请先更新 CLAUDE.md。"
  exit 1
fi

# 改了源代码但完全没动 CLAUDE.md → 拦截
echo "⚠️  检测到源代码改动，但没有任何 CLAUDE.md 被更新。"
echo "    根据会话宪法第 12 条：不更新 CLAUDE.md = 改动不算完成。"
echo ""
echo "    本次暂存的源代码文件："
while IFS= read -r file; do
  case "$file" in
    *.py|*.js|*.ts|*.jsx|*.tsx|*.html|*.vue|*.svelte|*.go|*.rs|*.java|*.kt|*.rb|*.php)
      echo "      - $file"
      ;;
  esac
done <<< "$staged_files"
echo ""
echo "    选项："
echo "    1. 更新相应目录的 CLAUDE.md，git add，再 commit（推荐）"
echo "    2. 如果确认本次改动确实不影响 CLAUDE.md（罕见），用：git commit --no-verify"
echo ""
exit 1
