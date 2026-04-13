import debounce from './debounce';
import utils from './utils';
import { RebaseState, TerminalKitTerminal, TerminalOpts, KeyBindings } from './types';
import renderRebase from './rebase-renderer';
import renderReword from './reword-renderer';

function getBlankLines(n: number): string {
  return new Array(n + 1).join('\n');
}

export default class Terminal {
  opts: Required<Pick<TerminalOpts, 'status' | 'selectMarker' | 'alternateScreen'>> & TerminalOpts;
  term: TerminalKitTerminal;
  viewPort: string[];

  constructor(term: TerminalKitTerminal, opts?: TerminalOpts) {
    this.opts = Object.assign(
      {
        status: false,
        selectMarker: '^!',
        alternateScreen: true,
      },
      opts,
    );
    this.term = term;
    this.viewPort = [];
    if (this.opts.alternateScreen) {
      this.term.fullscreen(true);
    } else {
      this.term(getBlankLines(this.term.height - 1));
    }
    this.term.hideCursor(true);
  }

  addKeyListener(cb: (key: string, param: string | number) => void): void {
    this.term.grabInput();
    this.term.on('key', (key: unknown) => {
      cb(this.opts.keyBindings[key as string], key as string);
    });
    let oldHeight = this.term.height;
    this.term.on(
      'resize',
      debounce(() => {
        this.viewPort = [];
        const height = this.term.height;
        if (height > oldHeight) {
          this.term.moveTo(1, height);
          this.term(getBlankLines(height - oldHeight));
          oldHeight = height;
        }
        cb('resize', this.term.height);
      }, 100),
    );
    cb('resize', this.term.height);
  }

  close(): void {
    if (this.opts.alternateScreen) {
      this.term.fullscreen(false);
    } else {
      this.term.moveTo(1, this.viewPort.length + 1);
      this.term.eraseLine();
    }
    this.term.hideCursor(false);
  }

  _writeLine(line: string, index: number): void {
    line = utils.trimTo(line, this.term.width);
    if (line !== this.viewPort[index]) {
      this._moveTo(index);
      this.term.eraseLine();
      this.term(line);
    }
    this.viewPort[index] = line;
  }

  _moveTo(line: number): void {
    this.term.moveTo(1, line + 1);
  }

  render(state: RebaseState, key?: string, rawKey?: string): void {
    const allLines = state.rewordState
      ? renderReword(state.rewordState, this.term.height)
      : renderRebase(state, this.opts);

    let offset = 0;
    if (!state.rewordState) {
      const pos = Math.max(state.cursor.pos, state.cursor.from) + (this.opts.status ? 1 : 0);
      if (pos >= this.term.height) {
        offset = pos - this.term.height + 1;
      }
    }
    if (this.opts.status) {
      const statusLine = `^+^_Cursor: ${state.cursor.pos} From: ${state.cursor.from} Key: ${key ?? ''}  Raw key: ${rawKey ?? ''} Height: ${this.term.height}`;
      allLines.splice(offset, 0, statusLine);
    }
    allLines.slice(offset, this.term.height + offset).forEach((line, index) => {
      this._writeLine(line, index);
    });
    const renderedCount = Math.min(allLines.length - offset, this.term.height);
    const clearTo = key === 'resize' ? this.term.height : this.viewPort.length;
    for (let i = renderedCount; i < clearTo; i++) {
      this._moveTo(i);
      this.term.eraseLine();
    }
    this.viewPort = this.viewPort.slice(0, renderedCount);
  }
}
