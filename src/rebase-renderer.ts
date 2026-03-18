import { RebaseState, TerminalOpts, KeyBindings } from './types';

function inSelection(state: RebaseState, idx: number): boolean {
  const [from, to] = [state.cursor.from, state.cursor.pos].sort((a, b) => a - b);
  return from <= idx && idx <= to;
}

function wrapColors(arr: string[], colors: string[]): string {
  return arr.map((txt, idx) => {
    const color = colors[idx];
    if (color) {
      return color + txt + '^';
    } else {
      return txt;
    }
  }).join(' ');
}

export default function renderRebase(
  state: RebaseState,
  opts: Required<Pick<TerminalOpts, 'status' | 'selectMarker'>> & TerminalOpts
): string[] {
  const allLines: string[] = [];

  state.lines.forEach((line, idx) => {
    const selected = inSelection(state, idx);
    let termStr: string;
    const firstLine = line.action === 'reworded'
      ? '# ' + (line.message.split('\n').find(l => l.length > 0 && !l.startsWith('#')) ?? '')
      : (line.message || '').split('\n')[0];
    const message = firstLine.replace(/\^/g, '^^');
    if (opts.colors && !selected) {
      termStr = wrapColors([line.action, line.hash, message], opts.colors);
    } else {
      termStr = (selected ? opts.selectMarker : '') + [line.action, line.hash, message].filter(part => part).join(' ');
    }
    allLines.push(termStr);
  });
  allLines.push('');

  let emptyLines = 0;
  let extraInfo = state.extraInfo && state.extraInfo(opts.keyBindings as KeyBindings);
  state.info.forEach((line) => {
    if (line === '#' && extraInfo) {
      emptyLines++;
      if (emptyLines === 2) {
        extraInfo.forEach((infoLine) => {
          allLines.push(infoLine);
        });
      }
    }
    allLines.push(line);
  });

  return allLines;
}
