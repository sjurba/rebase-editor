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

function getCurrentLine(message: string, cursorPos: number): { lineIdx: number; col: number; lineStart: number; lineEnd: number } {
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

export default function rewordReducer(state: RewordModeState, action: string, param?: unknown): RewordModeState {
  const { message, cursorPos } = state;

  if (action === 'rewordChar') {
    const char = param as string;
    return {
      ...state,
      message: insertAt(message, cursorPos, char),
      cursorPos: cursorPos + 1
    };
  }

  if (action === 'rewordEnter') {
    return {
      ...state,
      message: insertAt(message, cursorPos, '\n'),
      cursorPos: cursorPos + 1
    };
  }

  if (action === 'rewordBackspace') {
    if (cursorPos === 0) return state;
    return {
      ...state,
      message: removeAt(message, cursorPos - 1, 1),
      cursorPos: cursorPos - 1
    };
  }

  if (action === 'rewordDelete') {
    if (cursorPos >= message.length) return state;
    return {
      ...state,
      message: removeAt(message, cursorPos, 1)
    };
  }

  if (action === 'rewordLeft') {
    return { ...state, cursorPos: Math.max(0, cursorPos - 1) };
  }

  if (action === 'rewordRight') {
    return { ...state, cursorPos: Math.min(message.length, cursorPos + 1) };
  }

  if (action === 'rewordHome') {
    const { lineStart } = getCurrentLine(message, cursorPos);
    return { ...state, cursorPos: lineStart };
  }

  if (action === 'rewordEnd') {
    const { lineEnd } = getCurrentLine(message, cursorPos);
    return { ...state, cursorPos: Math.min(lineEnd, message.length) };
  }

  if (action === 'rewordUp') {
    const { lineIdx, col, lineStart } = getCurrentLine(message, cursorPos);
    if (lineIdx === 0) return state;
    const offsets = getLineOffsets(message);
    const prevLineStart = offsets[lineIdx - 1];
    const prevLineEnd = lineStart - 1; // position of the \n before current line
    const prevLineLen = prevLineEnd - prevLineStart;
    const newCursorPos = prevLineStart + Math.min(col, prevLineLen);
    return { ...state, cursorPos: newCursorPos };
  }

  if (action === 'rewordDown') {
    const { lineIdx, col } = getCurrentLine(message, cursorPos);
    const offsets = getLineOffsets(message);
    if (lineIdx >= offsets.length - 1) return state;
    const nextLineStart = offsets[lineIdx + 1];
    const nextLineEnd = (offsets[lineIdx + 2] ?? message.length + 1) - 1;
    const nextLineLen = nextLineEnd - nextLineStart;
    const newCursorPos = nextLineStart + Math.min(col, Math.max(0, nextLineLen));
    return { ...state, cursorPos: Math.min(newCursorPos, message.length) };
  }

  return state;
}
