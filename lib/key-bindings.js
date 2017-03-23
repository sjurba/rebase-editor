'use strict';
const path = require('path');
module.exports = function (customKeyBindingsFile) {
  let customCmds = {};
  if (customKeyBindingsFile) {
    customCmds = require(path.resolve(customKeyBindingsFile));
  }
  return Object.assign({
    UP: 'up',
    DOWN: 'down',
    LEFT: 'moveUp',
    CTRL_UP: 'moveUp',
    RIGHT: 'moveDown',
    CTRL_DOWN: 'moveDown',
    SHIFT_UP: 'selectUp',
    SHIFT_DOWN: 'selectDown',
    SHIFT_LEFT: 'selectUp',
    SHIFT_RIGHT: 'selectDown',
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
};
