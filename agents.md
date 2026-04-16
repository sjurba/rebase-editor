# Agent Instructions

## Project Overview

`rebase-editor` is a terminal-based interactive sequence editor for `git rebase -i`. It replaces the default text editor with a visual TUI driven by single-keypress commands.

## Commands

```bash
npm run build          # Compile TypeScript (src/ → dist/)
npm test               # Run all tests (Mocha + tsx)
npm test -- test/reducer.spec.ts   # Run a single test file
npm test -- --grep "should move"   # Run tests matching a pattern
npm run coverage       # Coverage report (HTML + text, via c8)
npm run format         # Format all source and test files (Prettier)
npm run format:check   # Check formatting without writing
npm run lint           # Lint source and test files (ESLint)
npm run lint:fix       # Auto-fix lint violations
```

## Architecture

Unidirectional data flow. Source in `src/` (TypeScript), compiled output in `dist/`.

```
src/index.ts          CLI + arg parsing (minimist)
src/main.ts           event loop: keypress → reducer → render
src/file-handle.ts    reads/writes the git rebase file
src/rebase-file.ts    parses file text ↔ internal state
src/reducer.ts        pure function: (state, action) → newState
src/terminal.ts       renders state to terminal (terminal-kit)
src/key-bindings.ts   maps keypress strings to action names
src/types.ts          shared types: RebaseState, RebaseLine, CursorState, KeyBindings
```

## Conventions

- **TypeScript strict mode.** ES modules (`"type": "module"`). One default export per `src/` file.
- **Pure, immutable reducer.** State is deeply frozen before return. Never mutate — spread to produce new state.
- **ESLint** (`@typescript-eslint/strict-type-checked`): `===` only, curly braces required, no `any`, prefix unused vars with `_`.
- **Prettier** (`.prettierrc`): single quotes, print width 120.

## Testing

**Framework:** Mocha (BDD) + Chai + Sinon. Configured in `test/setup.ts`. Test files: `test/*.spec.ts`.

**Coverage:** 100% required. Enforced in CI via `c8 --100`. Run locally with `npm run coverage`.
