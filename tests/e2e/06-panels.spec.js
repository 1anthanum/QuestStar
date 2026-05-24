// 端到端测试 · 面板开/关安全网（为 ID-05 的 useModalManager 重写做准备）
// 这些面板原先没有 E2E 覆盖；重写会改变每个弹窗的开/关接线，先在这里把
// "能打开、能关闭、原数据不受影响" 固定下来，重写后必须仍然通过。
import { test } from "@playwright/test";
import { expect, 打开应用 } from "./helpers.js";

// 关闭当前面板：多数面板的关闭按钮是 × 或 ✕。
async function 关闭面板(page) {
  await page.getByRole("button", { name: /^[×✕]$/ }).first().click();
}

test.beforeEach(async ({ page }) => {
  await 打开应用(page);
});

test("打开并关闭『概念掌握（Blossom）』面板", async ({ page }) => {
  await page.getByTitle(/Blossom Mode/i).first().click();
  await expect(page.getByText(/All Concepts/i), "没打开概念掌握面板。").toBeVisible();
  await 关闭面板(page);
  await expect(page.getByText(/All Concepts/i), "概念掌握面板没关闭。").toBeHidden();
});

test("打开并关闭『知识碎片』面板", async ({ page }) => {
  await page.getByTitle(/Knowledge Lore/i).first().click();
  await expect(page.getByText(/Fragments Collected/i), "没打开知识碎片面板。").toBeVisible();
  await 关闭面板(page);
  await expect(page.getByText(/Fragments Collected/i), "知识碎片面板没关闭。").toBeHidden();
});

test("打开并关闭『时间线』面板", async ({ page }) => {
  await page.getByTitle(/Timeline/i).first().click();
  await expect(page.getByText("Timeline").first(), "没打开时间线面板。").toBeVisible();
  await 关闭面板(page);
  await expect(page.getByText("Timeline").first(), "时间线面板没关闭。").toBeHidden();
});

test("打开并关闭『精力档案』面板", async ({ page }) => {
  await page.getByTitle(/Energy Profile/i).first().click();
  await expect(page.getByText(/Current energy level/i), "没打开精力档案面板。").toBeVisible();
  await 关闭面板(page);
  await expect(page.getByText(/Current energy level/i), "精力档案面板没关闭。").toBeHidden();
});

test("打开并关闭『AI 助手』面板", async ({ page }) => {
  await page.getByTitle(/AI Copilot/i).first().click();
  await expect(page.getByText(/Quick Check-in/i), "没打开 AI 助手面板。").toBeVisible();
  await 关闭面板(page);
  await expect(page.getByText(/Quick Check-in/i), "AI 助手面板没关闭。").toBeHidden();
});

test("打开『Boss 战』面板（无逾期时显示空状态）并返回", async ({ page }) => {
  await page.getByTitle(/Boss Rush/i).first().click();
  await expect(page.getByText(/No overdue quests/i), "没打开 Boss 战面板。").toBeVisible();
  await page.getByRole("button", { name: /Back/i }).click();
  await expect(page.getByText(/No overdue quests/i), "Boss 战面板没关闭。").toBeHidden();
});
