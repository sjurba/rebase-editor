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
  return data.split('\n')
    .reduce((state, line) => {
      line = line.trim();
      if (line.length > 0) {
        if (line[0] === '#') {
          state.info.push(line);
        } else {
          const parts = line.split(' ');
          state.lines.push({
            action: parts[0],
            message: parts.slice(1).join(' ')
          });
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
  return state.lines.map((line) => line.action + ' ' + line.message).join('\n');
}

module.exports = {
  toState: toState,
  toFile: toFile
};
