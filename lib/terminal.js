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
    this.currentLines = [];
    this.term.on('resize', debounce(() => {
      this.term.clear();
      this.currentLines.some((line, index) => {
        this.term.moveTo(1, index);
        this.term(line);
      });
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

  _writeLine(line) {
    const index = this.writeIndex;
    if (this.currentLines[index] !== line && index <= this.term.height) {
      this.term.moveTo(1, index);
      this.term.eraseLine();
      this.term(line);
    }
    this.currentLines[index] = line;
    this.writeIndex++;
  }

  render(state, key, rawKey) {
    this.writeIndex = 1;
    if (this.opts.status) {
      this._writeLine(`Cursor: ${state.cursor.pos} From: ${state.cursor.from} Key: ${key}  Raw key: ${rawKey}`);
    }
    state.lines.forEach((line, idx) => {
      const selected = inSelection(state, idx);
      let termStr;
      if (this.opts.colors && !selected) {
        termStr = `^r${line.action} ^y${line.hash || ''}^ ${line.message || ''}`;
      } else {
        termStr = (selected ? '^!' : '') + [line.action, line.hash, line.message].filter(line => line).join(' ');
      }
      this._writeLine(termStr);
    });
    this._writeLine('');
    let emptyLines = 0;
    state.info.forEach((line) => {
      if (line === '#' && state.extraInfo) {
        emptyLines++;
        if (emptyLines === 2) {
          state.extraInfo.forEach((line) => {
            this._writeLine(line);
          });
        }
      }
      this._writeLine(line);
    });
    this.term.moveTo(1, state.cursor.pos + (this.opts.status ? 2 : 1));
  }
};
