import { RebaseState, RebaseLine, KeyBindings } from './types';

function getKeyInfo(action: string, keyBindings: KeyBindings, description: string): string {
  const keys = Object.keys(keyBindings)
    .filter((key) => keyBindings[key] === action);
  return '# ' + keys.join(', ') + ' = ' + description;
}

const actionDescriptions: Record<string, string> = {
  'up': 'Moves cursor up',
  'down': 'Moves cursor down',
  'selectDown': 'Select one line down',
  'selectUp': 'Select one line up',
  'moveDown': 'Moves current line down one position',
  'moveUp': 'Moves current line up one position',
  'undo': 'Undo',
  'redo': 'Redo',
  'quit': 'Save and quit',
  'abort': 'Abort',
  'fixup -c': 'fixup -c',
  'fixup -C': 'fixup -C'
};

function editorCommands(keyBindings: KeyBindings): string[] {
  const extraInfo = [
    '# NOTE: execute (x) is not supported by rebase editor',
    '# You cannot add update-ref (u), label (l), reset (t) or merge (m), but you can move them around',
    '# Press r twice to open an inline message editor (ENTER=new line, ESC=save).',
    '#',
    '# Rebase Editor Commands:',
  ];

  Object.keys(actionDescriptions).forEach((action) => {
    extraInfo.push(getKeyInfo(action, keyBindings,
      actionDescriptions[action]));
  });

  extraInfo.push('# HOME, END, PAGE_UP, PAGE_DOWN = Moves cursor and selects with SHIFT');

  return extraInfo;
}

function toState(data: string): RebaseState {
  const lines = data.split(/\r?\n/);
  if (!lines[0].match(/^(noop|pick|break|update-ref|label|# pick)/)) {
    throw 'Not a proper rebase file: \n' + lines.slice(0, 5).join('\n') + '\n ...';
  }
  return lines
    .reduce<RebaseState>((state, line) => {
      line = line.trim();
      if (line.length > 0) {
        let parts = line.split(' ');
        if (parts[0] === '#' && parts[1] !== 'pick' && parts[1] !== 'Branch' && parts[1] !== 'Branch:') {
          state.info.push(line);
        } else {
          if (parts[0] === '#') {
            parts = parts.slice(1);
            parts[0] = '# ' + parts[0];
          }
          state.lines.push({
            action: parts[0],
            hash: parts[1],
            message: parts.slice(2).join(' ')
          });
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
      height: 0,
      extraInfo: editorCommands
    });
}

function toFile(state: RebaseState | undefined): string {
  if (!state) {
    return '';
  }
  let convertSquash = false;
  const lines = [...state.lines].reverse().map((line: RebaseLine) => {
    if (line.action === 'reworded') {
      convertSquash = true;
      const parts = line.message.split(/\r?\n/).filter(p => p.length > 0 && !p.startsWith('#'));
      const flags = parts.map(p => `-m "${p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(' ');
      const firstLine = parts[0] ?? '';
      return `pick ${line.hash} # ${firstLine}\nexec git commit --amend ${flags}`;
    }
    if (line.action === 'squash' && convertSquash) {
      return `fixup ${line.hash} ${line.message.split('\n')[0]}`;
    }
    convertSquash = false;
    return [line.action, line.hash, line.message.split('\n')[0]].filter((part) => part).join(' ');
  }).reverse();
  return [...lines, '', ...state.info].join('\n');
}

export default { toState, toFile };
