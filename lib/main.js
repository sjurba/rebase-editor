'use strict';
const Terminal = require('./terminal'),
  reduce = require('./reducer'),
  rebaseFile = require('./rebase-file'),
  keyBindings = require('./key-bindings.js'),
  debugLog = require('./debug-log');

module.exports = function (args, exit) {

  const file = args.file;

  const terminal = new Terminal(args.term, {
    status: args.status,
    colors: args.colors,
    selectMarker: args.selectMarker,
    keyBindings: keyBindings(args.keys)
  });
  debugLog.trapConsole();

  file.read().then((data) => {
    return new Promise((resolve, reject) => {
      let state = rebaseFile.toState(data);
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
    });
  }).then((state) => {
    return file.write(rebaseFile.toFile(state));
  }).then(() => {
    closeAndExit();
  }).catch((err) => {
    closeAndExit(err);
  });

  function closeAndExit(err) {
    terminal.close();
    debugLog.untrapConsole();
    if (exit) {
      exit(err);
    }
  }
};
