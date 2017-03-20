'use strict';


module.exports = function main(terminal, reduce, initalState) {
  return new Promise((resolve, reject) => {
    const undoStack = [];
    const redoStack = [];

    terminal.render(null, initalState);
    undoStack.push(initalState);

    function state() {
      if (undoStack.length > 0) {
        return undoStack[undoStack.length - 1];
      } else {
        return null;
      }
    }

    terminal.addKeyListener((key, origKey) => {
      try {
        if (key === 'quit') {
          resolve(state());
        } else if (key === 'abort') {
          resolve();
        } else if (key === 'undo') {
          if (undoStack.length > 1) {
            const oldState = undoStack.pop();
            const newState = state();
            terminal.render(oldState, newState, key, origKey);
            redoStack.push(oldState);
          }
        } else if (key === 'redo') {
          if (redoStack.length > 0) {
            const oldState = state();
            const newState = redoStack.pop();
            terminal.render(oldState, newState, key, origKey);
            undoStack.push(newState);
          }
        } else {
          const oldState = state();
          const newState = reduce(oldState, key);
          terminal.render(oldState, newState, key, origKey);
          undoStack.push(newState);
        }
      } catch (err) {
        reject(err);
      }

    });
  }).then((res) => {
    terminal.close();
    return res;
  }).catch((err) => {
    terminal.close();
    return Promise.reject(err);
  });
};
