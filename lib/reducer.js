'use strict';

const actions = ['pick', 'fixup', 'squash', 'reword', 'edit', 'drop'];

function set(state, ...props) {
  return Object.assign({}, state, ...props);
}

function push(stack, el) {
  if (!stack) {
    stack = [];
  }
  return [...stack, el];
}

function pop(stack) {
  return stack.slice(0, stack.length - 1);
}

function getCursor(state, change) {
  return set(state.cursor, {
    cursor: {
      pos: state.cursor.pos + change
    }
  });
}

function getSwappedLines(lines, pos) {
  return {
    lines: [...lines.slice(0, pos), lines[pos + 1], lines[pos], ...lines.slice(pos + 2)]
  };
}

function getAction(state, action) {
  const pos = state.cursor.pos;
  const lines = state.lines;
  const newLine = set(lines[pos], {
    action: action
  });
  return {
    lines: [...lines.slice(0, pos), newLine, ...lines.slice(pos + 1)]
  };
}

function getUndo(state, stack) {
  const partialState = {};
  partialState[stack] = push(state[stack], {
    lines: state.lines,
    cursor: state.cursor
  });
  return partialState;
}

function popUndo(state, stackName) {
  const partialState = {};
  const stack = state[stackName];
  partialState[stackName] = pop(stack);
  return partialState;
}

function undo(state, undo, redo) {
  const undoStack = state[undo];
  const oldState = state;
  if (undoStack && undoStack.length > 0) {
    const undoState = undoStack[undoStack.length - 1];
    state = set(state, undoState, getUndo(oldState, redo), popUndo(oldState, undo));
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
        state = set(state, getCursor(state, 1));
      }
    } else if (action === 'up') {
      if (pos !== 0) {
        state = set(state, getCursor(state, -1));
      }
    } else if (action === 'moveDown') {
      if (pos !== state.lines.length - 1) {
        state = set(state, getCursor(state, 1), getSwappedLines(lines, pos));
      }
    } else if (action === 'moveUp') {
      if (pos !== 0) {
        state = set(state, getCursor(state, -1), getSwappedLines(lines, pos - 1));
      }
    } else if (actions.includes(action)) {
      const currentLine = lines[pos];
      if (action !== currentLine.action && currentLine.hash) {
        state = set(state, getAction(state, action));
      }
    }
    if (oldState !== state && oldState.lines !== state.lines) {
      state = set(state, getUndo(oldState, 'undoStack'), {
        redoStack: []
      });
    }
  }
  return state;
};
