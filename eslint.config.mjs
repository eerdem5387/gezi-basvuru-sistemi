import nextPlugin from "@next/eslint-plugin-next"
import baseConfig from "eslint-config-next"

export default [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]

