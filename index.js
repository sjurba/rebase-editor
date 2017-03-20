'use strict';


const term = require('terminal-kit').terminal,
  Terminal = require('./lib/terminal'),
  reduce = require('./lib/reducer'),
  FileHandle = require('./lib/file-handle'),
  rebaseFile = require('./lib/rebase-file'),
  keyBindings = require('./lib/key-bindings.js'),
  main = require('./lib/main');

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

file.read().then((data) => {
  return main(terminal, reduce, rebaseFile.toState(data));
}).then((state) => {
  return file.write(rebaseFile.toFile(state));
}).then(() => {
  exit();
}).catch((err) => {
  exit(err || 'Unknown error');
});

function exit(err) {
  let status = 0;
  if (err) {
    console.error(err);
    status = 1;
  }
  process.exit(status);
}
