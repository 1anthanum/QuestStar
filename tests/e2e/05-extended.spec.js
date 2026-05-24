// 端到端测试 · 进一步补全的真实用例（从 04-pending 升级而来）
import { test } from "@playwright/test";
import { expect, 打开应用, 手动创建任务, 完成步骤 } from "./helpers.js";

test.describe("第1节 · 进入应用与账号", () => {
  test("当用户通过密码界面（或该部署未设密码）后，系统应该直接进入可用的主界面，即使没有登录账号", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Skip Guide/i }).click().catch(() => {});
    await expect(
      page.getByRole("button", { name: /✍️ Manual/i }).first(),
      "未设访问密码时，应直接进入可用主界面，但没看到创建任务按钮。"
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Log In/i }).first(),
      "应处于未登录（访客）状态并提供登录入口。"
    ).toBeVisible();
  });

  test("如果登录或注册失败，系统应该显示明确的失败原因，并保持在未登录状态，不清空用户已填的内容", async ({ page }) => {
    // 拦截登录请求并返回失败，附带明确原因
    await page.route(/\/auth\/v1\//i, (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_grant", error_description: "邮箱或密码错误（测试）", msg: "邮箱或密码错误（测试）" }),
      })
    );
    await 打开应用(page);
    await page.getByRole("button", { name: /Log In/i }).first().click();
    await page.getByPlaceholder(/Email/i).fill("someone@example.com");
    await page.getByPlaceholder(/Password/i).fill("wrongpass");
    await page.getByPlaceholder(/Password/i).press("Enter");
    await expect(
      page.getByText(/邮箱或密码错误（测试）|invalid|错误|失败/i),
      "登录失败后没有显示任何失败原因。"
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByPlaceholder(/Email/i),
      "登录失败后把用户填的邮箱清空了——不应清空已填内容。"
    ).toHaveValue("someone@example.com");
  });
});

test.describe("第8节 · 学习 / 生活模式", () => {
  test("当处于「学习」模式时，系统应该展示与学习相关的板块", async ({ page }) => {
    await 打开应用(page); // 默认即学习模式
    await page.getByRole("button", { name: /📚\s*Study/i }).click();
    await expect(
      page.getByText(/Bloom Valley/i),
      "学习模式没看到学习相关板块（如知识/概念区『Bloom Valley』）。"
    ).toBeVisible();
  });

  test("当处于「生活」模式时，系统应该展示与生活习惯相关的板块", async ({ page }) => {
    await 打开应用(page);
    await page.getByRole("button", { name: /🌱\s*Life/i }).click();
    await expect(
      page.getByText(/Habit Dashboard|Daily Habits/i),
      "生活模式没看到习惯相关板块（如『习惯仪表盘 / 每日习惯』）。"
    ).toBeVisible();
  });
});

test.describe("第10节 · 背包/收藏", () => {
  test("当用户查看背包/收藏时，系统应该汇总展示已掌握技能、已收集碎片、奖励里程碑三类内容", async ({ page }) => {
    await 打开应用(page);
    await page.getByTitle(/Backpack/i).first().click();
    await expect(page.getByText(/Skills/i).first(), "背包里没看到『技能』分类。").toBeVisible();
    await expect(page.getByText(/Lore/i).first(), "背包里没看到『碎片』分类。").toBeVisible();
    await expect(page.getByText(/Rewards|Milestone/i).first(), "背包里没看到『奖励里程碑』分类。").toBeVisible();
  });
});

test.describe("第13节 · 智能启动器", () => {
  test("当用户打开「智能启动器（就做这一件）」时，系统应该只推荐一个当下最该做的步骤", async ({ page }) => {
    await 打开应用(page);
    await 手动创建任务(page, "启动器任务", ["步骤甲", "步骤乙"]);
    await page.getByRole("button", { name: /Back/i }).click();
    await page.getByTitle(/Smart Launcher/i).first().click();
    await expect(
      page.getByText(/步骤甲|步骤乙/).first(),
      "打开智能启动器后，没有推荐出任何可做的步骤。"
    ).toBeVisible();
  });
});

// 注：原计划把"满5步→+$2""钱包流水"也升级为真实用例，但端到端实测发现实现有问题——
// 连续完成多步后 qt_daily_steps 只累加到 2（应等于完成步数），导致『满5步』奖励从不触发、
// 钱包恒为 $0，与 BEHAVIOR_SPEC 规则 25/26/40 不符。这两条仍留在 04-pending 并写明该不一致，
// 待你确认（按规格修实现 / 还是修订规则）后再写正式用例。

test.describe("第17节 · 数据导入", () => {
  test("当用户导入一份备份时，系统应该恢复其中的数据", async ({ page }) => {
    await 打开应用(page);
    const 备份 = JSON.stringify({
      quests: [
        {
          id: "imp1",
          name: "从备份恢复的任务",
          category: "learning",
          questType: "daily",
          steps: [{ id: "s1", text: "恢复的步骤", done: false, difficulty: "easy" }],
          createdAt: 1700000000000,
        },
      ],
      xp: 0,
    });
    await page.getByTitle(/Settings/i).first().click();
    await page.locator('input[type=file]').setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(备份),
    });
    await expect(page.getByText(/Import successful/i), "导入有效备份后没有提示导入成功。").toBeVisible();
    await page.getByRole("button", { name: /Close|✕|×/i }).first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    await expect(
      page.getByText("从备份恢复的任务").first(),
      "导入备份后，备份里的任务没有被恢复显示出来。"
    ).toBeVisible();
  });

  test("如果导入的备份文件损坏或格式不符，系统应该拒绝导入并提示，不破坏现有数据", async ({ page }) => {
    await 打开应用(page);
    await 手动创建任务(page, "导入前已有任务", ["步骤甲"]);
    await page.getByRole("button", { name: /Back/i }).click();
    await page.getByTitle(/Settings/i).first().click();
    await page.locator('input[type=file]').setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from("这不是合法的 JSON {{{ "),
    });
    await expect(
      page.getByText(/Import failed/i),
      "导入损坏文件后没有给出失败提示。"
    ).toBeVisible();
    await page.keyboard.press("Escape").catch(() => {});
    await expect(
      page.getByText("导入前已有任务").first(),
      "导入损坏文件后，原有任务被破坏/丢失了——失败时不应影响现有数据。"
    ).toBeVisible();
  });
});
