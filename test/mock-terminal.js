'use strict';

function createMockTerminal() {

  let lines = [];
  let linePos = 0;

  function term(str) {
    if (str) {
      lines[linePos - 1] += str;
    }
    return term;
  }

  term.moveTo = (col, row) => {
    linePos = row;
  };

  term.eraseLine = () => {
    lines[linePos - 1] = '';
  };

  const controlFncs = ['fullscreen', 'grabInput', 'on', 'clear', 'hideCursor'];
  controlFncs.forEach((funcName) => {
    term[funcName] = sinon.spy();
  });

  term.getRendered = () => {
    return lines.join('\n');
  };

  term.getCursorPos = () => linePos;

  term.reset = () => {
    linePos = 0;
    lines = [];
    controlFncs.forEach((fnc) => {
      term[fnc].reset();
    });
  };

  term.height = 50;

  return term;

}

module.exports = {
  create: createMockTerminal
};
