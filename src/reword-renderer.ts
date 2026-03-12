import { RebaseState } from './types';

export default function renderReword(state: RebaseState, termHeight: number): string[] {
  const rewordMode = state.rewordMode!;
  const line = state.lines[rewordMode.lineIndex];
  const { message, cursorPos } = rewordMode;

  const footer = `^!Editing commit message for ${line.hash} (ESC to finish):`;

  const messageLines: string[] = [];
  const msgLines = message.split('\n');
  let offset = 0;
  for (const msgLine of msgLines) {
    const lineStart = offset;
    const lineEnd = offset + msgLine.length;

    if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      // cursor is on this line
      const col = cursorPos - lineStart;
      const before = msgLine.slice(0, col);
      const cursorChar = (msgLine[col] ?? ' ');
      const after = msgLine.slice(col + 1);
      // We must use ^! and ^: to highlight the character under the cursor
      messageLines.push(before + '^!' + cursorChar + '^:' + after);
    } else {
      messageLines.push(msgLine);
    }

    offset += msgLine.length + 1; // +1 for the \n
  }

  // Fill content area, then place footer on the last line
  const contentHeight = termHeight - 1;
  const allLines: string[] = [];
  for (let i = 0; i < contentHeight; i++) {
    allLines.push(messageLines[i] ?? '');
  }
  allLines.push(footer);

  return allLines;
}
