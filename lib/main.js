'use strict';


module.exports = function main(terminal, reduce, state) {
  return new Promise((resolve, reject) => {
    terminal.render(state);

    terminal.addKeyListener((key, origKey) => {
      try {
        if (key === 'quit') {
          resolve(state);
        } else if (key === 'abort') {
          resolve();
        } else {
          state = reduce(state, key);
          terminal.render(state, key, origKey);
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
