import { RewordModeState } from './types';

export default function renderReword(rewordState: RewordModeState, termHeight: number): string[] {
  const { message, cursorPos, selectAnchor } = rewordState;
  const hasSelection = selectAnchor !== undefined;
  const selStart = hasSelection ? Math.min(selectAnchor, cursorPos) : 0;
  const selEnd = hasSelection ? Math.max(selectAnchor, cursorPos) : 0;

  const footer = `^!ENTER: new line  ESC: save  CTRL+A: select all  SHIFT+↑↓←→: select  CTRL+K: del line  CTRL+Z: restore  CTRL+C: cancel`;

  const esc = (s: string) => s.replace(/\^/g, '^^');
  const highlight = (line: string, start: number, end: number) =>
    esc(line.slice(0, start)) + '^!' + (esc(line.slice(start, end)) || ' ') + '^:' + esc(line.slice(end));

  const messageLines: string[] = [];
  const msgLines = message.split('\n');
  let offset = 0;
  let cursorLine = 0;
  for (let i = 0; i < msgLines.length; i++) {
    const msgLine = msgLines[i];
    const lineStart = offset;
    const lineEnd = offset + msgLine.length;

    if (hasSelection) {
      if (cursorPos >= lineStart && cursorPos <= lineEnd) {
        cursorLine = i;
      }
      // Highlight selection range
      const lineSelStart = Math.max(selStart, lineStart) - lineStart;
      const lineSelEnd = Math.min(selEnd, lineEnd) - lineStart;
      if (lineSelStart < lineSelEnd) {
        messageLines.push(highlight(msgLine, lineSelStart, lineSelEnd));
      } else if (msgLine.length === 0 && lineStart >= selStart && lineStart < selEnd) {
        // Empty line within selection: show a highlighted space as visual indicator
        messageLines.push('^! ^:');
      } else {
        messageLines.push(esc(msgLine));
      }
    } else if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      cursorLine = i;
      const col = cursorPos - lineStart;
      messageLines.push(highlight(msgLine, col, col + 1));
    } else {
      messageLines.push(esc(msgLine));
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
