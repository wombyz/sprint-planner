import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/*.e2e.{test,spec}.{js,ts}",
      // Exclude Convex function tests until functions are implemented
      // and `npx convex dev` has generated the _generated folder
      "**/tests/unit/convex/**",
    ],
  },
});
