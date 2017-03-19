'use strict';
const term = require('terminal-kit').terminal;
const keyBindings = require('./key-bindings');

function init(cb) {
  term.fullscreen(true);
  term.grabInput();
  term.on('key', (key) => {
    cb(keyBindings[key], key);
  });
}

function close() {
  term.fullscreen(false);
}

function render(state, key, rawKey) {
  term.clear();
  term('Cursor: ' + state.cursor.pos + ' Key: ' + key + ' Raw key: ' + rawKey);
  let index = 2;
  state.lines.forEach((line) => {
    term.moveTo(1, index);
    term(line.action + ' ' + line.message);
    index++;
  });
  index++;
  state.info.forEach((line) => {
    term.moveTo(1, index);
    term(line);
    index++;
  });
  term.moveTo(1, state.cursor.pos + 2);
}

module.exports = {
  render: render,
  init: init,
  close: close
};
