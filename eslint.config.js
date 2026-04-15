// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import prettier from 'eslint-config-prettier';

export default [
  ...tseslint.configs['flat/strict-type-checked'],
  ...tseslint.configs['flat/stylistic-type-checked'],
  {
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      eqeqeq: 'error',
      curly: 'error',
      'no-bitwise': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['test/**/*.ts'],
    plugins: { 'chai-friendly': chaiFriendly },
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
  prettier,
];
