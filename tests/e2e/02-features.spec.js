// 端到端测试 · 功能规则（奖励查看 / 自动保存 / 批量导入 / AI 拆解 / 连接测试 / 安静路径）
// AI 与连接测试用"拦截网络 + 假响应"，离线稳定运行，不碰真实账号与费用。
import { test } from "@playwright/test";
import { expect, 打开应用, 手动创建任务, 拦截外部服务 } from "./helpers.js";

test.describe("第6节 · 奖励钱包", () => {
  test("当用户查看奖励面板时，系统应该显示钱包余额、各里程碑状态", async ({ page }) => {
    await 打开应用(page);
    await page.getByRole("button", { name: /💰\s*\$0/ }).first().click();
    await expect(page.getByText(/Wallet Balance/i), "奖励面板里没看到『钱包余额』。").toBeVisible();
    await expect(page.getByText(/Milestones/i), "奖励面板里没看到『里程碑』。").toBeVisible();
  });
});

test.describe("第18节 · 数据保存", () => {
  test("当用户做出任何会改变数据的操作后，系统应该自动保存；刷新或重新打开应用后这些数据仍然存在", async ({ page }) => {
    await 打开应用(page);
    await 手动创建任务(page, "刷新仍在的任务", ["步骤甲"]);
    await page.reload(); // 重开后新手引导已被记住、不会再出现
    await expect(
      page.getByText("刷新仍在的任务").first(),
      "刷新页面后，刚才创建的任务不见了——应该自动保存并保留。"
    ).toBeVisible();
  });
});

test.describe("第7节 · 批量导入 / 智能拆解", () => {
  test("当用户粘贴一份大纲并批量导入时，系统应该解析出可勾选的条目", async ({ page }) => {
    await 打开应用(page);
    await page.getByRole("button", { name: /📋 Batch Import/i }).first().click();
    await page.locator("textarea").first().fill("项目甲\n  子任务一\n  子任务二");
    await page.getByRole("button", { name: /Parse Outline/i }).click();
    await expect(page.getByText("项目甲"), "粘贴大纲并解析后，没看到解析出的『项目甲』条目。").toBeVisible();
    await expect(page.getByText("子任务一"), "解析后没看到子条目『子任务一』。").toBeVisible();
  });

  test("当用户输入一个目标并请求『智能拆解』时，系统应该生成一组步骤供预览", async ({ page }) => {
    await 拦截外部服务(page, {
      aiText: '[{"text":"假步骤一"},{"text":"假步骤二"},{"text":"假步骤三"}]',
    });
    await 打开应用(page);
    await page.getByRole("button", { name: /🤖 AI Decompose/i }).first().click();
    await page.getByPlaceholder(/Learn Python/i).fill("学会游泳");
    await page.getByRole("button", { name: /Anchored Decompose/i }).click();
    await expect(
      page.getByText("假步骤一"),
      "请求智能拆解后，没有出现生成的步骤供预览（已用假响应，应稳定出现）。"
    ).toBeVisible({ timeout: 12_000 });
  });
});

test.describe("第17节 · 设置与连接测试", () => {
  test("当用户测试某服务连接时，系统应该显示连接成功或失败的结果", async ({ page }) => {
    await 拦截外部服务(page); // 让连接请求稳定返回成功
    await 打开应用(page);
    await page.getByTitle(/Settings/i).first().click();
    await page.getByRole("button", { name: /Test Connection/i }).click();
    await expect(
      page.getByText(/Connection OK|Connection failed|连接/i),
      "点了『测试连接』后，没有显示任何成功或失败的结果。"
    ).toBeVisible({ timeout: 12_000 });
  });
});

test.describe("安静路径 · 不应产生副作用", () => {
  test("仅打开并关闭奖励面板（只浏览）——不应改变任何数据", async ({ page }) => {
    await 打开应用(page);
    await 手动创建任务(page, "浏览不影响数据", ["步骤甲"]);
    await page.getByRole("button", { name: /Back/i }).click();
    await page.getByRole("button", { name: /💰\s*\$0/ }).first().click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(
      page.getByText("浏览不影响数据").first(),
      "只是打开看了一下奖励面板，任务却受影响了。"
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /💰\s*\$0/ }),
      "只是浏览面板，钱包余额却从 $0 变了——浏览不应产生奖励。"
    ).toBeVisible();
  });
});
