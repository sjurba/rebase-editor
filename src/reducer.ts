import { RebaseState, UndoEntry } from './types';
import rebaseReducer from './rebase-reducer';
import rewordReducer from './reword-reducer';

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

function push(stack: UndoEntry[] | undefined, el: UndoEntry): UndoEntry[] {
  stack ??= [];
  return [...stack, el];
}

export default function reducer(state: RebaseState, action: string, param?: unknown): Readonly<RebaseState> {
  if (action === 'resize') {
    return deepFreeze({ ...rebaseReducer(state, action, param), rewordState: state.rewordState });
  }
  if (state.rewordState) {
    if (action === 'rewordDone') {
      const { message, originalMessage, lineIndex } = state.rewordState;
      const updatedLines = state.lines.map((line, idx) => {
        if (idx === lineIndex) {
          return { ...line, action: 'reworded', message, originalMessage };
        }
        return line;
      });
      const undoEntry: UndoEntry = { lines: state.lines, cursor: state.cursor };
      const newState: RebaseState = {
        ...state,
        lines: updatedLines,
        rewordState: undefined,
        undoStack: push(state.undoStack, undoEntry),
        redoStack: [],
      };
      return deepFreeze(newState);
    }

    if (action === 'rewordCancel') {
      const { lineIndex, originalMessage } = state.rewordState;
      const updatedLines = state.lines.map((line, idx) => {
        if (idx === lineIndex) {
          return { ...line, message: originalMessage };
        }
        return line;
      });
      return deepFreeze({ ...state, lines: updatedLines, rewordState: undefined });
    }

    const newRewordState = rewordReducer(state.rewordState, action, param);
    if (newRewordState === state.rewordState) {
      return state;
    }
    return deepFreeze({ ...state, rewordState: newRewordState });
  }

  return rebaseReducer(state, action, param);
}
