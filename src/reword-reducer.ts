import { RewordModeState } from './types';

function insertAt(str: string, pos: number, chars: string): string {
  return str.slice(0, pos) + chars + str.slice(pos);
}

function removeAt(str: string, pos: number, count: number): string {
  return str.slice(0, pos) + str.slice(pos + count);
}

function getLineOffsets(message: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < message.length; i++) {
    if (message[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

function getCurrentLine(
  message: string,
  cursorPos: number,
): { lineIdx: number; col: number; lineStart: number; lineEnd: number } {
  const offsets = getLineOffsets(message);
  let lineIdx = 0;
  for (let i = offsets.length - 1; i >= 0; i--) {
    if (cursorPos >= offsets[i]) {
      lineIdx = i;
      break;
    }
  }
  const lineStart = offsets[lineIdx];
  const nextLineStart = offsets[lineIdx + 1] ?? message.length + 1;
  const lineEnd = nextLineStart - 1; // position of \n or past end
  const col = cursorPos - lineStart;
  return { lineIdx, col, lineStart, lineEnd };
}

function deleteSelection(state: RewordModeState): RewordModeState {
  const { message, cursorPos, selectAnchor } = state;
  if (selectAnchor === undefined) return state;
  const selStart = Math.min(selectAnchor, cursorPos);
  const selEnd = Math.max(selectAnchor, cursorPos);
  return {
    ...state,
    message: removeAt(message, selStart, selEnd - selStart),
    cursorPos: selStart,
    selectAnchor: undefined,
  };
}

function moveCursorUp(message: string, cursorPos: number): number {
  const { lineIdx, col, lineStart } = getCurrentLine(message, cursorPos);
  if (lineIdx === 0) {
    return cursorPos;
  }
  const offsets = getLineOffsets(message);
  const prevLineStart = offsets[lineIdx - 1];
  const prevLineLen = lineStart - 1 - prevLineStart;
  return prevLineStart + Math.min(col, prevLineLen);
}

function moveCursorDown(message: string, cursorPos: number): number {
  const { lineIdx, col } = getCurrentLine(message, cursorPos);
  const offsets = getLineOffsets(message);
  if (lineIdx >= offsets.length - 1) {
    return cursorPos;
  }
  const nextLineStart = offsets[lineIdx + 1];
  const nextLineEnd = (offsets[lineIdx + 2] ?? message.length + 1) - 1;
  const nextLineLen = nextLineEnd - nextLineStart;
  return Math.min(nextLineStart + Math.min(col, Math.max(0, nextLineLen)), message.length);
}

export default function rewordReducer(state: RewordModeState, action: string, param?: unknown): RewordModeState {
  const { message, cursorPos } = state;

  if (action === 'rewordUndo') {
    const restored = state.fullMessage ?? state.originalMessage;
    return {
      ...state,
      message: restored,
      cursorPos: restored.length,
      selectAnchor: undefined,
    };
  }

  if (action === 'rewordSelectAll') {
    return { ...state, selectAnchor: 0, cursorPos: message.length };
  }

  if (action === 'rewordChar') {
    const char = param as string;
    const base = state.selectAnchor !== undefined ? deleteSelection(state) : state;
    return {
      ...base,
      message: insertAt(base.message, base.cursorPos, char),
      cursorPos: base.cursorPos + 1,
    };
  }

  if (action === 'rewordEnter') {
    const base = state.selectAnchor !== undefined ? deleteSelection(state) : state;
    return {
      ...base,
      message: insertAt(base.message, base.cursorPos, '\n'),
      cursorPos: base.cursorPos + 1,
    };
  }

  if (action === 'rewordBackspace') {
    if (state.selectAnchor !== undefined) {
      return deleteSelection(state);
    }
    if (cursorPos === 0) {
      return state;
    }
    return {
      ...state,
      message: removeAt(message, cursorPos - 1, 1),
      cursorPos: cursorPos - 1,
    };
  }

  if (action === 'rewordDelete') {
    if (state.selectAnchor !== undefined) {
      return deleteSelection(state);
    }
    if (cursorPos >= message.length) {
      return state;
    }
    return {
      ...state,
      message: removeAt(message, cursorPos, 1),
    };
  }

  if (action === 'rewordDeleteLine') {
    const { lineStart, lineEnd } = getCurrentLine(message, cursorPos);
    const isLastLine = lineEnd >= message.length;
    const deleteStart = isLastLine && lineStart > 0 ? lineStart - 1 : lineStart;
    const deleteCount = isLastLine ? message.length - deleteStart : lineEnd - lineStart + 1; // +1 for the \n
    return {
      ...state,
      message: removeAt(message, deleteStart, deleteCount),
      cursorPos: deleteStart,
      selectAnchor: undefined,
    };
  }

  if (action === 'rewordLeft') {
    return { ...state, selectAnchor: undefined, cursorPos: Math.max(0, cursorPos - 1) };
  }

  if (action === 'rewordRight') {
    return { ...state, selectAnchor: undefined, cursorPos: Math.min(message.length, cursorPos + 1) };
  }

  if (action === 'rewordHome') {
    const { lineStart } = getCurrentLine(message, cursorPos);
    return { ...state, selectAnchor: undefined, cursorPos: lineStart };
  }

  if (action === 'rewordEnd') {
    const { lineEnd } = getCurrentLine(message, cursorPos);
    return { ...state, selectAnchor: undefined, cursorPos: Math.min(lineEnd, message.length) };
  }

  if (action === 'rewordUp') {
    return { ...state, selectAnchor: undefined, cursorPos: moveCursorUp(message, cursorPos) };
  }

  if (action === 'rewordDown') {
    return { ...state, selectAnchor: undefined, cursorPos: moveCursorDown(message, cursorPos) };
  }

  if (action === 'rewordShiftLeft') {
    if (cursorPos === 0) {
      return state;
    }
    const anchor = state.selectAnchor ?? cursorPos;
    return { ...state, selectAnchor: anchor, cursorPos: cursorPos - 1 };
  }

  if (action === 'rewordShiftRight') {
    if (cursorPos === message.length) {
      return state;
    }
    const anchor = state.selectAnchor ?? cursorPos;
    return { ...state, selectAnchor: anchor, cursorPos: cursorPos + 1 };
  }

  if (action === 'rewordShiftUp') {
    const newCursorPos = moveCursorUp(message, cursorPos);
    const anchor = state.selectAnchor ?? cursorPos;
    // On first line: jump to start of message
    return { ...state, selectAnchor: anchor, cursorPos: newCursorPos === cursorPos ? 0 : newCursorPos };
  }

  if (action === 'rewordShiftDown') {
    const newCursorPos = moveCursorDown(message, cursorPos);
    const anchor = state.selectAnchor ?? cursorPos;
    // On last line: jump to end of message
    return { ...state, selectAnchor: anchor, cursorPos: newCursorPos === cursorPos ? message.length : newCursorPos };
  }

  return state;
}
