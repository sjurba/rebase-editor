import { RebaseState, UndoEntry } from './types';
import rebaseReducer from './rebase-reducer';
import rewordReducer from './reword-reducer';

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Object.getOwnPropertyNames(obj);
  propNames.forEach(function (name) {
    const prop = (obj as Record<string, unknown>)[name];
    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop as object);
    }
  });
  return Object.freeze(obj);
}

function push(stack: UndoEntry[] | undefined, el: UndoEntry): UndoEntry[] {
  if (!stack) {
    stack = [];
  }
  return [...stack, el];
}

export default function reducer(state: RebaseState, action: string, param?: unknown): Readonly<RebaseState> {
  if (state.rewordMode) {
    if (action === 'rewordDone') {
      const { message, lineIndex } = state.rewordMode;
      const updatedLines = state.lines.map((line, idx) => {
        if (idx === lineIndex) {
          return { ...line, action: 'reworded', message };
        }
        return line;
      });
      const undoEntry: UndoEntry = { lines: state.lines, cursor: state.cursor };
      const newState: RebaseState = {
        ...state,
        lines: updatedLines,
        rewordMode: undefined,
        undoStack: push(state.undoStack, undoEntry),
        redoStack: []
      };
      return deepFreeze(newState);
    }

    if (action === 'rewordCancel') {
      return deepFreeze({ ...state, rewordMode: undefined });
    }

    const newRewordMode = rewordReducer(state.rewordMode, action, param);
    if (newRewordMode === state.rewordMode) {
      return state;
    }
    return deepFreeze({ ...state, rewordMode: newRewordMode });
  }

  return rebaseReducer(state, action, param);
}
