import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
})
