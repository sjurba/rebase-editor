'use strict';


module.exports = function main(terminal, reduce, state) {
  return new Promise((resolve, reject) => {
    terminal.render(null, state);

    terminal.addKeyListener((key, origKey) => {
      try {
        if (key === 'quit') {
          resolve(state());
        } else if (key === 'abort') {
          resolve();
        } else {
          const newState = reduce(state, key);
          terminal.render(state, newState, key, origKey);
          state = newState;
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
