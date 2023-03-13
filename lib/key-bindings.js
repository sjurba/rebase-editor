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
    END: 'end',
    HOME: 'home',
    PAGE_DOWN: 'pageDown',
    PAGE_UP: 'pageUp',
    SHIFT_UP: 'selectUp',
    SHIFT_DOWN: 'selectDown',
    SHIFT_LEFT: 'selectUp',
    SHIFT_RIGHT: 'selectDown',
    SHIFT_PAGE_DOWN: 'selectPageDown',
    SHIFT_PAGE_UP: 'selectPageUp',
    SHIFT_HOME: 'selectHome',
    SHIFT_END: 'selectEnd',
    p: 'pick',
    r: 'reword',
    e: 'edit',
    s: 'squash',
    f: 'fixup',
    ALT_F: 'fixup -c',
    CTRL_F: 'fixup -C',
    b: 'break',
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
