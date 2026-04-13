# Copilot Instructions

## Project Overview

`rebase-editor` is a terminal-based interactive sequence editor for `git rebase -i`. It replaces the default text editor with a visual TUI driven by single-keypress commands. Users configure it via `GIT_SEQUENCE_EDITOR=rebase-editor` or `git config --global sequence.editor rebase-editor`.

## Commands

```bash
npm run build                          # Compile TypeScript (src/ → dist/)
npm test                               # Run all tests (Mocha + tsx)
npm test -- test/reducer.spec.ts       # Run a single test file
npm test -- --grep "should move"       # Run tests matching a pattern
npm run tdd                            # Watch mode with minimal output
npm run coverage                       # Coverage report (HTML + text, via c8)
npm run format                         # Format all source and test files (Prettier)
npm run format:check                   # Check formatting without writing
npm run lint                           # Lint all source and test files (ESLint)
npm run lint:fix                       # Auto-fix lint violations
```

## Architecture

The app follows a **unidirectional data flow** pattern. Source code is in `src/` (TypeScript), compiled output goes to `dist/`.

```
src/index.ts (CLI + arg parsing via minimist)
  └─ src/main.ts (event loop)
       ├─ src/file-handle.ts   → reads/writes the git rebase file
       ├─ src/rebase-file.ts   → parses file text ↔ internal state object
       ├─ src/reducer.ts       → pure function: (state, action) → newState
       ├─ src/terminal.ts      → renders state to terminal (terminal-kit)
       └─ src/key-bindings.ts  → maps keypress strings to action names
```

**Shared types** are in `src/types.ts` — `RebaseState`, `RebaseLine`, `CursorState`, `KeyBindings`, etc.

**State shape:**

```ts
interface RebaseState {
  lines: RebaseLine[]; // { action, hash, message }
  cursor: CursorState; // { pos, from } — from != pos means a range is selected
  undoStack?: UndoEntry[];
  redoStack?: UndoEntry[];
  height: number; // terminal height, used for page up/down
  info: string[]; // comment/metadata lines preserved from the rebase file
  extraInfo?: ExtraInfoFn; // function that generates help text from key bindings
}
```

**Key event loop** (in `main.ts`): keypress → `key-bindings` lookup → `reducer(state, action)` → `terminal.render(newState)`. On quit/abort, state is serialized back to file text via `rebase-file.toFile()`.

## Key Conventions

**TypeScript with strict mode.** The project uses `strict: true` in `tsconfig.json`. Source is in `src/`, tests in `test/`. The project uses ES modules (`"type": "module"` in package.json).

**Pure, immutable reducer.** `src/reducer.ts` must remain a pure function. State is deeply frozen with `deepFreeze()` before being returned. Use object spreading to produce new state; never mutate.

**Single default export per file.** Each `src/` file exports one thing as the default export. Shared types are in `src/types.ts`.

**ESLint** enforces strict rules via `@typescript-eslint/strict-type-checked` + `stylistic-type-checked`. Run `npm run lint` to check, `npm run lint:fix` to auto-fix. Key rules:

- `===` only (no `==`)
- Curly braces required on all blocks
- No unused vars (prefix with `_` to suppress)
- No bitwise operators
- No explicit `any`, no unsafe operations (full type-aware checking)

**Prettier** enforces formatting. Run `npm run format` to apply, `npm run format:check` to verify. Config in `.prettierrc` (single quotes, print width 120, all other options are Prettier defaults).

**Commit conventions:**

- Do not include `Co-authored-by` trailers in commit messages

## Testing Conventions

**Framework:** Mocha (BDD) + Chai + Sinon + chai-as-promised + sinon-chai. All configured globally in `test/setup.ts`.

**Test file pattern:** `test/*.spec.ts`

**Key test helpers:**

- `test/state-gen.ts` — `getState(numLines, cursorPos, options)` generates a ready-to-use state object for reducer tests
- `test/mock-terminal.ts` — stub `Terminal` implementation for testing `main.ts` without real terminal I/O

**Mocha config** is in `.mocharc.yaml` at the project root. Tests run via `tsx` for ESM TypeScript support.

**Coverage** is collected with `c8`. Run `npm run coverage` to generate an HTML report in `coverage/`. 100% coverage is required — CI enforces this with `--100`.

**ESLint config** is in `eslint.config.js` (flat config). Tests are type-checked via `tsconfig.eslint.json` which extends `tsconfig.json` and adds `test/`. The build `tsconfig.json` excludes `test/` to keep the production build clean.
