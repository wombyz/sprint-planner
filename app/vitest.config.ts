import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    passWithNoTests: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/*.e2e.{test,spec}.{js,ts}",
    ],
    deps: {
      optimizer: {
        web: {
          include: ["convex-test"],
        },
      },
    },
  },
});
