// ============================================================================
// 端到端测试公共帮手
//
// 设计原则（对应任务要求）：
//   - 只用"用户能做的操作"触发系统：点击、填写、上传、用浏览器打开页面。
//   - 只断言"用户能看到的结果"：界面文字、进度数字、下载文件内容、网络响应。
//   - 不调用任何项目内部函数（这里没有 import 项目任何源码）。
//   - 失败信息一律用中文，且让不懂代码的人也能读懂——通过 expect 的第二个参数
//     传入中文说明，断言失败时这句话会出现在报错里。
// ============================================================================

import { expect } from "@playwright/test";

/** 用户打开网页并跳过新手引导，回到可操作的主界面。 */
export async function 打开应用(page) {
  await page.goto("/");
  // 新手引导首次出现，点"Skip Guide"跳过（这是用户能做的真实操作）
  const 跳过 = page.getByRole("button", { name: /Skip Guide/i });
  if (await 跳过.count()) await 跳过.click();
  await expect(
    page.getByRole("button", { name: /Manual/i }).first(),
    "打开应用后没看到主界面的『✍️ Manual（手动创建）』按钮，说明应用没能正常打开。"
  ).toBeVisible();
}

/** 用户通过"手动创建"新建一个任务（填名称 + 每行一个步骤）。 */
export async function 手动创建任务(page, 名称, 步骤数组 = []) {
  await page.getByRole("button", { name: /✍️ Manual/i }).first().click();
  await page.getByPlaceholder(/Finish React/i).fill(名称);
  if (步骤数组.length) {
    await page.getByPlaceholder(/Watch Chapter 1/i).fill(步骤数组.join("\n"));
  }
  await page.getByRole("button", { name: /Create Quest/i }).click();
  await expect(
    page.getByText(名称).first(),
    `创建任务后，界面上没有出现任务名称『${名称}』，说明任务没有被创建出来。`
  ).toBeVisible();
}

/**
 * 关闭可能弹出的全屏庆祝遮罩（升级 / 任务完成 / 碎片掉落）。
 * 这些遮罩都是"点一下才关、不会自动消失"的，且碎片掉落是随机出现的，
 * 不关掉就会挡住后续点击。点遮罩角落即可触发其关闭。
 */
async function 关闭全屏庆祝(page) {
  for (let i = 0; i < 6; i++) {
    const 遮罩 = page.locator('div[class*="inset-0"][class*="bg-black"]');
    if ((await 遮罩.count()) === 0) return;
    await 遮罩.first().click({ position: { x: 6, y: 6 } }).catch(() => {});
    await page.waitForTimeout(350);
  }
}

/** 用户点击某个步骤所在的一行，把它标记为完成（并清掉随之而来的全屏庆祝）。 */
export async function 完成步骤(page, 步骤文字) {
  // 步骤行整行可点；用最后一个匹配，避开顶部"Next: …"提示里的同名文字
  await page.getByText(步骤文字).last().click();
  await page.waitForTimeout(1300); // 等奖励连锁开始
  await 关闭全屏庆祝(page);
}

/** 读取详情页"X / Y steps done"里的已完成数（用户能直接看到的数字）。读不到时返回 0。 */
export async function 读已完成步骤数(page) {
  try {
    const 文本 = await page.getByText(/\d+\s*\/\s*\d+ steps done/).first().innerText({ timeout: 2000 });
    return Number(文本.match(/(\d+)\s*\//)[1]);
  } catch {
    return 0;
  }
}

/** 读取顶部等级进度"X/100"里的当前经验（用户能直接看到的数字）。读不到时返回 0（便于轮询重试）。 */
export async function 读等级进度经验(page) {
  try {
    const 文本 = await page.getByText(/^\d+\/100$/).first().innerText({ timeout: 2000 });
    return Number(文本.split("/")[0]);
  } catch {
    return 0;
  }
}

/**
 * 把所有"外部服务"网络请求挡在浏览器外，喂入固定假响应，
 * 让依赖登录/AI/同步/VEM 的规则也能离线、稳定、可重复地测。
 * 注意：这是在浏览器与外部服务之间拦截 HTTP，不触碰项目内部代码。
 */
export async function 拦截外部服务(page, { aiText } = {}) {
  // 任何打到 Supabase（云端账号/数据库）的请求 → 返回空成功
  await page.route(/supabase\.co|supabase\.in/i, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  );
  // 任何打到 AI 服务商的请求 → 返回一段固定的假回答
  // 注意：开发模式下 Claude 走本地代理路径 /api/claude/**，所以这里一并拦截
  const 假回答 = aiText || '[{"text":"假步骤一"},{"text":"假步骤二"},{"text":"假步骤三"}]';
  await page.route(
    /anthropic\.com|bigmodel\.cn|deepseek\.com|aliyuncs\.com|\/api\/claude/i,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          content: [{ type: "text", text: 假回答 }],
          choices: [{ message: { content: 假回答 } }],
        }),
      })
  );
}

export { expect };
