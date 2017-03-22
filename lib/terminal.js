'use strict';
const debounce = require('debounce');

function inSelection(state, idx) {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort((a, b) => a - b);
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
    this.viewPort = [];
    this.lastOffset = 0;
  }

  addKeyListener(cb) {
    this.term.on('key', (key) => {
      cb(this.opts.keyBindings[key], key);
    });
    this.term.on('resize', debounce(() => {
      this.viewPort = [];
      cb('resize', 'resize');
    }));
  }

  close() {
    this.term.fullscreen(false);
    this.term.hideCursor(false);
  }

  _writeLine(line, index) {
    if (line !== this.viewPort[index]) {
      this._moveTo(index);
      this.term.eraseLine();
      this.term(line);
    }
    this.viewPort[index] = line;
  }

  _moveTo(line) {
    this.term.moveTo(1, line + 1);
  }

  render(state, key, rawKey) {
    const allLines = [];

    state.lines.forEach((line, idx) => {
      const selected = inSelection(state, idx);
      let termStr;
      if (this.opts.colors && !selected) {
        termStr = `^r${line.action} ^y${line.hash || ''}^ ${line.message || ''}`;
      } else {
        termStr = (selected ? '^!' : '') + [line.action, line.hash, line.message].filter(line => line).join(' ');
      }
      allLines.push(termStr);
    });
    allLines.push('');
    let emptyLines = 0;
    state.info.forEach((line) => {
      if (line === '#' && state.extraInfo) {
        emptyLines++;
        if (emptyLines === 2) {
          state.extraInfo.forEach((line) => {
            allLines.push(line);
          });
        }
      }
      allLines.push(line);
    });
    let offset = 0;
    const pos = state.cursor.pos + (this.opts.status ? 1 : 0);
    if (pos >= this.term.height) {
      offset = pos - this.term.height + 1;
    }
    if (this.opts.status) {
      const statusLine = `^+^_Cursor: ${state.cursor.pos} From: ${state.cursor.from} Key: ${key}  Raw key: ${rawKey} Height: ${this.term.height}`;
      allLines.splice(offset, 0, statusLine);
    }
    allLines.slice(offset, this.term.height + offset).forEach((line, index) => {
      this._writeLine(line, index);
    });
    this._moveTo(pos);
  }
};
