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

function writeLine(index, line) {
  term.moveTo(1, index);
  term(line);
  term.eraseLineAfter();
}

function render(oldState, state, key, rawKey) {
  if (oldState === null) {
    term.clear();
  }
  writeLine(1, 'Cursor: ' + state.cursor.pos + ' Key: ' + key + ' Raw key: ' + rawKey);
  let index = 2;
  state.lines.forEach((line, idx) => {
    if (!oldState || oldState.lines[idx] !== line) {
      writeLine(index, line.action + ' ' + line.message);
    }
    index++;
  });
  index++;
  if (oldState === null) {
    state.info.forEach((line) => {
      writeLine(index, line);
      index++;
    });
  }
  term.moveTo(1, state.cursor.pos + 2);
}

module.exports = {
  render: render,
  init: init,
  close: close
};
