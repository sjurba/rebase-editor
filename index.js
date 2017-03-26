#!/usr/bin/env node

'use strict';
const term = require('terminal-kit').terminal,
  FileHandle = require('./lib/file-handle'),
  main = require('./lib/main');
const args = require('minimist')(process.argv, {
  boolean: ['s', 'alternate-screen'],
  alias: {
    s: 'status',
    k: 'keys',
    c: 'colors',
    m: 'marker'
  },
  default: {
    'alternate-screen': true
  }
});

if (args._.length < 3) {
  console.error('No input file specified.');
  process.exit(1);
}

const file = args._[args._.length - 1];

let colors;
if (args.colors === true) {
  colors = ['^r', '^y'];
} else if (args.colors) {
  colors = args.colors.split(',');
}

let marker = args.marker;
if (!marker && process.platform === 'win32') {
  // Windows CMD and PowerShell dosn't support ANSI Inverse.
  marker = '^Y';
}
const progArgs = {
  status: args.status,
  keys: args.keys,
  colors: colors,
  selectMarker: marker || '^!',
  alternateScreen: args['alternate-screen'],
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
