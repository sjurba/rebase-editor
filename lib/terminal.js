'use strict';
const debounce = require('debounce');

function inSelection(state, idx) {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort((a, b) => a - b);
  return from <= idx && idx <= to;
}

function getOffset(pos, height) {
  if (pos >= height) {
    return (pos + 1) - height;
  } else {
    return 0;
  }
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
    this.lastOffset = 0;
    this.term.on('resize', debounce(() => {
      this.term.clear();
      const offset = getOffset(this.pos, this.term.height);
      this.currentLines.some((line, index) => {
        if (index > offset) {
          this.term.moveTo(1, index - offset);
          this.term(line);
        }
        if (index - offset >= this.term.height) {
          return true;
        }
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
    const offset = this.offset;
    if (index > offset && this.currentLines[index - this.lastOffset] !== line && index - offset <= this.term.height) {
      this.term.moveTo(1, index - offset);
      this.term.eraseLine();
      this.term(line);
    }
    this.currentLines[index] = line;
    this.writeIndex++;
  }

  render(state, key, rawKey) {
    this.writeIndex = 1;
    this.pos = state.cursor.pos;
    this.offset = getOffset(state.cursor.pos, this.term.height);

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
    this.lastOffset = this.offset;
  }
};
