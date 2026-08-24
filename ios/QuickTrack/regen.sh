#!/bin/bash
# regen.sh — Regenerate Xcode project while preserving user preferences (scheme/destination/breakpoints).
#
# Usage:
#   cd ios/QuickTrack
#   ./regen.sh
#
# Why: xcodegen wipes xcuserdata/ on every generate, which loses:
#   - your selected scheme (e.g. QuickTrack_iOS)
#   - your selected destination (e.g. iPhone 14 Pro Max)
#   - breakpoints, source control prefs, etc.

set -e
cd "$(dirname "$0")"

USER_DATA_DIR="QuickTrack.xcodeproj/xcuserdata"
WORKSPACE_USER_DATA_DIR="QuickTrack.xcodeproj/project.xcworkspace/xcuserdata"
BACKUP_DIR="/tmp/quicktrack_xcuserdata_backup"

# Backup existing user data
if [ -d "$USER_DATA_DIR" ]; then
  echo "📦 Backing up xcuserdata..."
  rm -rf "$BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
  cp -R "$USER_DATA_DIR" "$BACKUP_DIR/xcuserdata"
  if [ -d "$WORKSPACE_USER_DATA_DIR" ]; then
    cp -R "$WORKSPACE_USER_DATA_DIR" "$BACKUP_DIR/workspace_xcuserdata"
  fi
fi

# Regenerate project
echo "⚙️  Running xcodegen..."
xcodegen generate

# Restore user data
if [ -d "$BACKUP_DIR/xcuserdata" ]; then
  echo "♻️  Restoring xcuserdata (scheme/destination preferences)..."
  rm -rf "$USER_DATA_DIR"
  cp -R "$BACKUP_DIR/xcuserdata" "$USER_DATA_DIR"
  if [ -d "$BACKUP_DIR/workspace_xcuserdata" ]; then
    mkdir -p "QuickTrack.xcodeproj/project.xcworkspace"
    cp -R "$BACKUP_DIR/workspace_xcuserdata" "$WORKSPACE_USER_DATA_DIR"
  fi
fi

echo "✅ Done. Your scheme + destination should be preserved."
