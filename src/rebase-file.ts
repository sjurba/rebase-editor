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

const commentedActions = ['pick', 'p', 'Branch', 'Branch:'];

function splitFirstWord(text: string): [string, string] {
  const separator = /[ \t]+/.exec(text);
  return separator ? [text.slice(0, separator.index), text.slice(separator.index + separator[0].length)] : [text, ''];
}

function parseLine(line: string): RebaseLine | undefined {
  const commented = /^#[ \t]/.test(line);
  if (line.startsWith('#') && !commented) {
    return undefined;
  }
  const [command, firstRest] = splitFirstWord(commented ? line.slice(1).trimStart() : line);
  if (commented && !commentedActions.includes(command)) {
    return undefined;
  }
  let action = abbreviatedActions.get(command) ?? command;
  if (action === 'exec') {
    return { action, hash: firstRest, message: '' };
  }
  let rest = firstRest;
  const fixupFlag = /^(-[cC])[ \t]+(.*)$/.exec(rest);
  if (action === 'fixup' && fixupFlag) {
    action += ' ' + fixupFlag[1];
    rest = fixupFlag[2];
  }
  const [hash, message] = splitFirstWord(rest);
  return { action: commented ? '# ' + action : action, hash, message };
}

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
        const parsed = parseLine(line);
        if (parsed) {
          state.lines.push(parsed);
        } else {
          state.info.push(line);
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
      const parts = line.message.split('\n').filter((p) => !p.startsWith('#'));
      const firstLine = parts.find((p) => p.trim().length > 0);
      if (firstLine === undefined) {
        inRewordedBlock = false;
        return ['pick', line.hash, line.originalMessage].filter((part) => part).join(' ');
      }
      inRewordedBlock = true;
      const quoted = parts.map((p) => `'${p.replace(/'/g, "'\\''")}'`).join(' ');
      return `pick ${line.hash} # ${firstLine}\nexec git commit --amend -m "$(printf '%s\\n' ${quoted})"`;
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
