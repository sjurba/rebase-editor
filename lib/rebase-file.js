'use strict';

const editorCommands = [
  '# NOTE: x is not supported by rebase editor',
  '#',
  '# Rebase Editor Commands:',
  '# DOWN/UP = Moves cursor between lines',
  '# SHIFT_RIGHT/SHIFT_DOWN = Select one line down',
  '# SHIFT_LEFT/SHIFT_UP = Select one line up',
  '# RIGHT/CTRL_DOWN = Moves current line down one position',
  '# LEFT/CTRL_UP = Moves current line up one position',
  '# z, CTRL_Z = Undo',
  '# Z, CTRL_SHIFT_Z = Redo',
  '# ENTER, q = Save and quit',
  '# ESC, CTRL_C = Abort'
];

function toState(data) {
  let readingCommits = true;
  return data.split('\n')
    .reduce((state, line) => {
      line = line.trim();
      if (line.length === 0) {
        readingCommits = false;
      } else {
        if (readingCommits) {
          let parts = line.split(' ');
          if (parts[0] === '#') {
            parts = parts.slice(1);
            parts[0] = '# ' + parts[0];
          }
          state.lines.push({
            action: parts[0],
            hash: parts[1],
            message: parts.slice(2).join(' ')
          });
        } else {
          state.info.push(line);
        }
      }
      return state;
    }, {
      lines: [],
      info: [],
      cursor: {
        pos: 0,
        from: 0
      },
      extraInfo: editorCommands
    });
}

function toFile(state) {
  if (!state) {
    return '';
  }
  const lines = state.lines.map((line) => [line.action, line.hash, line.message].filter((line) => line).join(' '));
  return [...lines, '', ...state.info].join('\n');
}

module.exports = {
  toState: toState,
  toFile: toFile
};
