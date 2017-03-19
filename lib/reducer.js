'use strict';

const actions = ['pick', 'fixup', 'squash', 'reword', 'edit'];

function set(state, prop) {
  return Object.assign({}, state, prop);
}

function setCursor(state, change) {
  return set(state, {
    cursor: getCursor(state.cursor, change)
  });
}

function getCursor(cursor, change) {
  return set(cursor, {
    pos: cursor.pos + change
  });
}

function setAction(state, action) {
  const cursor = state.cursor;
  const pos = cursor.pos;
  const lines = state.lines;
  if (action === lines[pos].action) {
    return state;
  }
  const newLine = set(lines[pos], {
    action: action
  });
  return set(state, {
    lines: [...lines.slice(0, pos), newLine, ...lines.slice(pos + 1)]
  });
}

module.exports = function reducer(state, action) {
  const cursor = state.cursor;
  const pos = cursor.pos;
  const lines = state.lines;
  if (action === 'down') {
    if (pos !== state.lines.length - 1) {
      return setCursor(state, 1);
    }
  } else if (action === 'up') {
    if (pos !== 0) {
      return setCursor(state, -1);
    }
  } else if (action === 'moveDown') {
    if (pos !== state.lines.length - 1) {
      return set(setCursor(state, 1), {
        lines: [...lines.slice(0, pos), lines[pos + 1], lines[pos], ...lines.slice(pos + 2)]
      });
    }
  } else if (action === 'moveUp') {
    if (pos !== 0) {
      return set(setCursor(state, -1), {
        lines: [...lines.slice(0, pos - 1), lines[pos], lines[pos - 1], ...lines.slice(pos + 1)]
      });
    }
  } else if (actions.includes(action)) {
    return setAction(state, action);
  } else if (action === 'delete') {
    return setAction(state, '#');
  }
  return state;
};
