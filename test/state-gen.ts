import { RebaseState, RebaseLine, CursorState, RewordModeState } from '../src/types';

interface StateInput {
  lines: RebaseLine[];
  cursor?: number | CursorState;
  info?: string[];
  height?: number;
}

export function getLines(count: number): RebaseLine[] {
  return new Array(count || 0).fill(null).map((_val: null, idx: number) => ({
    action: 'pick',
    hash: '123',
    message: `Line ${idx}`,
  }));
}

export function getRewordState(overrides?: Partial<RewordModeState>): RewordModeState {
  const message = overrides?.message ?? 'My commit';
  return {
    message,
    originalMessage: message,
    lineIndex: 0,
    cursorPos: 0,
    ...overrides,
  };
}

export function getState(
  lines: number | RebaseLine[] | StateInput,
  cursor?: number | CursorState,
  info?: number | string[],
): RebaseState {
  let height = 20;
  if (typeof lines === 'number') {
    lines = getLines(lines);
  } else if (!Array.isArray(lines)) {
    ({ lines, cursor, info, height = 20 } = lines);
  }
  if (typeof info === 'number') {
    info = new Array(info || 0).fill(null).map((_val: null, idx: number) => {
      return `# Info ${idx}`;
    });
  }
  cursor ??= 0;
  if (typeof cursor === 'number') {
    cursor = {
      pos: cursor,
      from: cursor,
    };
  }
  return {
    lines: lines,
    cursor: cursor,
    otherStateVar: {
      foo: 'bar',
    },
    info: info ?? [],
    height: height,
  };
}
