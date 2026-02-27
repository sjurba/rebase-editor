# TypeScript migration plan for `rebase-editor`

This document describes a **step-by-step plan** to introduce TypeScript into the project and migrate existing JavaScript files to TypeScript with low risk and small, verifiable increments.

## Goals

- Introduce TypeScript tooling without changing runtime behavior.
- Migrate all project-owned `.js` files to TypeScript (`.ts`, and where needed `.cts`/`.mts`).
- Preserve CLI behavior, terminal rendering behavior, parser/reducer semantics, and test behavior.
- Keep migration easy to review by splitting into small PR-sized steps.

## Current baseline (from repository)

- Runtime: Node.js ESM project (`"type": "module"`).
- Entry point: `/home/runner/work/rebase-editor/rebase-editor/index.js`.
- Source modules: `/home/runner/work/rebase-editor/rebase-editor/lib/*.js`.
- Tests: Mocha + Chai + Sinon in `/home/runner/work/rebase-editor/rebase-editor/test`.
- Current scripts include `test`, `tdd`, `cover`, `cover-ci`.
- No TypeScript tooling/config exists yet.

## Migration principles

1. **Behavior first**: no functional changes during migration.
2. **Small commits**: migrate one area at a time.
3. **Compile continuously**: keep TypeScript compiling at every step.
4. **Test continuously**: run tests after each migration slice.
5. **Interop-aware**: preserve ESM/CJS behavior for custom keybinding file loading.

## Phase 0 — Pre-migration preparation

1. Create a migration branch from the PR branch.
2. Record baseline:
   - `npm ci`
   - `npm test`
3. Capture module/file inventory and classify files:
   - Runtime code: `index.js`, `lib/*.js`
   - Test/support code: `test/*.js`, `test/testfiles/*.js`
4. Decide TypeScript target/version and Node target (align with `engines.node >=14.0`, or intentionally raise engine in a separate explicit decision if required by TS tooling choices).

## Phase 1 — Add TypeScript toolchain (no file migration yet)

1. Add dev dependencies:
   - `typescript`
   - `tsx` (or equivalent) for running tests directly from TS if desired
   - `@types/node`
   - Mocha/Chai/Sinon type packages as needed (`@types/mocha`, etc.)
2. Add `tsconfig.json` configured for Node ESM:
   - `module`: `NodeNext`
   - `moduleResolution`: `NodeNext`
   - `target`: conservative ES target compatible with supported Node
   - `rootDir` / `outDir` (for build output)
   - `declaration`: optional initially (recommended later)
   - `strict`: start `false` for migration; ratchet up later
   - `allowJs`: `true` for transitional compilation
   - `checkJs`: `false` initially
   - `esModuleInterop`: only if actually needed
3. Add scripts (example names):
   - `typecheck`: `tsc --noEmit`
   - `build`: `tsc -p tsconfig.json`
   - optionally `clean` for build artifacts
4. Update ignore/config as needed for build output (`dist/` etc.).

**Validation gate**
- Run: `npm run typecheck` (should pass with JS included and no strict checks).
- Run: `npm test` (must remain green).

## Phase 2 — Make runtime import path strategy explicit

Before renaming files, choose one of these strategies and stick to it:

### Strategy A (recommended): compile to `dist/`

- Keep source in TS under project root (or `src/`), compile to JS in `dist/`.
- Runtime/binary (`bin` in `package.json`) points to built JS in `dist/`.
- Pros: clean separation, conventional publishing.

### Strategy B: in-place emit

- Compile TS to JS next to source files.
- Pros: fewer path changes.
- Cons: noisy repo and higher risk of accidental source/emit confusion.

For this project, Strategy A is safer and easier for long-term maintenance.

## Phase 3 — Incremental runtime migration (`index.js` + `lib/*.js`)

Migrate runtime code first because it defines production behavior.

1. Rename and type one module at a time:
   - `lib/debounce.js` → `lib/debounce.ts`
   - `lib/utils.js` → `lib/utils.ts`
   - `lib/rebase-file.js` → `lib/rebase-file.ts`
   - `lib/reducer.js` → `lib/reducer.ts`
   - `lib/file-handle.js` → `lib/file-handle.ts`
   - `lib/debug-log.js` → `lib/debug-log.ts`
   - `lib/key-bindings.js` → `lib/key-bindings.ts`
   - `lib/terminal.js` → `lib/terminal.ts`
   - `lib/main.js` → `lib/main.ts`
   - `index.js` → `index.ts`
2. After each rename:
   - update local imports to `.js` runtime specifiers as required by NodeNext TS emit conventions.
   - add explicit interfaces/types for state and line objects used in parser/reducer/terminal.
   - keep behavior identical.
3. Introduce shared types in a focused module (e.g., `lib/types.ts`) once duplication appears:
   - `RebaseLine`
   - `Cursor`
   - `EditorState`
   - `Action`/`Command` unions where practical
4. Keep strictness pragmatic during migration:
   - allow `unknown`/narrowing where external libs are loosely typed.
   - avoid broad `any` unless temporary and localized.

**Validation gate after each migrated module**
- `npm run typecheck`
- `npm test`

## Phase 4 — Migrate tests to TypeScript

1. Rename test files to `.ts` one by one:
   - `/home/runner/work/rebase-editor/rebase-editor/test/*.spec.js` → `.spec.ts`
   - support files: `test/setup.ts`, `test/mock-terminal.ts`, `test/state-gen.ts`
2. Keep test fixtures that intentionally validate JS/CJS loading behavior:
   - Preserve `test/testfiles/customKeybindings.js`
   - Preserve `test/testfiles/customKeyBindingsCommonJs.js`
   - Preserve `test/testfiles/customKeybindings.json`
   These fixtures are part of behavior under test and may intentionally remain non-TS.
3. Ensure Mocha can run TS tests:
   - via `tsx` loader or precompiled tests from `dist/`.
4. Fix only typing/runtime compatibility issues introduced by conversion.

**Validation gate**
- `npm test`
- `npm run cover`
- `npm run typecheck`

## Phase 5 — Package and CLI alignment

1. Update `package.json` fields to reflect built artifacts:
   - `main`
   - `bin`
   - optional `exports`
   - `files` whitelist for publishable artifacts
2. Ensure shebang is preserved in emitted CLI entrypoint.
3. Verify install/use flows:
   - local execution (`node dist/index.js ...`)
   - linked binary usage if applicable
   - documented git `sequence.editor` usage still works

**Validation gate**
- Dry-run package verification (`npm pack --dry-run`)
- Manual smoke test against sample rebase file.

## Phase 6 — Tighten TypeScript settings

After full migration is stable:

1. Disable JS transition flags:
   - set `allowJs: false`
   - remove transitional excludes/includes no longer needed
2. Increase strictness in stages:
   - `noImplicitAny`
   - `strictNullChecks`
   - eventually `strict: true`
3. Address resulting type errors in small focused PRs.

## Phase 7 — Documentation updates

1. Update `/home/runner/work/rebase-editor/rebase-editor/README.md` development section:
   - build/typecheck commands
   - test command changes (if loader/build flow changes)
2. Add a short contributor note describing TS conventions:
   - import style
   - naming for files/types
   - when to add explicit interfaces
3. If releasing, add release notes summarizing migration and any Node/version changes.

## Risk checklist and mitigations

- **ESM/CJS loading regressions** (keybindings loader):
  - Keep dedicated tests for JSON, ESM JS, and CommonJS fixtures.
- **CLI entrypoint breakage**:
  - Smoke test binary and shebang handling after build.
- **Behavior drift in reducer/parser**:
  - Preserve current tests as regression safety net; avoid logic refactors during migration.
- **Large diff risk**:
  - Migrate file-by-file with continuous typecheck+test gates.

## Suggested PR slicing

1. PR 1: TypeScript toolchain + config + scripts (no renames).
2. PR 2: Migrate low-risk utility modules (`debounce`, `utils`, `file-handle`, `debug-log`).
3. PR 3: Migrate parser/reducer domain (`rebase-file`, `reducer`) + shared types.
4. PR 4: Migrate terminal/main/index runtime path.
5. PR 5: Migrate tests and finalize package/build wiring.
6. PR 6: Strictness tightening and cleanup.

## Definition of done

- All project source JS files are migrated to TypeScript.
- TypeScript build and typecheck pass in CI.
- Existing test suite passes with equivalent behavior.
- CLI usage documented and validated post-migration.
- Packaging points to compiled JS artifacts correctly.
