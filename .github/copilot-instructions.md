# Copilot Instructions

## Project Overview

`rebase-editor` is a terminal-based interactive sequence editor for `git rebase -i`. It replaces the default text editor with a visual TUI driven by single-keypress commands. Users configure it via `GIT_SEQUENCE_EDITOR=rebase-editor` or `git config --global sequence.editor rebase-editor`.

## Commands

```bash
npm test                          # Run all tests (Mocha)
npm test -- test/reducer.spec.js  # Run a single test file
npm test -- --grep "should move"  # Run tests matching a pattern
npm run tdd                       # Watch mode with minimal output
npm run cover                     # Coverage report (HTML + text, via c8)
```

There is no separate lint command in package.json; ESLint is configured via `.eslintrc`.

## Architecture

The app follows a **unidirectional data flow** pattern:

```
index.js (CLI + arg parsing via minimist)
  └─ lib/main.js (event loop)
       ├─ lib/file-handle.js   → reads/writes the git rebase file
       ├─ lib/rebase-file.js   → parses file text ↔ internal state object
       ├─ lib/reducer.js       → pure function: (state, action) → newState
       ├─ lib/terminal.js      → renders state to terminal (terminal-kit)
       └─ lib/key-bindings.js  → maps keypress strings to action names
```

**State shape:**
```js
{
  lines: [{ action: 'pick', hash: 'abc123', message: 'commit msg' }, ...],
  cursor: { pos: 0, from: 0 },  // from != pos means a range is selected
  undoStack: [...],
  redoStack: [...],
  height: 24,   // terminal height, used for page up/down
  info: [],     // comment/metadata lines preserved from the rebase file
  extraInfo: [] // help text displayed below the list
}
```

**Key event loop** (in `main.js`): keypress → `key-bindings` lookup → `reducer(state, action)` → `terminal.render(newState)`. On quit/abort, state is serialized back to file text via `rebase-file.toFile()`.

## Key Conventions

**ES6 modules exclusively.** The package uses `"type": "module"` — always use `import`/`export default`, never `require()`.

**Pure, immutable reducer.** `lib/reducer.js` must remain a pure function. State is deeply frozen with `deepFreeze()` before being returned. Use object spreading to produce new state; never mutate.

```js
// Correct pattern inside reducer
function set(state, ...props) {
  return Object.assign({}, state, ...props);
}
return deepFreeze(set(state, { cursor: newCursor }));
```

**Single default export per file.** Each `lib/` file exports one thing as the default export.

**ESLint rules to respect:**
- Single quotes, semicolons required
- `===` only (no `==`)
- Curly braces required on all blocks
- No unused vars (prefix with `_` to suppress)
- No bitwise operators

## Testing Conventions

**Framework:** Mocha (BDD) + Chai + Sinon + chai-as-promised + sinon-chai. All configured globally in `test/setup.js` — no per-file imports of `chai` or `sinon` needed.

**Test file pattern:** `test/*.spec.js`

**Key test helpers:**
- `test/state-gen.js` — `getState(numLines, cursorPos, options)` generates a ready-to-use state object for reducer tests
- `test/mock-terminal.js` — stub `Terminal` implementation for testing `main.js` without real terminal I/O

**Mocha config** is in `test/.mocharc.yaml` (note: inside `test/`, not the project root).

**Coverage** is collected with `c8`. Run `npm run cover` to generate an HTML report in `coverage/`.
