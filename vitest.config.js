import { defineConfig } from "vitest/config";

// Characterization-test runner config.
// Default environment is Node; files needing the DOM opt in per-file via the
// `// @vitest-environment jsdom` pragma (useLocalStorage, icsService).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,jsx}"],
    clearMocks: true,
  },
});
