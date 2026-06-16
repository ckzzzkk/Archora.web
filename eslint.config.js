// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // eslint-plugin-import's resolver-dependent rules crash under the current
    // dependency versions (and TypeScript already validates module resolution),
    // so disable them and let the rest of lint run.
    rules: {
      "import/namespace": "off",
      "import/no-unresolved": "off",
      "import/default": "off",
      "import/export": "off",
    },
  },
]);
