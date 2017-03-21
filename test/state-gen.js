'use strict';

module.exports = function getState(lines, cursor, info) {
  if (typeof lines === 'number') {
    lines = new Array(lines || 0).fill().map((val, idx) => {
      return {
        action: 'pick',
        hash: '123',
        message: 'Line ' + idx
      };
    });
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
    info: info || []
  };
};
