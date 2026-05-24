import { defineConfig, devices } from "@playwright/test";

// 端到端测试配置：用真实浏览器驱动网页版（http://localhost:5173）。
// 测试只通过用户能做的操作触发、只断言用户能看到的结果。
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js", // 只收 .spec.js（忽略 _explore.mjs 等辅助脚本）
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/.report" }]],
  use: {
    baseURL: "http://localhost:5173",
    locale: "zh-CN",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 测试运行前自动拉起开发服务器（若已在运行则复用）
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
