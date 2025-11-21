import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    reporters: "default",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "coverage"
    }
  }
});






