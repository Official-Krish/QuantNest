const js = require('@eslint/js');

module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: require.resolve('@typescript-eslint/parser'),
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
      ],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      rules: {},
    },
    // JavaScript files
    {
      files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
      extends: [js.configs.recommended],
    },
  ],
};
