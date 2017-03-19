'use strict';

function cursor(state, change) {
  return {
    lines: state.lines,
    cursor: {
      pos: state.cursor.pos + change
    }
  };
}


module.exports = function reducer(state, action) {
  if (action === 'up') {
    if (state.cursor.pos === 0) {
      return state;
    } else {
      return cursor(state, -1);
    }
  } else if (action === 'down') {
    if (state.cursor.pos === state.lines.length - 1) {
      return state;
    } else {
      return cursor(state, 1);
    }
  }
  return state;
};
