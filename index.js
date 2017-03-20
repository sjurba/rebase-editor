'use strict';


const Terminal = require('./lib/terminal'),
  reduce = require('./lib/reducer'),
  FileHandle = require('./lib/file-handle'),
  rebaseFile = require('./lib/rebase-file'),
  term = require('terminal-kit').terminal;


var args = require('minimist')(process.argv, {
  boolean: ['s'],
  alias: {
    s: 'status',
    k: 'keys'
  }
});

global.appconfig = {
  color: args.color,
  status: args.status,
  keys: args.keys
};

var filename = args._[args._.length - 1];

var file = new FileHandle(filename);

let state;

function onKey(key, origKey) {
  if (key === 'quit') {
    writeAndExit(rebaseFile.toFile(state));
  } else if (key === 'abort') {
    writeAndExit('');
  } else {
    const newState = reduce(state, key);
    terminal.render(state, newState, key, origKey);
    state = newState;
  }
}

const terminal = new Terminal(term, {
  onKey: onKey,
  status: true
});

file.read().then((data) => {
  state = rebaseFile.toState(data);
  terminal.render(null, state, '', '');
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
