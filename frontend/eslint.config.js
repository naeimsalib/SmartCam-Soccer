// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    plugins: { react },
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      // Add custom rules here
    },
  },
];