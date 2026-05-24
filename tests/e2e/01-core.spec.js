// 端到端测试 · 核心可验证规则（任务/步骤/经验/外观/语言/安静路径）
// 命名原样引用 BEHAVIOR_SPEC.md 的规则文字；只用用户操作触发、只断言可见结果。
import { test } from "@playwright/test";
import {
  expect,
  打开应用,
  手动创建任务,
  完成步骤,
  读已完成步骤数,
  读等级进度经验,
} from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await 打开应用(page);
});

test.describe("第2节 · 任务与步骤", () => {
  test("当用户手动创建一个任务时，系统应该要求至少有任务名称，创建后该任务出现在任务列表中", async ({ page }) => {
    await page.getByRole("button", { name: /✍️ Manual/i }).first().click();
    const 创建按钮 = page.getByRole("button", { name: /Create Quest/i });
    // 先验证"要求任务名称"：只填步骤、不填名称时，"创建"按钮不可点（无法创建）
    await page.getByPlaceholder(/Watch Chapter 1/i).fill("某一步");
    await expect(
      创建按钮,
      "没填任务名称时，『创建』按钮却是可点的——规则要求至少要有任务名称。"
    ).toBeDisabled();
    // 再验证"填了名称就能创建并出现在列表"
    await page.getByPlaceholder(/Finish React/i).fill("买菜做饭");
    await expect(创建按钮, "填了名称后『创建』按钮仍不可点。").toBeEnabled();
    await 创建按钮.click();
    await expect(
      page.getByText("买菜做饭").first(),
      "填了名称创建后，列表里没有出现这个任务。"
    ).toBeVisible();
  });

  test("当用户打开一个任务时，系统应该显示它的全部步骤、完成进度，以及（若有）截止日期", async ({ page }) => {
    await 手动创建任务(page, "复习数学", ["看视频", "做习题"]);
    await expect(page.getByText("看视频").last(), "打开任务后没看到步骤『看视频』。").toBeVisible();
    await expect(page.getByText("做习题").last(), "打开任务后没看到步骤『做习题』。").toBeVisible();
    await expect(
      page.getByText(/0\s*\/\s*2 steps done/),
      "打开任务后没看到『已完成 0 / 共 2 步』这样的进度。"
    ).toBeVisible();
  });

  test("当用户把一个步骤标记为完成时，系统应该把它显示为已完成（已完成步骤数 +1）", async ({ page }) => {
    await 手动创建任务(page, "整理房间", ["扫地", "拖地"]);
    expect(await 读已完成步骤数(page), "刚创建时已完成步骤数应为 0。").toBe(0);
    await 完成步骤(page, "扫地");
    await expect(
      page.getByText(/1\s*\/\s*2 steps done/),
      "勾选一个步骤后，进度没有变成『已完成 1 / 共 2 步』。"
    ).toBeVisible();
  });

  test("当一个任务的所有步骤都完成时，系统应该把该任务显示为已完成（进度 100%）", async ({ page }) => {
    await 手动创建任务(page, "晨间例程", ["喝水", "拉伸"]);
    await 完成步骤(page, "喝水");
    await 完成步骤(page, "拉伸");
    await expect(
      page.getByText(/100%/),
      "两步都完成后，进度没有显示 100%（任务未被标记为已完成）。"
    ).toBeVisible();
  });

  test("当用户取消一个步骤的完成标记时，系统不发放奖励、也不扣回已获得的经验值", async ({ page }) => {
    // 用两步的任务、只动第一步，避免触发"任务完成"的全屏庆祝遮挡
    await 手动创建任务(page, "练字", ["上半页", "下半页"]);
    await 完成步骤(page, "上半页");
    // 轮询等待经验真正记上去（避免高并发下读到尚未更新的数值）
    await expect
      .poll(() => 读等级进度经验(page), { message: "完成步骤后经验值始终为 0，没有发放经验。" })
      .toBeGreaterThan(0);
    const 完成后经验 = await 读等级进度经验(page);
    await page.getByText("上半页").last().click(); // 再点一次 = 取消完成
    await page.waitForTimeout(1500);
    const 取消后经验 = await 读等级进度经验(page);
    expect(
      取消后经验,
      `取消完成后经验值被扣回了（从 ${完成后经验} 变成 ${取消后经验}），规则要求不能扣回。`
    ).toBe(完成后经验);
  });

  test("当用户请求删除一个任务时，系统应该先弹出确认提示；取消则不删除，确认则移除", async ({ page }) => {
    await 手动创建任务(page, "待删任务", ["一步"]);
    // 取消确认 → 不删除
    let 出现确认框 = false;
    page.once("dialog", (d) => {
      出现确认框 = true;
      d.dismiss();
    });
    await page.getByRole("button", { name: /Delete Quest/i }).click();
    await page.waitForTimeout(500);
    expect(出现确认框, "点删除时没有弹出确认提示。").toBe(true);
    await expect(
      page.getByText("待删任务").first(),
      "在确认框里选了取消，任务却被删掉了。"
    ).toBeVisible();
    // 确认 → 删除
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Delete Quest/i }).click();
    await page.waitForTimeout(800);
    await expect(
      page.getByText("待删任务"),
      "在确认框里点了确认，任务却还在列表里。"
    ).toHaveCount(0);
  });
});

test.describe("第3节 · 完成步骤后的即时反馈", () => {
  test("当用户完成一个步骤时，系统应该展示一次获得经验值的提示（经验值增加）", async ({ page }) => {
    await 手动创建任务(page, "背单词", ["背 10 个"]);
    expect(await 读等级进度经验(page), "刚创建时经验应为 0。").toBe(0);
    await 完成步骤(page, "背 10 个");
    await expect
      .poll(() => 读等级进度经验(page), {
        message: "完成步骤后，顶部的经验进度始终没有增加，看不到任何获得经验的反馈。",
      })
      .toBeGreaterThan(0);
  });
});

test.describe("第16节 · 外观与语言", () => {
  test("当用户切换主题时，系统应该立即改变整体配色，其余内容不变", async ({ page }) => {
    await 手动创建任务(page, "主题不影响数据", ["步骤A"]);
    await page.getByRole("button", { name: /Back/i }).click();
    const 切换前主色 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent")
    );
    await page.locator('[data-guide="theme-btn"]').click(); // 右下角主题切换按钮
    await page.waitForTimeout(300);
    const 切换后主色 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent")
    );
    expect(切换后主色, `切换主题后主色没有变化（仍是 ${切换前主色}）。`).not.toBe(切换前主色);
    await expect(
      page.getByText("主题不影响数据").first(),
      "切换主题后，原来的任务不见了——主题不应改动数据。"
    ).toBeVisible();
  });

  test("当用户切换语言（中文 / 英文）时，系统应该立即把界面文字切换为对应语言，其余数据不变", async ({ page }) => {
    await 手动创建任务(page, "语言不影响数据", ["步骤A"]);
    await page.getByRole("button", { name: /Back/i }).click();
    await expect(page.getByRole("button", { name: /✍️ Manual/ }), "切换前应是英文界面。").toBeVisible();
    await page.getByRole("button", { name: /^中$/ }).click();
    await expect(
      page.getByRole("button", { name: /手动创建/ }),
      "点了语言切换后，界面文字没有变成中文（『Manual』应变为『手动创建』）。"
    ).toBeVisible();
    await expect(
      page.getByText("语言不影响数据").first(),
      "切换语言后，原来的任务不见了——语言不应改动数据。"
    ).toBeVisible();
  });

  test("当用户下次再打开应用时，系统应该沿用其上次选择的主题与语言", async ({ page }) => {
    await page.getByRole("button", { name: /^中$/ }).click();
    await expect(page.getByRole("button", { name: /手动创建/ }), "切到中文未生效。").toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: /手动创建/ }),
      "重新打开后语言没有沿用上次的中文，又变回了英文。"
    ).toBeVisible();
  });
});

test.describe("安静路径 · 不应产生副作用", () => {
  test("打开任意弹窗/面板后未做提交就关闭——不应改变任何数据（以创建任务弹窗为例）", async ({ page }) => {
    await page.getByRole("button", { name: /✍️ Manual/i }).first().click();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(
      page.getByText(/All caught up/i),
      "打开创建弹窗又取消后，竟凭空多出了任务（应仍是空状态）。"
    ).toBeVisible();
  });

  test("切换『学习/生活』模式——只改变所显示的内容，不应改动任何数据", async ({ page }) => {
    await 手动创建任务(page, "模式不影响数据", ["步骤A"]);
    await page.getByRole("button", { name: /Back/i }).click();
    await page.getByRole("button", { name: /🌱\s*Life/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /📚\s*Study/i }).click();
    await page.waitForTimeout(300);
    await expect(
      page.getByText("模式不影响数据").first(),
      "来回切换模式后，原来的任务不见了——切模式不应改动数据。"
    ).toBeVisible();
  });
});
