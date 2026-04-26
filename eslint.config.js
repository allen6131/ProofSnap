const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['coverage/**', 'node_modules/**', 'dist/**'],
  },
];
