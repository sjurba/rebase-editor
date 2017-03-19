'use strict';


const renderer = require('./lib/terminal_renderer'),
  reduce = require('./lib/reducer'),
  FileHandle = require('./lib/file-handle'),
  rebaseFile = require('./lib/rebase-file');

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

function exit(err) {
  let status = 0;
  renderer.close();
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

file.read().then((data) => {
  let state = rebaseFile.toState(data);
  renderer.init((key, origKey) => {
    if (key === 'quit') {
      writeAndExit(rebaseFile.toFile(state));
    } else if (key === 'abort') {
      writeAndExit('');
    } else {
      state = reduce(state, key);
      renderer.render(state, key, origKey);
    }
  });
  renderer.render(state, '', '');
}).catch((err) => {
  exit(err || 'Failed to read file');
});
