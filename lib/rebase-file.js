'use strict';

// var editorCommands = keyBindings.customized ? ['# Custom keys defined in ~/.rebase-editor-keys.json'] : [
//   '# Rebase Editor Commands:',
//   'u/Ctrl-up = up, move line up',
//   'd/Ctrl-down = down, move line down',
//   'x = cut, cut line',
//   'v = paste, paste line',
//   'Enter/q = save and quit',
//   'Esc/Ctrl-c = abort'
// ];

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
        pos: 0
      }
    });
}

function toFile(state) {
  const lines = state.lines.map((line) => [line.action, line.hash, line.message].filter((line) => line).join(' '));
  return [...lines, '', ...state.info].join('\n');
}

module.exports = {
  toState: toState,
  toFile: toFile
};
