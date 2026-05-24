// 端到端测试 · 更多可验证规则（登录入口 / 访客可用 / 拆解深度 / AI 失败 / 导出备份）
import { test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expect, 打开应用, 拦截外部服务 } from "./helpers.js";

test.describe("第1节 · 进入应用与账号", () => {
  test("当用户未登录时，系统应该以「访客」身份正常使用全部本机功能", async ({ page }) => {
    await 打开应用(page);
    await expect(
      page.getByRole("button", { name: /Log In/i }).first(),
      "未登录时顶部应有『登录』入口（说明当前是访客身份）。"
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /✍️ Manual/i }).first(),
      "访客状态下，创建任务等本机功能应可正常使用。"
    ).toBeEnabled();
  });

  test("当用户选择登录或注册时，系统应该提供「邮箱+密码」「用 Google 登录」「用 GitHub 登录」三种方式", async ({ page }) => {
    await 打开应用(page);
    await page.getByRole("button", { name: /Log In/i }).first().click();
    await expect(page.getByText(/Google/i), "登录界面没有『用 Google 登录』。").toBeVisible();
    await expect(page.getByText(/GitHub/i), "登录界面没有『用 GitHub 登录』。").toBeVisible();
    await expect(
      page.getByPlaceholder(/email|邮箱|@/i).first(),
      "登录界面没有邮箱输入框（缺少邮箱+密码方式）。"
    ).toBeVisible();
  });
});

test.describe("第7节 · 智能拆解", () => {
  test("当用户在拆解前选择不同的深度（快速 / 标准 / 深入）时，系统应该提供这些深度选项", async ({ page }) => {
    await 打开应用(page);
    await page.getByRole("button", { name: /🤖 AI Decompose/i }).first().click();
    await expect(page.getByText(/Quick Review/i), "智能拆解里没有『快速』深度选项。").toBeVisible();
    await expect(page.getByText(/Standard/i), "智能拆解里没有『标准』深度选项。").toBeVisible();
    await expect(page.getByText(/Deep Dive/i), "智能拆解里没有『深入』深度选项。").toBeVisible();
  });

  test("如果智能服务调用失败，系统应该保留用户已输入的内容，且不创建残缺任务", async ({ page }) => {
    // 拦截 AI 请求并返回失败（500）
    await page.route(/anthropic\.com|bigmodel\.cn|deepseek\.com|aliyuncs\.com|\/api\/claude/i, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"测试用失败"}' })
    );
    await 打开应用(page);
    await page.getByRole("button", { name: /🤖 AI Decompose/i }).first().click();
    await page.getByPlaceholder(/Learn Python/i).fill("学会游泳");
    await page.getByRole("button", { name: /Anchored Decompose/i }).click();
    await page.waitForTimeout(2500);
    await expect(
      page.getByPlaceholder(/Learn Python/i),
      "智能拆解失败后，用户填的目标『学会游泳』被清空了——应保留已输入内容。"
    ).toHaveValue("学会游泳");
    await expect(
      page.getByText("假步骤一"),
      "智能拆解失败后却出现了步骤——失败时不应产出残缺结果。"
    ).toHaveCount(0);
  });
});

test.describe("第17节 · 数据导出", () => {
  test("当用户导出本机数据时，系统应该生成一份可重新导入的备份", async ({ page }) => {
    await 打开应用(page);
    await page.getByTitle(/Settings/i).first().click();
    const [下载] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Export Data/i }).click(),
    ]);
    expect(
      下载.suggestedFilename(),
      `导出的文件名不像一份备份（实际：${下载.suggestedFilename()}）。`
    ).toMatch(/backup.*\.json$/i);
    const 路径 = await 下载.path();
    let 内容;
    try {
      内容 = JSON.parse(readFileSync(路径, "utf-8"));
    } catch {
      throw new Error("导出的备份文件内容不是有效的可重新导入格式（无法被正常读取）。");
    }
    expect(
      typeof 内容,
      "导出的备份文件内容为空或格式不对，无法重新导入。"
    ).toBe("object");
  });
});
