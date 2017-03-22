#!/usr/bin/env node

'use strict';
const term = require('terminal-kit').terminal,
  Terminal = require('./lib/terminal'),
  reduce = require('./lib/reducer'),
  FileHandle = require('./lib/file-handle'),
  rebaseFile = require('./lib/rebase-file'),
  keyBindings = require('./lib/key-bindings.js'),
  debugLog = require('./lib/debug-log');

const args = require('minimist')(process.argv, {
  boolean: ['s', 'c'],
  alias: {
    s: 'status',
    k: 'keys',
    c: 'colors'
  }
});

var filename = args._[args._.length - 1];
var file = new FileHandle(filename);

const terminal = new Terminal(term, {
  status: args.status,
  colors: args.colors,
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
  exit();
}).catch((err) => {
  exit(err || 'Unknown error');
});

function exit(err) {
  terminal.close();
  debugLog.untrapConsole();
  let status = 0;
  if (err) {
    console.error(err);
    status = 1;
  }
  process.exit(status);
}
