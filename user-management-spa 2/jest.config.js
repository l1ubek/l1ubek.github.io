const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}", "<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}"],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/**/*.d.ts",
    "!app/**/layout.tsx",
    "!app/**/loading.tsx",
    "!app/**/not-found.tsx",
    "!app/**/error.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transformIgnorePatterns: [
    "/node_modules/(?!next/dist/server/web/spec-extension/request|next/dist/server/web/spec-extension/response)",
  ],
  moduleDirectories: ["node_modules", "<rootDir>/"],
}

module.exports = createJestConfig(customJestConfig)
