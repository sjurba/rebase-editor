'use strict';

var extend = require('node.extend');

var customCmds = {};
if (global.appconfig.keys) {
    customCmds = require(global.appconfig.keys);
    customCmds.customized = true;
}

var bindings = extend({
    UP: 'up',
    DOWN: 'down',
    u: 'moveUp',
    CTRL_UP: 'moveUp',
    d: 'moveDown',
    CTRL_DOWN: 'moveDown',
    p: 'pick',
    r: 'reword',
    e: 'edit',
    s: 'squash',
    f: 'fixup',
    x: 'cut',
    BACKSPACE: 'cut',
    v: 'paste',
    q: 'quit',
    ENTER: 'quit',
    CTRL_C: 'abort',
    ESCAPE: 'abort'
}, customCmds);

module.exports = bindings;
