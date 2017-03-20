'use strict';


const Terminal = require('./lib/terminal'),
  reduce = require('./lib/reducer'),
  FileHandle = require('./lib/file-handle'),
  rebaseFile = require('./lib/rebase-file'),
  keyBindings = require('./lib/key-bindings.js'),
  term = require('terminal-kit').terminal;



function state() {
  if (undoStack.length > 0) {
    return undoStack[undoStack.length - 1];
  } else {
    return null;
  }
}

function onKey(key, origKey) {
  if (key === 'quit') {
    writeAndExit(rebaseFile.toFile(state()));
  } else if (key === 'abort') {
    writeAndExit('');
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
}

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

const undoStack = [];
const redoStack = [];

const terminal = new Terminal(term, {
  onKey: onKey,
  status: args.status,
  colors: args.colors,
  keyBindings: keyBindings(args.keys)
});

file.read().then((data) => {
  const state = rebaseFile.toState(data);
  terminal.render(null, state, '', '');
  undoStack.push(state);
}).catch((err) => {
  exit(err || 'Failed to read file');
});

function exit(err) {
  let status = 0;
  terminal.close();
  if (err) {
    console.error(err);
    status = 1;
  }
  process.exit(status);
}

function writeAndExit(data) {
  file.write(data)
    .then(() => exit())
    .catch((err) => exit(err || 'Failed to write file'));
}
