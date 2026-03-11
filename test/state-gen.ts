import { RebaseState, RebaseLine, CursorState } from '../src/types.js';

interface StateInput {
  lines: RebaseLine[];
  cursor?: number | CursorState;
  info?: string[];
  height?: number;
}

export default function getState(lines: number | RebaseLine[] | StateInput, cursor?: number | CursorState, info?: number | string[]): RebaseState {
  let height = 20;
  if (typeof lines === 'number') {
    lines = new Array(lines || 0).fill(null).map((_val: null, idx: number) => {
      return {
        action: 'pick',
        hash: '123',
        message: 'Line ' + idx
      };
    });
  } else if (!Array.isArray(lines)) {
    ({
      lines,
      cursor,
      info,
      height = 20
    } = lines as StateInput);
  }
  if (typeof info === 'number') {
    info = new Array(info || 0).fill(null).map((_val: null, idx: number) => {
      return '# Info ' + idx;
    });
  }
  if (!cursor) {
    cursor = 0;
  }
  if (typeof cursor === 'number') {
    cursor = {
      pos: cursor,
      from: cursor
    };
  }
  return {
    lines: lines as RebaseLine[],
    cursor: cursor as CursorState,
    otherStateVar: {
      foo: 'bar'
    },
    info: (info as string[]) || [],
    height: height
  };
}
