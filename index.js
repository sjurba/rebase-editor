#!/usr/bin/env node

'use strict';
const term = require('terminal-kit').terminal,
  FileHandle = require('./lib/file-handle'),
  main = require('./lib/main');

const args = require('minimist')(process.argv, {
  boolean: ['s', 'c'],
  alias: {
    s: 'status',
    k: 'keys',
    c: 'colors'
  }
});

const progArgs = {
  status: args.status,
  keys: args.keys,
  colors: args.colors,
  file: new FileHandle(args._[args._.length - 1]),
  term: term
};

main(progArgs, process.exit);
