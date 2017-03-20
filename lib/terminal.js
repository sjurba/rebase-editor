'use strict';
const keyBindings = require('./key-bindings');

module.exports = class Terminal {

  constructor(term, opts) {
    this.opts = Object.assign({
      status: false
    }, opts);
    this.term = term;
    this.term.fullscreen(true);
    this.term.grabInput();
    if (this.opts.onKey) {
      this.term.on('key', (key) => {
        this.opts.onKey(keyBindings[key], key);
      });
    }
  }

  close() {
    this.term.fullscreen(false);
  }

  _writeLine(index, line) {
    this.term.moveTo(1, index);
    this.term(line);
    this.term.eraseLineAfter();
  }

  render(oldState, state, key, rawKey) {
    if (oldState === null) {
      this.term.clear();
    }
    let startIndex = 1;
    if (this.opts.status) {
      this._writeLine(1, 'Cursor: ' + state.cursor.pos + ' Key: ' + key + ' Raw key: ' + rawKey);
      startIndex++;
    }
    let index = startIndex;
    state.lines.forEach((line, idx) => {
      if (!oldState || oldState.lines[idx] !== line) {
        this._writeLine(index, [line.action, line.hash, line.message].join(' '));
      }
      index++;
    });
    index++;
    if (oldState === null) {
      state.info.forEach((line) => {
        this._writeLine(index, line);
        index++;
      });
    }
    this.term.moveTo(1, state.cursor.pos + startIndex);
  }
};
