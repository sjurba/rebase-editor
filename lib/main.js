'use strict';
import Terminal from './terminal.js';
import reduce from './reducer.js';
import rebaseFile from './rebase-file.js';
import keyBindings from './key-bindings.js';

export default async function main(args, logger, onExit) {

  const file = args.file;

  const terminal = new Terminal(args.term, {
    status: args.status,
    colors: args.colors,
    selectMarker: args.selectMarker,
    alternateScreen: args.alternateScreen,
    keyBindings: await keyBindings(args.keys)
  });
  logger.trapConsole();

  file.read().then((data) => {
    return new Promise((resolve, reject) => {
      let state = rebaseFile.toState(data);
      terminal.render(state);
      terminal.addKeyListener((key, param) => {
        try {
          if (key === 'quit') {
            resolve(state);
          } else if (key === 'abort') {
            resolve();
          } else {
            state = reduce(state, key, param);
            terminal.render(state, key, param);
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
    logger.untrapConsole();
    if (onExit) {
      onExit(err);
    }
  }
};
