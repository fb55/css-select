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
            "unicorn/no-array-callback-reference": 0,
            "unicorn/prefer-string-raw": 0,
        },
    },
    {
        files: ["**/*.{test,spec}.ts", "test/**/*.ts"],
        languageOptions: {
            globals: globals.vitest,
        },
        rules: {
            "n/no-unpublished-import": 0,
            "unicorn/prefer-query-selector": 0,
        },
    },
    eslintConfigBiome,
// These nodes implement domhandler APIs, not the browser DOM.
{
    "files": [
        "**/*.ts"
    ],
    "rules": {
        "unicorn/better-dom-traversing": "off"
    }
},
// Preserve established public predicate names and selector vocabulary.
{
    "files": [
        "src/general.ts",
        "src/helpers/cache.ts",
        "src/helpers/selectors.ts",
        "src/index.ts",
        "src/pseudo-selectors/filters.ts",
        "src/pseudo-selectors/pseudos.ts",
        "src/pseudo-selectors/subselects.ts"
    ],
    "rules": {
        "unicorn/consistent-boolean-name": "off"
    }
},
// HTTP URLs are intentional fixture inputs and assertions.
{
    "files": [
        "**/*.spec.ts",
        "test/**/*.ts"
    ],
    "rules": {
        "unicorn/prefer-https": "off"
    }
},
// Pseudo-selector names dynamically index the selector dispatch tables.
{
    "files": [
        "src/pseudo-selectors/index.ts"
    ],
    "rules": {
        "unicorn/no-computed-property-existence-check": "off"
    }
},
// The upstream Sizzle suite initializes its shared document fixture per test.
{
    "files": [
        "test/sizzle.ts",
        "test/tools/sizzle-testinit.ts"
    ],
    "rules": {
        "unicorn/no-top-level-assignment-in-function": "off"
    }
},

]);
