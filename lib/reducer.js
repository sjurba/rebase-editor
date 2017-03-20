'use strict';

const actions = ['pick', 'fixup', 'squash', 'reword', 'edit', 'drop'];

function set(state, ...prop) {
  return Object.assign({}, state, ...prop);
}

function add(arr, el) {
  if (!arr) {
    arr = [];
  }
  return [...arr, el];
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
  const currentLine = lines[pos];
  if (action === currentLine.action || !currentLine.hash) {
    return state;
  }
  const newLine = set(currentLine, {
    action: action
  });
  return set(state, {
    lines: [...lines.slice(0, pos), newLine, ...lines.slice(pos + 1)]
  });
}

function swapLines(lines, pos) {
  return [...lines.slice(0, pos), lines[pos + 1], lines[pos], ...lines.slice(pos + 2)];
}

function undo(state, undo, redo) {
  const undoStack = state[undo];
  const redoStack = state[redo];
  const oldState = state;
  if (undoStack && undoStack.length > 0) {
    const undoState = undoStack[undoStack.length - 1];
    state = set(state, undoState);
    state[undo] = undoStack.slice(0, undoStack.length - 1);
    state[redo] = add(redoStack, {
      lines: oldState.lines,
      cursor: oldState.cursor
    });
  }
  return state;
}

module.exports = function reducer(state, action) {
  const cursor = state.cursor;
  const pos = cursor.pos;
  const lines = state.lines;
  const oldState = state;
  if (action === 'undo') {
    state = undo(state, 'undoStack', 'redoStack');
  } else if (action === 'redo') {
    state = undo(state, 'redoStack', 'undoStack');
  } else {
    if (action === 'down') {
      if (pos !== state.lines.length - 1) {
        state = setCursor(state, 1);
      }
    } else if (action === 'up') {
      if (pos !== 0) {
        state = setCursor(state, -1);
      }
    } else if (action === 'moveDown') {
      if (pos !== state.lines.length - 1) {
        state = set(setCursor(state, 1), {
          lines: swapLines(lines, pos)
        });
      }
    } else if (action === 'moveUp') {
      if (pos !== 0) {
        state = set(setCursor(state, -1), {
          lines: swapLines(lines, pos - 1)
        });
      }
    } else if (actions.includes(action)) {
      state = setAction(state, action);
    }
    if (oldState !== state && oldState.lines !== state.lines) {
      state = set(state, {
        undoStack: add(state.undoStack, {
          lines: oldState.lines,
          cursor: oldState.cursor
        }),
        redoStack: []
      });
    }
  }
  return state;
};
