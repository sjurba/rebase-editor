import type { RebaseState, RebaseLine, KeyBindings } from './types.ts';

function getKeyInfo(action: string, keyBindings: KeyBindings, description: string): string {
  const keys = Object.keys(keyBindings).filter((key) => keyBindings[key] === action);
  return '# ' + keys.join(', ') + ' = ' + description;
}

const actionDescriptions: Record<string, string> = {
  up: 'Moves cursor up',
  down: 'Moves cursor down',
  selectDown: 'Select one line down',
  selectUp: 'Select one line up',
  moveDown: 'Moves current line down one position',
  moveUp: 'Moves current line up one position',
  undo: 'Undo',
  redo: 'Redo',
  quit: 'Save and quit',
  abort: 'Abort',
  'fixup -c': 'fixup -c',
  'fixup -C': 'fixup -C',
};

function editorCommands(keyBindings: KeyBindings): string[] {
  const extraInfo = [
    '# NOTE: execute (x) cannot be added or edited, but you can move it around',
    '# You cannot add update-ref (u), label (l), reset (t) or merge (m), but you can move them around',
    '# Press the reword key twice to open an inline message editor (ENTER=new line, ESC=save).',
    '#',
    '# Rebase Editor Commands:',
  ];

  Object.keys(actionDescriptions).forEach((action) => {
    extraInfo.push(getKeyInfo(action, keyBindings, actionDescriptions[action]));
  });

  extraInfo.push('# HOME, END, PAGE_UP, PAGE_DOWN = Moves cursor and selects with SHIFT');

  return extraInfo;
}

const abbreviatedActions = new Map([
  ['p', 'pick'],
  ['r', 'reword'],
  ['e', 'edit'],
  ['s', 'squash'],
  ['f', 'fixup'],
  ['x', 'exec'],
  ['b', 'break'],
  ['d', 'drop'],
  ['l', 'label'],
  ['t', 'reset'],
  ['m', 'merge'],
  ['u', 'update-ref'],
]);

function toState(data: string): RebaseState {
  const lines = data.replace(/\r/g, '').split('\n');
  if (
    !/^(?:noop|pick|reword|edit|squash|fixup|exec|break|drop|label|reset|merge|update-ref|[presfxbdltmu]|#\s+(?:pick|p))(?:\s|$)/.test(
      lines[0].trim(),
    )
  ) {
    throw new Error('Not a proper rebase file: \n' + lines.slice(0, 5).join('\n') + '\n ...');
  }
  return lines.reduce<RebaseState>(
    (state, line) => {
      line = line.trim();
      if (line.length > 0) {
        let parts = line.replace(/^(\S+)[ \t]+(\S+)(?:[ \t]+|$)/, '$1 $2 ').split(' ');
        if (
          parts[0] === '#' &&
          parts[1] !== 'pick' &&
          parts[1] !== 'p' &&
          parts[1] !== 'Branch' &&
          parts[1] !== 'Branch:'
        ) {
          state.info.push(line);
        } else {
          if (parts[0] === '#') {
            parts = parts
              .slice(1)
              .join(' ')
              .replace(/^(\S+)[ \t]+(\S+)(?:[ \t]+|$)/, '$1 $2 ')
              .split(' ');
            parts[0] = '# ' + (abbreviatedActions.get(parts[0]) ?? parts[0]);
          } else {
            parts[0] = abbreviatedActions.get(parts[0]) ?? parts[0];
            if (parts[0] === 'fixup' && (parts[1] === '-c' || parts[1] === '-C')) {
              parts[0] += ' ' + parts[1];
              parts.splice(1, 1);
              parts = [
                parts[0],
                ...parts
                  .slice(1)
                  .join(' ')
                  .replace(/^(\S+)[ \t]+/, '$1 ')
                  .split(' '),
              ];
            }
          }
          state.lines.push({
            action: parts[0],
            hash: parts[1],
            message: parts.slice(2).join(' '),
          });
        }
      }
      return state;
    },
    {
      lines: [],
      info: [],
      cursor: {
        pos: 0,
        from: 0,
      },
      height: 0,
      extraInfo: editorCommands,
    },
  );
}

function toFile(state: RebaseState | undefined): string {
  if (!state) {
    return '';
  }
  let inRewordedBlock = false;
  const lines = state.lines.map((line: RebaseLine) => {
    if (line.action === 'reworded') {
      inRewordedBlock = true;
      const parts = line.message.split('\n').filter((p) => !p.startsWith('#'));
      const quoted = parts.map((p) => `'${p.replace(/'/g, "'\\''")}'`).join(' ');
      const flags = parts.length ? `-m "$(printf '%s\\n' ${quoted})"` : '';
      const firstLine = parts.find((p) => p.length > 0) ?? '';
      return `pick ${line.hash} # ${firstLine}\nexec git commit --amend ${flags}`;
    }
    if (line.action === 'squash' && inRewordedBlock) {
      return `fixup ${line.hash} ${line.message.split('\n')[0]}`;
    }
    if (line.action !== 'squash') {
      inRewordedBlock = false;
    }
    return [line.action, line.hash, line.message.split('\n')[0]].filter((part) => part).join(' ');
  });
  return [...lines, '', ...state.info].join('\n');
}

export default { toState, toFile };
