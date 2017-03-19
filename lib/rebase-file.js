'use strict';

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

}

module.exports = {
  toState: toState,
  toFile: toFile
};
