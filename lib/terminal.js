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
    this.term.eraseLine();
    if (typeof line === 'function') {
      line(this.term);
    } else {
      this.term.noFormat(line);
    }
  }

  render(oldState, state, key, rawKey) {
    if (!oldState) {
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
        if (this.opts.colors) {
          this._writeLine(index, (term) => {
            term.bold.red(line.action);
            if (line.hash) {
              term.yellow(' ' + line.hash);
            }
            if (line.message) {
              term.noFormat(' ' + line.message);
            }
          });
        } else {
          this._writeLine(index, [line.action, line.hash, line.message].filter(line => line).join(' '));
        }
      }
      index++;
    });
    index++;
    if (!oldState) {
      let emptyLines = 0;
      state.info.forEach((line) => {
        if (line === '#' && state.extraInfo) {
          emptyLines++;
          if (emptyLines === 2) {
            state.extraInfo.forEach((line) => {
              this._writeLine(index, line);
              index++;
            });
          }
        }
        this._writeLine(index, line);
        index++;
      });
    }
    this.term.moveTo(1, state.cursor.pos + startIndex);
  }
};
