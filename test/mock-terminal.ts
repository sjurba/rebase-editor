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
  let eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  let mockError: Error | null;

  function term(str: string): MockTerm {
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
  }

  term.moveTo = (col: number, row: number): void => {
    if (row < 1) {
      throw new Error('Should not move to row < 1');
    }
    linePos = row;
  };

  term.eraseLine = (): void => {
    lines[linePos - 1] = '';
  };

  const controlFncs = ['fullscreen', 'grabInput', 'clear', 'hideCursor'] as const;
  controlFncs.forEach((funcName) => {
    (term as unknown as Record<string, sinon.SinonSpy>)[funcName] = sinon.spy();
  });

  term.on = (evt: string, listener: (...args: unknown[]) => void): void => {
    let listeners = eventListeners[evt];
    if (!listeners) {
      listeners = [];
      eventListeners[evt] = listeners;
    }
    listeners.push(listener);
  };

  term.emit = (evt: string, ...args: unknown[]): void => {
    const listeners = eventListeners[evt] || [];
    listeners.forEach((fnc) => fnc(...args));
  };

  term.throwOnRender = (err: Error): void => {
    mockError = err;
  };

  term.getRendered = (): string[] => {
    return lines;
  };

  term.getCursorPos = (): number => linePos;

  term.reset = (): void => {
    linePos = 0;
    lines = [];
    controlFncs.forEach((fnc) => {
      (term as unknown as Record<string, sinon.SinonSpy>)[fnc].resetHistory();
    });
  };

  term.height = 50;
  term.width = 150;

  return term as unknown as MockTerm;
}

export default { create: createMockTerminal };
