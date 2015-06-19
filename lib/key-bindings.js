'use strict';

var extend = require('node.extend');
var home = require('osenv').home();

var customCmds = {};
try {
    customCmds = require(home + '/.rebase-editor-keys.json');
    customCmds.customized = true;
} catch (e) {}

var bindings = extend({
    UP: 'up',
    DOWN: 'down',
    u: 'moveUp',
    d: 'moveDown',
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
