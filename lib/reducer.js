'use strict';

const actions = ['pick', 'fixup', 'squash', 'reword', 'edit', 'drop'];
const [DOWN, UP] = [1, -1];

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

function getCursor(state, change, select) {
  return set(state.cursor, {
    cursor: {
      pos: state.cursor.pos + change,
      from: select ? state.cursor.from : state.cursor.pos + change
    }
  });
}

function removeFrom(arr, idx) {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}

function insertInto(arr, el, idx) {
  return [...arr.slice(0, idx), el, ...arr.slice(idx)];
}

function moveSelection(state, dir) {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort();
  const lines = state.lines;
  let srcIdx, dstIdx;
  if (dir === DOWN) {
    srcIdx = to + 1;
    dstIdx = from;
  } else {
    srcIdx = from - 1;
    dstIdx = to;
  }
  let el = lines[srcIdx];
  let newLines = removeFrom(lines, srcIdx);
  newLines = insertInto(newLines, el, dstIdx);
  return {
    lines: newLines,
    cursor: {
      from: state.cursor.from + dir,
      pos: state.cursor.pos + dir
    }
  };
}

function getAction(state, action) {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort();
  return {
    lines: state.lines.map((line, idx) => {
      if (from <= idx && idx <= to) {
        line = set(line, {
          action: action
        });
      }
      return line;
    })
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
  const from = cursor.from;
  const lines = state.lines;
  const oldState = state;
  if (action === 'undo') {
    state = undo(state, 'undoStack', 'redoStack');
  } else if (action === 'redo') {
    state = undo(state, 'redoStack', 'undoStack');
  } else {
    if (action === 'down') {
      if (pos !== state.lines.length - 1) {
        state = set(state, getCursor(state, DOWN));
      }
    } else if (action === 'up') {
      if (pos !== 0) {
        state = set(state, getCursor(state, UP));
      }
    } else if (action === 'selectDown') {
      if (pos !== state.lines.length - 1) {
        state = set(state, getCursor(state, DOWN, true));
      }
    } else if (action === 'selectUp') {
      if (pos !== 0) {
        state = set(state, getCursor(state, UP, true));
      }
    } else if (action === 'moveDown') {
      if (Math.max(pos, from) !== state.lines.length - 1) {
        state = set(state, moveSelection(state, DOWN));
      }
    } else if (action === 'moveUp') {
      if (Math.min(pos, from) !== 0) {
        state = set(state, moveSelection(state, UP));
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
