import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            import: importPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: ['./tsconfig.json', './tsconfig.app.json'],
                },
                node: true,
            },
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
            'import/internal-regex': '^#',
        },
        rules: {
            // Import order
            'import/order': [
                'error',
                {
                    groups: [
                        ['builtin', 'external'],
                        'internal',
                        ['parent', 'sibling', 'index'],
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            // Cyclic imports check
            'import/no-cycle': [
                'error',
                {
                    maxDepth: 9999,
                    ignoreExternal: true,
                },
            ],
        },
    },
]);
