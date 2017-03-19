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

file.read().then((data) => {
  let state = rebaseFile.toState(data);
  renderer.init((key, origKey) => {
    if (key === 'quit' || key === 'abort') {
      renderer.close();
      process.exit(0);
    } else {
      state = reduce(state, key);
      renderer.render(state, key, origKey);
    }
  });
  renderer.render(state, '', '');
}).catch((err) => {
  renderer.close();
  process.exit(1);
});
