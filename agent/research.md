# rebase-editor research report

## 1) What this project is and what it does

`rebase-editor` is a Node.js CLI tool that replaces Git’s default interactive rebase text editor with a terminal UI. Instead of manually editing the rebase todo text file in a standard editor, the user can:

- move up/down through commits,
- select single/multiple lines,
- reorder selected commits,
- change actions (`pick`, `squash`, `fixup`, etc.),
- insert/drop `break` lines,
- undo/redo changes,
- then save/quit (or abort).

The tool is intended to be configured as `sequence.editor`:

- `git config --global sequence.editor rebase-editor`

It can also be used one-off via `GIT_SEQUENCE_EDITOR`.

---

## 2) High-level architecture

The codebase is compact and organized into clear modules:

- **`index.js`**: process entrypoint, CLI argument parsing, wiring dependencies.
- **`lib/main.js`**: runtime orchestration (read file -> parse -> render loop -> write file -> cleanup).
- **`lib/rebase-file.js`**: parser/serializer between raw rebase text and internal state model.
- **`lib/reducer.js`**: pure state transitions for all editing commands.
- **`lib/terminal.js`**: terminal rendering, viewport logic, input and resize listeners.
- **`lib/key-bindings.js`**: default and user-provided key map loading.
- **`lib/file-handle.js`**: Promise-based file read/write wrapper.
- **`lib/utils.js`**: line trimming that understands terminal-kit style markers.
- **`lib/debounce.js`**: local debounce utility (used for resize handling).
- **`lib/debug-log.js`**: optional console.log trapping to file.

The architecture follows a reducer-driven loop similar to unidirectional state flow:

1. Parse file to state.
2. Render state.
3. On key press -> map key to action -> `reducer(state, action)`.
4. Render new state.
5. On quit/abort, serialize and write.

---

## 3) CLI behavior and arguments

From `index.js` and README:

- `-s, --status`: render status/debug line.
- `-k, --keys <file>`: custom keybindings file (`.json`, ESM `.js`, CommonJS `.cjs`).
- `-c, --colors [csv]`: enable and optionally customize colors.
  - bare `-c` defaults to `['^r','^y']`.
  - CSV controls action/hash/message colors.
- `-m, --marker <string>`: selected-line marker string (or terminal-kit style code).
- `--no-alternate-screen`: disable alternate screen mode.

Input file handling:

- The rebase file is taken as the last positional arg.
- If not provided, program prints `No input file specified.` and exits with code `1`.

Platform-specific marker behavior:

- On Windows, default selection marker is switched from inverse (`^!`) to yellow (`^Y`) due ANSI support limitations.

---

## 4) Core data model

State produced by `rebase-file.toState()` includes:

- `lines`: list of editable/rendered lines as `{ action, hash, message }`.
- `info`: non-editable comment lines shown below editable section.
- `cursor`: `{ pos, from }`
  - `pos`: current cursor line.
  - `from`: selection anchor.
- `extraInfo`: function that generates appended command help text from current key map.
- During runtime, reducer also adds:
  - `undoStack`
  - `redoStack`
  - `height` (terminal height, updated on resize)

The reducer deep-freezes returned state (`Object.freeze` recursively), enforcing immutability by contract.

---

## 5) Parsing and serialization details

### Parsing (`toState`)

- Splits file by newline.
- Validates first line starts with one of:
  - `noop`, `pick`, `break`, `update-ref`, `label`, or `# pick`.
  - Otherwise throws “Not a proper rebase file”.
- Trims each line; skips blanks.
- Comment lines are split:
  - `# pick ...` is treated as a line entry with action `# pick` (empty commit format preserved).
  - `# Branch` and `# Branch:` lines are parsed into editable `lines` (for rebase-merges format compatibility).
  - Other `# ...` lines are sent to `info`.

### Serialization (`toFile`)

- Converts each line to `[action, hash, message].filter(Boolean).join(' ')`.
- Emits:
  - all action lines,
  - a blank separator line,
  - then info lines.
- If state is `undefined` (abort path), returns empty string.

Notable behavior: parser removes blank lines internally; serializer rewrites canonical output format.

---

## 6) Editing semantics in the reducer

`lib/reducer.js` is the behavioral core.

### Supported action changes
Editable action set:

- `pick`, `fixup`, `fixup -c`, `fixup -C`, `squash`, `reword`, `edit`, `drop`

Non-editable actions:

- `break`, `update-ref`, `label`, `reset`, `merge`, and comment-like actions (e.g. `# pick`).

Rules:

- Action changes apply to entire current selection.
- Only lines with hash and editable actions can be changed.
- `drop` is special: besides normal drop conversion, it removes selected non-editable special lines entirely.

### Cursor and selection

- Arrow movement clamps to valid bounds.
- Selection can be anchored and expanded in either direction.
- Home/end/page navigation and selection variants are supported.
- Selection comparison is normalized (same selection regardless of direction).

### Reordering

- Move commands shift single or multi-line selection up/down.
- Moves are blocked at top/bottom boundaries.

### Break line behavior

- `break` inserts a break line after current position.
- Guard prevents duplicate adjacent break insertion.
- If next line already is `break`, cursor jumps to it.
- Break lines can be removed with `drop`.

### Undo/redo model

- Snapshot-based stacks (`undoStack`, `redoStack`), storing `{lines, cursor}`.
- Undo/redo operate by popping latest snapshot from respective stack.
- Redo stack is cleared on new line-changing edits.
- Cursor-only moves are intentionally not recorded as undoable edits.

---

## 7) Terminal rendering and UX behavior

`lib/terminal.js` wraps `terminal-kit`.

### Screen lifecycle

- Constructor:
  - enters fullscreen if alternate screen enabled,
  - otherwise prints enough blank lines to preserve shell history behavior,
  - hides cursor.
- Close:
  - exits fullscreen if enabled,
  - otherwise moves cursor to line after viewport and erases line,
  - restores cursor visibility.

### Input and resize

- Key events are translated via `keyBindings` map to reducer actions.
- Resize events are debounced (`100ms`) and trigger a reducer `resize` action with new height.
- On startup, an initial resize action is emitted so state has terminal height.

### Rendering strategy

- Builds display lines from:
  1. editable lines,
  2. blank separator,
  3. info lines (+ injected extra keybinding help after second empty `#` line marker).
- Selected lines use marker prefix unless colors are active and line is unselected.
- Escapes `^` in commit messages to `^^` to avoid terminal-kit style interpretation.
- Truncates to terminal width with style-aware `trimTo()`.
- Maintains `viewPort` cache and only rewrites lines that changed.
- Computes scroll offset so cursor/selection remains visible.
- Optional status line includes cursor and raw key diagnostics.

---

## 8) Keybinding system details

Default bindings include:

- Movement: `UP`, `DOWN`, `HOME`, `END`, `PAGE_UP`, `PAGE_DOWN`
- Selection: `SHIFT_*` variants
- Reorder: `LEFT`/`CTRL_UP` and `RIGHT`/`CTRL_DOWN`
- Actions: `p r e s f d b`
- Advanced fixup: `ALT_F` (`fixup -c`), `CTRL_F` (`fixup -C`)
- Undo/redo: `z`, `CTRL_Z`, `Z`, `CTRL_SHIFT_Z`
- Quit/abort: `q`, `ENTER`, `CTRL_C`, `ESCAPE`

Custom key file behavior:

- JSON imports use ESM import assertions.
- JS modules are dynamically imported.
- CommonJS requires `.cjs`; failures produce explicit guidance error message.
- User keys are merged over defaults (`Object.assign(defaults, custom)`).

`rebase-file` dynamically derives help text from resolved key map, so help comments reflect custom bindings.

---

## 9) Test suite and quality posture

Test stack: Mocha + Chai + Sinon (+ chai-as-promised), plus c8 coverage scripts.

### Coverage breadth

- **Reducer tests**: extensive scenario coverage for navigation, selection, move, break, action changes, undo/redo, and resize.
- **Terminal tests**: viewport rendering, truncation, color handling, selection highlighting, resize debounce behavior, alternate-screen differences.
- **Parser tests**: normal rebase lines, noop, blank-line normalization, empty commits (`# pick`), rebase-merges constructs (`label/reset/merge`), key help text insertion.
- **Main loop tests**: integration-level read/render/input/write/exit behavior.
- **Key binding tests**: default + custom JSON/ESM/CommonJS loading and error path.
- **Fuzzy reducer test**: random action sequences to detect crashes/regressions.

Current baseline run in this environment: all tests pass (`144 passing`).

---

## 10) Specific supported/unsupported git rebase features

Supported editing operations:

- Standard action edits (`pick/reword/edit/squash/fixup/drop`).
- `break` insertion/deletion.
- Handling/moving/dropping of advanced lines from:
  - `--update-refs` (`update-ref`)
  - `--rebase-merges` (`label`, `reset`, `merge`)

Explicitly not supported:

- `exec` command editing/execution (`x`) (documented in README and injected help notes).
- Creating new `update-ref`, `label`, `reset`, or `merge` lines (can only move/drop existing ones).

---

## 11) Notable edge cases and specificities

- Input validation rejects non-rebase files early.
- Empty input file is rejected by `FileHandle.read()` (`File was empty`).
- Abort path intentionally writes empty file, relying on Git behavior to abort when todo is empty.
- Selection works in both directions (`from > pos` and `from < pos`).
- Width trimming is style-aware so terminal color tags do not break truncation.
- In non-alternate-screen mode, rendering appends output instead of fullscreen replacement.
- Debug logging can trap `console.log` and persist to `console.log` file during run.

---

## 12) Observed technical debt / limitations (research only)

These are observations only (no code changes proposed):

- Some thrown errors are strings instead of `Error` instances.
- `debug-log.js` writes to a relative `console.log` path in CWD.
- README still references old CI badges (`travis-ci`) while project now uses modern deps/tooling.
- `install-editor.sh` prompts and sets local `sequence.editor`; docs emphasize global config.

None of these block core functionality tested in current suite.

---

## 13) Practical runtime summary

At runtime, `rebase-editor` behaves like a deterministic, keyboard-driven state machine around Git’s rebase todo file:

- parse Git-generated todo,
- allow constrained transformations with safeguards,
- preserve associated metadata/comments,
- serialize back in a clean format,
- and exit cleanly with terminal restoration.

The combination of immutable reducer logic plus broad tests (including fuzzy sequence testing) is the project’s strongest engineering characteristic.
