import { RewordModeState } from './types';

export default function renderReword(rewordState: RewordModeState, termHeight: number): string[] {
  const { message, cursorPos, selectAnchor } = rewordState;
  const hasSelection = selectAnchor !== undefined;
  const selStart = hasSelection ? Math.min(selectAnchor, cursorPos) : 0;
  const selEnd = hasSelection ? Math.max(selectAnchor, cursorPos) : 0;

  const footer = `^!ENTER: new line  ESC: save  CTRL+A: select all  SHIFT+↑↓←→: select  CTRL+K: del line  CTRL+Z: restore  CTRL+C: cancel`;

  const messageLines: string[] = [];
  const msgLines = message.split('\n');
  let offset = 0;
  let cursorLine = 0;
  for (let i = 0; i < msgLines.length; i++) {
    const msgLine = msgLines[i];
    const lineStart = offset;
    const lineEnd = offset + msgLine.length;

    if (hasSelection) {
      if (cursorPos >= lineStart && cursorPos <= lineEnd) { cursorLine = i; }
      // Highlight selection range
      const lineSelStart = Math.max(selStart, lineStart) - lineStart;
      const lineSelEnd = Math.min(selEnd, lineEnd) - lineStart;
      if (lineSelStart < lineSelEnd) {
        const before = msgLine.slice(0, lineSelStart);
        const selected = msgLine.slice(lineSelStart, lineSelEnd);
        const after = msgLine.slice(lineSelEnd);
        messageLines.push(before + '^!' + selected + '^:' + after);
      } else {
        messageLines.push(msgLine);
      }
    } else if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      cursorLine = i;
      const col = cursorPos - lineStart;
      const before = msgLine.slice(0, col);
      const cursorChar = (msgLine[col] ?? ' ');
      const after = msgLine.slice(col + 1);
      messageLines.push(before + '^!' + cursorChar + '^:' + after);
    } else {
      messageLines.push(msgLine);
    }

    offset += msgLine.length + 1; // +1 for the \n
  }

  // Scroll so the cursor stays at least 2 lines from the bottom
  const contentHeight = termHeight - 1;
  const scrollOffset = Math.max(0, cursorLine - contentHeight + 3);

  const allLines: string[] = [];
  for (let i = 0; i < contentHeight; i++) {
    allLines.push(messageLines[i + scrollOffset] ?? '');
  }
  allLines.push(footer);

  return allLines;
}
