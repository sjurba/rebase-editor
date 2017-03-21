'use strict';
const debounce = require('debounce');

function inSelection(state, idx) {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort();
  return from <= idx && idx <= to;
}

module.exports = class Terminal {

  constructor(term, opts) {
    this.opts = Object.assign({
      status: false
    }, opts);
    this.term = term;
    this.term.fullscreen(true);
    this.term.grabInput();
    this.term.hideCursor(true);
    this.term.on('resize', debounce(() => {
      if (this.oldState) {
        const state = this.oldState;
        this.oldState = null;
        this.render(state, 'resize', 'resize');
      }
    }));
  }

  addKeyListener(cb) {
    this.term.on('key', (key) => {
      cb(this.opts.keyBindings[key], key);
    });
  }

  close() {
    this.term.fullscreen(false);
    this.term.hideCursor(false);
  }

  _writeLine(index, selected, line) {
    if (!line) {
      line = selected;
      selected = false;
    }
    this.term.moveTo(1, index);
    this.term.eraseLine();
    if (selected) {
      this.term.inverse(true);
    }
    if (typeof line === 'function') {
      line(this.term);
    } else {
      this.term.noFormat(line);
    }
    if (selected) {
      this.term.inverse(false);
    }
  }

  render(state, key, rawKey) {
    if (!this.oldState) {
      this.term.clear();
    }
    let startIndex = 1;
    if (this.opts.status) {
      this._writeLine(1, `Cursor: ${state.cursor.pos} From: ${state.cursor.from} Key: ${key}  Raw key: ${rawKey}`);
      startIndex++;
    }
    let index = startIndex;
    state.lines.forEach((line, idx) => {
      const selected = inSelection(state, idx);
      if (!this.oldState || this.oldState.lines[idx] !== line || selected !== inSelection(this.oldState, idx)) {
        if (this.opts.colors) {
          this._writeLine(index, selected, (term) => {
            term.bold.red(line.action);
            if (line.hash) {
              term.yellow(' ' + line.hash);
            }
            if (line.message) {
              term.noFormat(' ' + line.message);
            }
          });
        } else {
          this._writeLine(index, selected, [line.action, line.hash, line.message].filter(line => line).join(' '));
        }
      }
      index++;
    });
    index++;
    if (!this.oldState) {
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
    this.oldState = state;
  }
};
