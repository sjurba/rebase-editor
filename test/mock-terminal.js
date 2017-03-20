'use strict';

function createMockTerminal() {

  const lines = [];
  let linePos = 0;

  function term(str) {
    lines[linePos - 1] = str;
  }

  term.moveTo = (col, row) => {
    linePos = row;
  };

  ['fullscreen', 'grabInput', 'eraseLineAfter', 'on', 'clear'].forEach((funcName) => {
    term[funcName] = sinon.spy();
  });

  term.getRendered = () => {
    return lines.join('\n');
  };

  term.getCursorPos = () => linePos;

  return sinon.spy(term);

}

module.exports = {
  create: createMockTerminal
};
