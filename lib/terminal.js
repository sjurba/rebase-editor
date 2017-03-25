'use strict';
const debounce = require('debounce'),
  utils = require('./utils');

function inSelection(state, idx) {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort((a, b) => a - b);
  return from <= idx && idx <= to;
}

module.exports = class Terminal {

  constructor(term, opts) {
    this.opts = Object.assign({
      status: false,
      selectMarker: '^!'
    }, opts);
    this.term = term;
    this.viewPort = [];
    this.term.fullscreen(true);
    this.term.grabInput();
    this.term.hideCursor(true);
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
    line = utils.trimTo(line, this.term.width);
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

  _wrapColors(arr, colors) {
    return arr.map((txt, idx) => {
      const color = colors[idx];
      if (color) {
        return color + txt + '^';
      } else {
        return txt;
      }
    }).join(' ');
  }

  render(state, key, rawKey) {
    const allLines = [];

    state.lines.forEach((line, idx) => {
      const selected = inSelection(state, idx);
      let termStr;
      const message = (line.message || '').replace(/\^/g, '^^');
      if (this.opts.colors && !selected) {
        termStr = this._wrapColors([line.action, line.hash, message], this.opts.colors);
      } else {
        termStr = (selected ? this.opts.selectMarker : '') + [line.action, line.hash, message].filter(line => line).join(' ');
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
    const pos = Math.max(state.cursor.pos, state.cursor.from) + (this.opts.status ? 1 : 0);
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
  }
};
