import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import feedicFlatConfig from "@feedic/eslint-config";
import { commonTypeScriptRules } from "@feedic/eslint-config/typescript";
import { defineConfig } from "eslint/config";
import eslintConfigBiome from "eslint-config-biome";
import globals from "globals";
import tseslint from "typescript-eslint";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    {
        linterOptions: {
            reportUnusedDisableDirectives: "error",
        },
    },
    {
        ignores: ["eslint.config.{js,cjs,mjs}", "vitest.config.ts"],
    },
    ...feedicFlatConfig,
    {
        files: ["**/*.{c,m,}ts"],
        extends: [...tseslint.configs.recommended],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.eslint.json",
            },
        },
        rules: {
            ...commonTypeScriptRules,
            "capitalized-comments": 0,
            "unicorn/no-array-callback-reference": 0,
            "unicorn/no-array-for-each": 0,
            "unicorn/no-for-loop": 0,
            "unicorn/no-negated-condition": 0,
            "unicorn/consistent-existence-index-check": 0,
            "unicorn/prefer-export-from": 0,
            "unicorn/prefer-spread": 0,
            "unicorn/prefer-string-raw": 0,
            "unicorn/prevent-abbreviations": 0,
        },
    },
    {
        files: ["**/*.{test,spec}.ts", "test/**/*.ts"],
        languageOptions: {
            globals: globals.vitest,
        },
        rules: {
            "n/no-unpublished-import": 0,
            "unicorn/prefer-array-find": 0,
            "unicorn/prefer-global-this": 0,
            "unicorn/import-style": 0,
            "unicorn/prefer-query-selector": 0,
        },
    },
    eslintConfigBiome,
]);
