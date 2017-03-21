'use strict';

function createMockTerminal() {

  const lines = [];
  let linePos = 0;

  function term(str) {
    if (str) {
      lines[linePos - 1] += str;
    }
    return term;
  }

  const styling = ['bold', 'red', 'yellow', 'underline', 'noFormat'];
  styling.forEach((funcName) => {
    term[funcName] = (str) => {
      if (typeof str === 'string') {
        term(str);
      }
      return term;
    };
    styling.forEach((prop) => {
      term[funcName][prop] = term;
    });
  });

  term.moveTo = (col, row) => {
    linePos = row;
  };

  term.eraseLine = () => {
    lines[linePos - 1] = '';
  };

  ['fullscreen', 'grabInput', 'on', 'clear'].forEach((funcName) => {
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
