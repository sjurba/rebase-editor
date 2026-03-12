import { RebaseState } from './types';

export default function renderReword(state: RebaseState): string[] {
  const rewordMode = state.rewordMode!;
  const line = state.lines[rewordMode.lineIndex];
  const { message, cursorPos } = rewordMode;

  const allLines: string[] = [];
  allLines.push(`^!Editing commit message for ${line.hash} (ESC to finish):`);
  allLines.push('');

  const messageLines = message.split('\n');
  let offset = 0;
  for (const msgLine of messageLines) {
    const lineStart = offset;
    const lineEnd = offset + msgLine.length;

    if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      // cursor is on this line
      const col = cursorPos - lineStart;
      const before = msgLine.slice(0, col)
      const cursorChar = (msgLine[col] ?? ' ')
      const after = msgLine.slice(col + 1)
      allLines.push(before + '^!' + cursorChar + '^' + after);
    } else {
      allLines.push(msgLine);
    }

    offset += msgLine.length + 1; // +1 for the \n
  }

  return allLines;
}
