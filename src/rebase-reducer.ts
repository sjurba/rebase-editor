import { RebaseState, RebaseLine, CursorState, UndoEntry, RewordModeState } from './types';

const actions = ['pick', 'fixup', 'fixup -c', 'fixup -C', 'squash', 'reword', 'edit', 'drop'];
const [DOWN, UP] = [1, -1];

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Object.getOwnPropertyNames(obj);
  propNames.forEach(function (name) {
    const prop = (obj as Record<string, unknown>)[name];
    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}

function cursor(from: number, pos: number): { cursor: CursorState } {
  return {
    cursor: {
      from: from,
      pos: pos,
    },
  };
}

function set(state: RebaseState, ...props: Partial<RebaseState>[]): RebaseState {
  return Object.assign({}, state, ...props) as RebaseState;
}

function insertAfterCurrentPosition(state: RebaseState, action: string, hash = '', message = ''): Partial<RebaseState> {
  let newLines = state.lines;
  const line: RebaseLine = { action: action, hash: hash, message: message };
  newLines = insertInto(newLines, line, state.cursor.pos + 1);
  return {
    lines: newLines,
    ...cursor(state.cursor.pos + 1, state.cursor.pos + 1),
  };
}

function push(stack: UndoEntry[] | undefined, el: UndoEntry): UndoEntry[] {
  stack ??= [];
  return [...stack, el];
}

function pop(stack: UndoEntry[]): UndoEntry[] {
  return stack.slice(0, stack.length - 1);
}

function removeFrom<T>(arr: T[], idx: number): T[] {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}

function insertInto<T>(arr: T[], el: T, idx: number): T[] {
  return [...arr.slice(0, idx), el, ...arr.slice(idx)];
}

function getSelection(state: RebaseState): [number, number] {
  return [state.cursor.from, state.cursor.pos].sort((a, b) => a - b) as [number, number];
}

function moveSelection(state: RebaseState, dir: number): Partial<RebaseState> {
  const [from, to] = getSelection(state);
  const lines = state.lines;
  let srcIdx: number, dstIdx: number;
  if (dir === DOWN) {
    srcIdx = to + 1;
    dstIdx = from;
  } else {
    srcIdx = from - 1;
    dstIdx = to;
  }
  const el = lines[srcIdx];
  let newLines = removeFrom(lines, srcIdx);
  newLines = insertInto(newLines, el, dstIdx);
  return {
    lines: newLines,
    ...cursor(state.cursor.from + dir, state.cursor.pos + dir),
  };
}

function getAction(state: RebaseState, action: string): Partial<RebaseState> {
  const [from, to] = getSelection(state);
  return {
    lines: state.lines.map((line, idx) => {
      if (from <= idx && idx <= to && isEditable(line.action)) {
        const message =
          line.action === 'reworded' && line.originalMessage !== undefined ? line.originalMessage : line.message;
        line = Object.assign({}, line, { action: action, message, originalMessage: undefined });
      }
      return line;
    }),
  };
}

function getUndo(state: RebaseState, stack: 'undoStack' | 'redoStack'): Partial<RebaseState> {
  const partialState: Partial<RebaseState> = {};
  partialState[stack] = push(state[stack], {
    lines: state.lines,
    cursor: state.cursor,
  });
  return partialState;
}

function popUndo(stack: UndoEntry[], stackName: 'undoStack' | 'redoStack'): Partial<RebaseState> {
  const partialState: Partial<RebaseState> = {};
  partialState[stackName] = pop(stack);
  return partialState;
}

function undo(state: RebaseState, undoKey: 'undoStack' | 'redoStack', redoKey: 'undoStack' | 'redoStack'): RebaseState {
  const undoStack = state[undoKey];
  const oldState = state;
  if (undoStack && undoStack.length > 0) {
    const undoState = undoStack[undoStack.length - 1];
    state = set(state, undoState as Partial<RebaseState>, getUndo(oldState, redoKey), popUndo(undoStack, undoKey));
  }
  return state;
}

function limitCursor(state: RebaseState, pos: number, from: number): { cursor: CursorState } {
  const max = state.lines.length - 1;
  return cursor(from < 0 ? 0 : from > max ? max : from, pos < 0 ? 0 : pos > max ? max : pos);
}

function isSelectionSame(a: CursorState, b: CursorState): boolean {
  return (a.pos === b.pos && a.from === b.from) || (a.pos === b.from && a.from === b.pos);
}

function updateCursor(state: RebaseState, pos: number, from: number): RebaseState {
  const cur = limitCursor(state, pos, from);
  if (isSelectionSame(state.cursor, cur.cursor)) {
    return state;
  } else {
    return set(state, {
      ...cur,
    });
  }
}

function getLineAction(state: RebaseState, pos: number = state.cursor.pos): string | undefined {
  return state.lines[pos]?.action;
}

function isEditable(action: string): boolean {
  const nonEditableActions = ['break', 'update-ref', 'label', 'reset', 'merge'];
  return !action.startsWith('#') && !nonEditableActions.includes(action);
}

export default function rebaseReducer(state: RebaseState, action: string, param?: unknown): Readonly<RebaseState> {
  const pos = state.cursor.pos;
  const from = state.cursor.from;
  const end = state.lines.length - 1;
  const oldState = state;
  if (action === 'undo') {
    state = undo(state, 'undoStack', 'redoStack');
  } else if (action === 'redo') {
    state = undo(state, 'redoStack', 'undoStack');
  } else {
    if (action === 'down') {
      state = updateCursor(state, pos + 1, pos + 1);
    } else if (action === 'up') {
      state = updateCursor(state, pos - 1, pos - 1);
    } else if (action === 'end') {
      state = updateCursor(state, end, end);
    } else if (action === 'home') {
      state = updateCursor(state, 0, 0);
    } else if (action === 'pageDown') {
      const newPos = pos + state.height;
      state = updateCursor(state, newPos, newPos);
    } else if (action === 'pageUp') {
      const newPos = pos - state.height;
      state = updateCursor(state, newPos, newPos);
    } else if (action === 'selectDown') {
      state = updateCursor(state, pos + 1, from);
    } else if (action === 'selectUp') {
      state = updateCursor(state, pos - 1, from);
    } else if (action === 'selectPageDown') {
      const newPos = pos + state.height;
      state = updateCursor(state, newPos, from);
    } else if (action === 'selectPageUp') {
      const newPos = pos - state.height;
      state = updateCursor(state, newPos, from);
    } else if (action === 'selectHome') {
      state = updateCursor(state, 0, from);
    } else if (action === 'selectEnd') {
      state = updateCursor(state, end, from);
    } else if (action === 'moveDown') {
      if (Math.max(pos, from) !== state.lines.length - 1) {
        state = set(state, moveSelection(state, DOWN));
      }
    } else if (action === 'moveUp') {
      if (Math.min(pos, from) !== 0) {
        state = set(state, moveSelection(state, UP));
      }
    } else if (action === 'resize') {
      state = set(state, {
        height: param as number,
      });
    } else if (
      action === 'reword' &&
      (state.lines[pos]?.action === 'reword' || state.lines[pos]?.action === 'reworded')
    ) {
      // Double-press reword (or press on already-reworded line): enter reword mode
      const line = state.lines[pos];
      const rewordState: RewordModeState = {
        message: line.message,
        originalMessage: line.message,
        lineIndex: pos,
        cursorPos: line.message.length,
      };
      state = set(state, { rewordState });
    } else if (actions.includes(action)) {
      const [from, to] = getSelection(state);
      let newState: Partial<RebaseState> & Pick<RebaseState, 'lines'> = { lines: state.lines };
      if (state.lines.slice(from, to + 1).some((line) => line.action !== action && line.hash)) {
        newState = getAction(state, action) as Partial<RebaseState> & Pick<RebaseState, 'lines'>;
      }
      if (action === 'drop' && state.lines.slice(from, to + 1).some((line) => !isEditable(line.action))) {
        const newLines = newState.lines.filter((_line, idx) => idx < from || idx > to || isEditable(_line.action));
        const removedLines = newState.lines.length - newLines.length;
        newState = {
          lines: newLines,
          ...cursor(
            state.cursor.from < state.cursor.pos ? state.cursor.from : state.cursor.from - removedLines,
            state.cursor.pos < state.cursor.from ? state.cursor.pos : state.cursor.pos - removedLines,
          ),
        };
      }
      if (newState.lines !== state.lines || newState.cursor) {
        state = set(state, newState);
      }
    } else if (action === 'break') {
      if (getLineAction(state) !== 'break' && getLineAction(state, state.cursor.pos + 1) !== 'break') {
        state = set(state, insertAfterCurrentPosition(state, 'break'));
      } else if (getLineAction(state, state.cursor.pos + 1) === 'break') {
        state = set(state, {
          ...cursor(pos + 1, pos + 1),
        });
      }
    }

    if (oldState !== state && oldState.lines !== state.lines) {
      state = set(state, getUndo(oldState, 'undoStack'), {
        redoStack: [],
      });
    }
  }
  return deepFreeze(state);
}
