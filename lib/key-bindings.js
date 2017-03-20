'use strict';
var customCmds = {};
if (global.appconfig && global.appconfig.keys) {
  customCmds = require(global.appconfig.keys);
  customCmds.customized = true;
}

var bindings = Object.assign({
  UP: 'up',
  DOWN: 'down',
  LEFT: 'moveUp',
  CTRL_UP: 'moveUp',
  RIGHT: 'moveDown',
  CTRL_DOWN: 'moveDown',
  p: 'pick',
  r: 'reword',
  e: 'edit',
  s: 'squash',
  f: 'fixup',
  d: 'drop',
  BACKSPACE: 'drop',
  DELETE: 'drop',
  z: 'undo',
  CTRL_Z: 'undo',
  Z: 'redo',
  CTRL_SHIFT_Z: 'redo',
  q: 'quit',
  ENTER: 'quit',
  CTRL_C: 'abort',
  ESCAPE: 'abort'
}, customCmds);

module.exports = bindings;
