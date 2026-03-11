#!/usr/bin/env node

import { terminal } from 'terminal-kit';
import FileHandle from './file-handle.js';
import main from './main.js';
import minimist from 'minimist';
import debugLog from './debug-log.js';
import { TerminalKitTerminal } from './types.js';

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

let colors: string[] | undefined;
if (args.colors === true) {
  colors = ['^r', '^y'];
} else if (args.colors) {
  colors = args.colors.split(',');
}

let marker: string | undefined = args.marker;
if (!marker && process.platform === 'win32') {
  // Windows CMD and PowerShell doesn't support ANSI Inverse.
  marker = '^Y';
}
const progArgs = {
  status: args.status,
  keys: args.keys,
  colors: colors,
  selectMarker: marker || '^!',
  alternateScreen: args['alternate-screen'],
  file: new FileHandle(file),
  term: terminal as unknown as TerminalKitTerminal
};
main(progArgs, debugLog, (err) => {
  let status = 0;
  if (err) {
    console.error(err);
    status = 1;
  }
  process.exit(status);
});
