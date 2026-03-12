import { RewordModeState } from './types';

export default function renderReword(rewordState: RewordModeState, termHeight: number): string[] {
  const { message, cursorPos } = rewordState;

  const footer = `^!ENTER: new line  ESC: save`;

  const messageLines: string[] = [];
  const msgLines = message.split('\n');
  let offset = 0;
  let cursorLine = 0;
  for (let i = 0; i < msgLines.length; i++) {
    const msgLine = msgLines[i];
    const lineStart = offset;
    const lineEnd = offset + msgLine.length;

    if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      cursorLine = i;
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

  // Scroll so the cursor line is always visible
  const contentHeight = termHeight - 1;
  const scrollOffset = Math.max(0, cursorLine - contentHeight + 1);

  const allLines: string[] = [];
  for (let i = 0; i < contentHeight; i++) {
    allLines.push(messageLines[i + scrollOffset] ?? '');
  }
  allLines.push(footer);

  return allLines;
}
