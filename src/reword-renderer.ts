import { RebaseState } from './types';

export default function renderReword(state: RebaseState): string[] {
  const rewordMode = state.rewordMode!;
  const line = state.lines[rewordMode.lineIndex];
  const { message, cursorPos } = rewordMode;

  const allLines: string[] = [];
  allLines.push(`^!Editing commit message for ${line.hash} (ESC to finish):^`);
  allLines.push('');

  const messageLines = message.split('\n');
  let offset = 0;
  for (const msgLine of messageLines) {
    const lineStart = offset;
    const lineEnd = offset + msgLine.length;

    if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      // cursor is on this line
      const col = cursorPos - lineStart;
      const before = msgLine.slice(0, col).replace(/\^/g, '^^');
      const cursorChar = (msgLine[col] ?? ' ').replace(/\^/g, '^^');
      const after = msgLine.slice(col + 1).replace(/\^/g, '^^');
      allLines.push(before + '^!' + cursorChar + '^' + after);
    } else {
      allLines.push(msgLine.replace(/\^/g, '^^'));
    }

    offset += msgLine.length + 1; // +1 for the \n
  }

  return allLines;
}
