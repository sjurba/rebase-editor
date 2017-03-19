'use strict';
var customCmds = {};
if (global.appconfig && global.appconfig.keys) {
    customCmds = require(global.appconfig.keys);
    customCmds.customized = true;
}

var bindings = Object.assign({
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
