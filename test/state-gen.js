'use strict';

export default function getState(lines, cursor, info) {
  let height = 20;
  if (typeof lines === 'number') {
    lines = new Array(lines || 0).fill().map((val, idx) => {
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
      height
    } = lines);
  }
  if (typeof info === 'number') {
    info = new Array(info || 0).fill().map((val, idx) => {
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
    lines: lines,
    cursor: cursor,
    otherStateVar: {
      foo: 'bar'
    },
    info: info || [],
    height: height
  };
};
