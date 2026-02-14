#!/usr/bin/env node

'use strict';
import { terminal } from 'terminal-kit';
import FileHandle from './lib/file-handle.js';
import main from './lib/main.js';
import minimist from 'minimist';
import debugLog from './debug-log.js';

const args = minimist(process.argv, {
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
  term: terminal
};
main(progArgs, debugLog, (err) => {
  let status = 0;
  if (err) {
    console.error(err);
    status = 1;
  }
  process.exit(status);
});
