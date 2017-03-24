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
    c: 'colors',
    m: 'marker'
  }
});

if (args._.length < 3) {
  console.error('No input file specified.');
  process.exit(1);
}

const file = args._[args._.length - 1];

let marker = args.marker;
if (!marker && process.platform === 'win32') {
  // Windows CMD and PowerShell dosn't support ANSI Inverse.
  marker = '^Y';
}
const progArgs = {
  status: args.status,
  keys: args.keys,
  colors: args.colors,
  selectMarker: marker || '^!',
  file: new FileHandle(file),
  term: term
};
main(progArgs, (err) => {
  let status = 0;
  if (err) {
    console.error(err);
    status = 1;
  }
  process.exit(status);
});
