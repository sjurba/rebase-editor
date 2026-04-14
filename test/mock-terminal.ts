import sinon from 'sinon';

export interface MockTerm {
  (str: string): MockTerm;
  moveTo: (col: number, row: number) => void;
  eraseLine: () => void;
  fullscreen: sinon.SinonSpy;
  grabInput: sinon.SinonSpy;
  clear: sinon.SinonSpy;
  hideCursor: sinon.SinonSpy;
  on: (evt: string, listener: (...args: unknown[]) => void) => void;
  emit: (evt: string, ...args: unknown[]) => void;
  throwOnRender: (err: Error) => void;
  getRendered: () => string[];
  getCursorPos: () => number;
  reset: () => void;
  height: number;
  width: number;
  initialScroll?: number;
}

function createMockTerminal(): MockTerm {
  let lines: string[] = [];
  let linePos: number;
  const eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  let mockError: Error | null;

  let term: MockTerm;

  const base = (str: string): MockTerm => {
    if (linePos === undefined && term.initialScroll === undefined) {
      term.initialScroll = str.split('\n').length;
    }
    if (linePos < 1) {
      throw new Error('Should not write to pos < 1');
    }
    if (mockError) {
      throw mockError;
    }
    lines[linePos - 1] = (lines[linePos - 1] || '') + str;
    return term;
  };

  const controlFncs = ['fullscreen', 'grabInput', 'clear', 'hideCursor'] as const;

  term = Object.assign(base, {
    moveTo: (col: number, row: number): void => {
      if (row < 1) {
        throw new Error('Should not move to row < 1');
      }
      linePos = row;
    },
    eraseLine: (): void => {
      lines[linePos - 1] = '';
    },
    fullscreen: sinon.spy(),
    grabInput: sinon.spy(),
    clear: sinon.spy(),
    hideCursor: sinon.spy(),
    on: (evt: string, listener: (...args: unknown[]) => void): void => {
      let listeners = eventListeners[evt];
      if (!listeners) {
        listeners = [];
        eventListeners[evt] = listeners;
      }
      listeners.push(listener);
    },
    emit: (evt: string, ...args: unknown[]): void => {
      const listeners = eventListeners[evt] || [];
      listeners.forEach((fnc) => {
        fnc(...args);
      });
    },
    throwOnRender: (err: Error): void => {
      mockError = err;
    },
    getRendered: (): string[] => lines,
    getCursorPos: (): number => linePos,
    reset: (): void => {
      linePos = 0;
      lines = [];
      controlFncs.forEach((fnc) => {
        term[fnc].resetHistory();
      });
    },
    height: 50,
    width: 150,
  }) as unknown as MockTerm;

  return term;
}

export default { create: createMockTerminal };
