'use strict';
const term = require('terminal-kit').terminal;
const keyBindings = require('./key-bindings');

function init(cb) {
  term.fullscreen(true);
  term.grabInput();
  term.on('key', (key) => {
    cb(keyBindings[key]);
  });
}

function close() {
  term.fullscreen(false);
}

function render(state) {
  term.clear();
  term('Cursor: ' + state.cursor.pos);
  state.lines.forEach((line, idx) => {
    term.moveTo(1, idx + 2);
    term(line.action + ' ' + line.message);
  });
  term.moveTo(1, state.cursor.pos + 2);
}

module.exports = {
  render: render,
  init: init,
  close: close
};
