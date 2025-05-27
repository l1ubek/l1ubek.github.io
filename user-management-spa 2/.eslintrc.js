module.exports = {
  extends: ["next/core-web-vitals", "airbnb", "airbnb/hooks"],
  rules: {
    indent: ["error", 4],
    "react/jsx-indent": ["error", 4],
    "react/jsx-indent-props": ["error", 4],
    "max-len": ["error", { code: 400 }],
    "max-lines-per-function": ["error", { max: 75 }],
    "max-lines": ["error", { max: 400 }],
    "react/react-in-jsx-scope": "off",
    "react/jsx-filename-extension": [1, { extensions: [".tsx", ".jsx"] }],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        ts: "never",
        tsx: "never",
        js: "never",
        jsx: "never",
      },
    ],
    "import/no-unresolved": "off",
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "function-declaration",
        unnamedComponents: "arrow-function",
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
}
