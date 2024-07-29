'use strict';

const actions = ['pick', 'fixup', 'fixup -c', 'fixup -C', 'squash', 'reword', 'edit', 'drop'];
const [DOWN, UP] = [1, -1];

function deepFreeze(obj) {
  var propNames = Object.getOwnPropertyNames(obj);
  propNames.forEach(function (name) {
    var prop = obj[name];
    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}

function cursor(from, pos) {
  return {
    cursor: {
      from: from,
      pos: pos
    }
  }
}

function set(state, ...props) {
  return Object.assign({}, state, ...props);
}

function insertAfterCurrentPosition(state, action, hash='', message='') {
  let newLines = state.lines;
  let line = { action: action, hash: hash, message: message };
  newLines = insertInto(newLines, line, state.cursor.pos + 1);
  return {
    lines: newLines,
    ...cursor(state.cursor.pos + 1, state.cursor.pos + 1)
  };
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

function removeFrom(arr, idx) {
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}

function insertInto(arr, el, idx) {
  return [...arr.slice(0, idx), el, ...arr.slice(idx)];
}

function getSelection(state) {
  return [state.cursor.from, state.cursor.pos].sort((a, b) => a - b);
}

function moveSelection(state, dir) {
  const [from, to] = getSelection(state);
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
    ...cursor(state.cursor.from + dir, state.cursor.pos + dir)
  };
}

function getAction(state, action) {
  const [from, to] = getSelection(state);
  return {
    lines: state.lines.map((line, idx) => {
      if (from <= idx && idx <= to && line.hash && line.action !== 'update-ref') {
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

function limitCursor(state, pos, from) {
  const max = state.lines.length - 1;
  return cursor(
    from < 0 ? 0 : from > max ? max : from,
    pos < 0 ? 0 : pos > max ? max : pos
  )
}

function isSelectionSame(a, b) {
  return (a.pos === b.pos && a.from === b.from) ||
    (a.pos === b.from && a.from === b.pos);
}

function updateCursor(state, pos, from) {
  const cursor = limitCursor(state, pos, from);
  if (isSelectionSame(state.cursor, cursor.cursor)) {
    return state;
  } else {
    return set(state, {
      ...cursor
    });
  }
}

function getLineAction(state, pos = state.cursor.pos) {
  return state.lines[pos]?.action
}

module.exports = function reducer(state, action, param) {
  const pos = state.cursor.pos;
  const from = state.cursor.from;
  const end = state.lines.length - 1;
  const oldState = state;
  if (action === 'undo') {
    state = undo(state, 'undoStack', 'redoStack');
  } else if (action === 'redo') {
    state = undo(state, 'redoStack', 'undoStack');
  } else {
    if (action === 'down') {
      state = updateCursor(state, pos + 1, pos + 1);
    } else if (action === 'up') {
      state = updateCursor(state, pos - 1, pos - 1);
    } else if (action === 'end') {
      state = updateCursor(state, end, end);
    } else if (action === 'home') {
      state = updateCursor(state, 0, 0);
    } else if (action === 'pageDown') {
      const newPos = pos + state.height;
      state = updateCursor(state, newPos, newPos);
    } else if (action === 'pageUp') {
      const newPos = pos - state.height;
      state = updateCursor(state, newPos, newPos);
    } else if (action === 'selectDown') {
      state = updateCursor(state, pos + 1, from);
    } else if (action === 'selectUp') {
      state = updateCursor(state, pos - 1, from);
    } else if (action === 'selectPageDown') {
      const newPos = pos + state.height;
      state = updateCursor(state, newPos, from);
    } else if (action === 'selectPageUp') {
      const newPos = pos - state.height;
      state = updateCursor(state, newPos, from);
    } else if (action === 'selectHome') {
      state = updateCursor(state, 0, from);
    } else if (action === 'selectEnd') {
      state = updateCursor(state, end, from);
    } else if (action === 'moveDown') {
      if (Math.max(pos, from) !== state.lines.length - 1) {
        state = set(state, moveSelection(state, DOWN));
      }
    } else if (action === 'moveUp') {
      if (Math.min(pos, from) !== 0) {
        state = set(state, moveSelection(state, UP));
      }
    } else if (action === 'resize') {
      state = set(state, {
        height: param
      });
    } else if (actions.includes(action)) {
      const [from, to] = getSelection(state);
      let newState = state;
      if (state.lines.slice(from, to + 1).some((line) => line.action !== action && line.hash)) {
        newState = getAction(state, action);
      }
      const lineTypesToBeRemovedOnDrop = ['break', 'update-ref']
      if (action === 'drop' && state.lines.slice(from, to + 1).some(line=>lineTypesToBeRemovedOnDrop.includes(line.action))) {
        const newLines = newState.lines.filter((line, idx)=> idx < from || idx > to || !lineTypesToBeRemovedOnDrop.includes(line.action));
        const removedLines = newState.lines.length - newLines.length;
        newState = {
          lines: newLines,
          ...cursor(
            state.cursor.from < state.cursor.pos ? state.cursor.from : state.cursor.from - removedLines,
            state.cursor.pos < state.cursor.from ? state.cursor.pos : state.cursor.pos - removedLines,
          )
        }
      }
      if (newState !== state) {
        state = set(state, newState)
      }
    } else if (action === 'break') {
      if (getLineAction(state) !== 'break' && getLineAction(state, state.cursor.pos + 1) !== 'break') {
        state = set(state, insertAfterCurrentPosition(state, 'break'));
      } else if (getLineAction(state, state.cursor.pos + 1) === 'break') {
        state = set(state, {
          ...cursor(pos + 1, pos + 1)
        })
      }
    }

    if (oldState !== state && oldState.lines !== state.lines) {
      state = set(state, getUndo(oldState, 'undoStack'), {
        redoStack: []
      });
    }
  }
  return deepFreeze(state);
};
