import Terminal from '../src/terminal';
import mockTerminal from './mock-terminal';
import getState from './state-gen';
import sinon from 'sinon';
import { expect } from 'chai';
import { RebaseLine, TerminalKitTerminal, RebaseState } from '../src/types';
import { MockTerm } from './mock-terminal';

const noopLines: RebaseLine[] = [{
  action: 'noop',
  hash: '',
  message: ''
}];

const colors = ['^r', '^y'];

describe('Terminal renderer', function () {
  let mockTerm: MockTerm;

  beforeEach(function () {
    mockTerm = mockTerminal.create();
  });

  describe('on construct', function () {

    describe('when alternate screen enabled', function () {
      it('should call fullscreen', function () {
        new Terminal(mockTerm as unknown as TerminalKitTerminal);
        expect(mockTerm.fullscreen).to.be.calledWith(true);
      });

      it('should hide cursor', function () {
        new Terminal(mockTerm as unknown as TerminalKitTerminal);
        expect(mockTerm.hideCursor).to.be.calledWith(true);
      });

    });

    describe('when alternate screen disabled', function () {

      it('should not call fullscreen', function () {
        new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          alternateScreen: false
        });
        expect(mockTerm.fullscreen).to.not.be.called;
      });

      it('should scroll to top', function () {
        mockTerm.height = 10;
        new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          alternateScreen: false
        });
        expect(mockTerm.initialScroll).to.equal(10);
      });
    });
  });

  describe('render', function () {

    function trim(str: string): string {
      return str.trim().split('\n').map((line) => line.trimStart()).join('\n');
    }

    function expectRendered(str: string | string[], from?: number, to?: number): void {
      let lines = mockTerm.getRendered();
      if (from || to) {
        lines = lines.slice(from, to);
      }
      if (typeof str === 'string') {
        expect(lines.join('\n')).to.equal(trim(str));
      } else {
        expect(lines).to.deep.equal(str);
      }
    }

    it('should render lines', function () {
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(getState(2, 0, 2));
      expectRendered(`
          ^!pick 123 Line 0
          pick 123 Line 1

          # Info 0
          # Info 1
          `);
    });

    it('should only render changed line', function () {
      const oldState = getState(2, 0, 1);
      const state = {
        lines: [{
          action: 'fixup',
          hash: '123',
          message: 'Hello'
        }, oldState.lines[1]],
        info: oldState.info,
        cursor: oldState.cursor
      } as RebaseState;
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(oldState);
      mockTerm.reset();
      terminal.render(state);
      expectRendered(`
          ^!fixup 123 Hello
          `);
      expect(mockTerm.clear).not.to.be.called;
    });

    it('should render noop', function () {
      const state = getState(noopLines, 0, 1);

      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(state);
      expectRendered(`
          ^!noop

          # Info 0
          `);
    });

    it('should highligt selected lines', function () {
      const state = getState(4, {
        from: 2,
        pos: 1
      }, 1);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(state);
      expectRendered(`
        pick 123 Line 0
        ^!pick 123 Line 1
        ^!pick 123 Line 2
        pick 123 Line 3

        # Info 0
        `);
    });

    it('should truncate lines to screen width', function () {
      const state = getState([{
        action: 'pick',
        hash: '6',
        message: '8^01234567890'
      }], 0, 2);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      mockTerm.width = 15;
      terminal.render(state);
      expect(mockTerm.getRendered()[0]).to.equal('^!pick 6 8^^012345');
    });

    it('should truncate color lines to screen width', function () {
      const state = getState([{
        action: 'pick',
        hash: '6',
        message: '8^01234567890'
      }, {
        action: 'pick',
        hash: '123',
        message: 'Line 2'
      }], 1, 2);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
        colors: colors
      });
      mockTerm.width = 15;
      terminal.render(state);
      expect(mockTerm.getRendered()[0]).to.equal('^rpick^ ^y6^ 8^^012345');
    });

    it('should escape ^ in message', function () {
      const state = getState([{
        action: 'pick',
        hash: '123',
        message: 'Unexpected ^red'
      }], 0, 2);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(state);
      expect(mockTerm.getRendered()[0]).to.equal('^!pick 123 Unexpected ^^red');
    });

    it('should highligt selected lines crossing 10', function () {
      const state = getState(15, {
        from: 9,
        pos: 10
      }, 1);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(state);
      expectRendered(`
        pick 123 Line 8
        ^!pick 123 Line 9
        ^!pick 123 Line 10
        pick 123 Line 11
        `, 8, 12);
    });

    it('should only render visible lines', function () {
      const state = getState(4, 0);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      mockTerm.height = 2;
      terminal.render(state);
      expectRendered(`
        ^!pick 123 Line 0
        pick 123 Line 1
        `);
    });

    it('should only render visible info lines', function () {
      const state = getState(1, 0, 3);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      mockTerm.height = 3;
      terminal.render(state);
      expectRendered(`
        ^!pick 123 Line 0

        # Info 0
        `);
    });

    it('should scroll down on bottom', function () {
      const state = getState(8, 6);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      mockTerm.height = 4;
      terminal.render(state);
      expectRendered(`
        pick 123 Line 3
        pick 123 Line 4
        pick 123 Line 5
        ^!pick 123 Line 6
        `);
      const newState = {
        cursor: {
          pos: 7,
          from: 7
        },
        lines: state.lines,
        info: state.info
      } as RebaseState;
      terminal.render(newState);
      expectRendered(`
        pick 123 Line 4
        pick 123 Line 5
        pick 123 Line 6
        ^!pick 123 Line 7
        `);
    });

    it('should scroll down on bottom of selection', function () {
      const state = getState(8, {
        from: 6,
        pos: 5
      });
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      mockTerm.height = 4;
      terminal.render(state);
      expectRendered(`
        pick 123 Line 3
        pick 123 Line 4
        ^!pick 123 Line 5
        ^!pick 123 Line 6
        `);
    });

    it('should clear bottom of screen on resize', function () {
      const state = getState(7, 0, 2);
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      mockTerm.height = 10;
      terminal.render(state);
      mockTerm.height = 12;
      terminal.render(state, 'resize');
      expect(mockTerm.getRendered().slice(10)).to.deep.equal(['', '']);
    });

    it('should erase lines when new render is shorter than previous', function () {
      const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
      terminal.render(getState(5, 0));  // renders 6 lines (5 + blank)
      mockTerm.reset();
      terminal.render(getState(2, 0)); // renders 3 lines (2 + blank) — lines 3-5 should be erased
      const rendered = mockTerm.getRendered();
      // Lines at index 3, 4, 5 should have been cleared
      expect(rendered[3]).to.equal('');
      expect(rendered[4]).to.equal('');
      expect(rendered[5]).to.equal('');
    });

    describe('with status', function () {
      it('should render if enabled', function () {
        const state = getState(2, 0, 1);
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          status: true
        });
        mockTerm.height = 20;
        terminal.render(state, 'up', 'UP');
        expectRendered(`
          ^+^_Cursor: 0 From: 0 Key: up  Raw key: UP Height: 20
          ^!pick 123 Line 0
          pick 123 Line 1

          # Info 0
          `);
      });

      it('should scroll on last line', function () {
        const state = getState(4, 2);
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          status: true
        });
        mockTerm.height = 3;
        terminal.render(state, 'up', 'UP');
        expectRendered(`
          ^+^_Cursor: 2 From: 2 Key: up  Raw key: UP Height: 3
          pick 123 Line 1
          ^!pick 123 Line 2
          `);
      });
    });

    describe('with color', function () {
      it('should render colors if enabled', function () {
        const state = getState(2, 0, 1);
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          colors: colors
        });
        terminal.render(state);
        expectRendered(`
          ^!pick 123 Line 0
          ^rpick^ ^y123^ Line 1

          # Info 0
      `);
      });

      it('should render noop', function () {
        const state = getState(noopLines, 0, 1);
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          colors: colors
        });
        terminal.render(state);
        expectRendered(`
            ^!noop

            # Info 0
            `);
      });

    });

    describe('events', function () {

      it('should fire on key', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          keyBindings: {
            f: 'foobar'
          }
        });
        const spy = sinon.spy();
        terminal.addKeyListener(spy);
        mockTerm.emit('key', 'f');
        expect(spy).to.be.calledWith('foobar', 'f');
      });

      it('should fire resize event when key listener added', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        mockTerm.height = 10;
        const spy = sinon.spy();
        terminal.addKeyListener(spy);
        expect(spy).to.be.calledWith('resize', 10);
      });

      describe('on resize', function () {

        let clock: sinon.SinonFakeTimers;

        beforeEach(function () {
          clock = sinon.useFakeTimers();
        });

        afterEach(function () {
          clock.restore();
        });

        it('should eventually trigger callback', function () {
          const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
          const spy = sinon.spy();
          terminal.addKeyListener(spy);
          mockTerm.height = 20;
          mockTerm.emit('resize', 20, 20);
          clock.tick(1000);
          expect(spy).to.be.calledWith('resize', 20);
        });

        it('should debounce resize', function () {
          const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
          const spy = sinon.spy();
          terminal.addKeyListener(spy);
          spy.resetHistory();
          mockTerm.height = 20;
          mockTerm.emit('resize', 20, 20);
          expect(spy).not.to.be.called;
          clock.tick(10);
          mockTerm.emit('resize', 20, 20);
          expect(spy).not.to.be.called;
          clock.tick(1000);
          expect(spy).to.be.calledWith('resize', 20);
        });

        it('should append blank lines to bottom when increasing window height', function () {
          const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
          mockTerm.height = 5;
          terminal.addKeyListener(() => { /* noop */ });
          mockTerm.height = 7;
          mockTerm.emit('resize');
          clock.tick(1000);
          expect(mockTerm.getRendered()[6]).to.equal('\n\n');
        });

        it('should not append blank lines to bottom when they have already been added', function () {
          const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
          mockTerm.height = 5;
          terminal.addKeyListener(() => { /* noop */ });
          mockTerm.height = 10;
          mockTerm.emit('resize');
          clock.tick(1000);
          mockTerm.reset();
          mockTerm.height = 7;
          mockTerm.emit('resize');
          clock.tick(1000);
          mockTerm.height = 10;
          mockTerm.emit('resize');
          clock.tick(1000);
          expect(mockTerm.getRendered()[9]).to.equal(undefined);
        });
      });
    });

    describe('close', function () {

      it('should restore screen', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        terminal.close();
        expect(mockTerm.fullscreen).to.be.calledWith(false);
      });

      it('should restore cursor', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        terminal.close();
        expect(mockTerm.hideCursor).to.be.calledWith(false);
      });

      describe('on disabled alternate screen', function () {

        let terminal: Terminal;

        beforeEach(function () {
          terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
            alternateScreen: false
          });
        });

        it('should not restore screen', function () {
          terminal.close();
          expect(mockTerm.fullscreen).not.to.be.called;
        });

        it('should move cursor to last line', function () {
          mockTerm.height = 15;
          const state = getState(5, 2, 10);
          terminal.render(state);
          terminal.render(Object.assign({}, state, {
            cursor: {
              from: 3,
              to: 3
            }
          }));
          terminal.close();
          expect(mockTerm.getCursorPos()).to.equal(16);
        });

        it('should clear last line ', function () {
          mockTerm.height = 15;
          terminal.render(getState(5, 2, 20));
          terminal.close();
          expect(mockTerm.getRendered().slice(15)).to.deep.equal(['']);
        });
      });
    });


    describe('custom select marker', function () {
      it('should display custom select marker', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal, {
          selectMarker: '> '
        });
        terminal.render(getState(2, 0, 1));
        expectRendered(`
          > pick 123 Line 0
          pick 123 Line 1

          # Info 0
      `);
      });
    });

    describe('reword mode', function () {
      it('should render reword mode editor when rewordState is set', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0),
          rewordState: {
            message: 'My commit',
            lineIndex: 0,
            cursorPos: 9
          }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // Footer is on the last line
        const footer = rendered[mockTerm.height - 1];
        expect(footer).to.include('ENTER: new line');
        expect(footer).to.include('ESC: save');
        // Message is at the top
        expect(rendered[0]).to.include('My commit');
      });

      it('should render non-cursor lines without highlight in multi-line messages', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc123', message: 'First line\nSecond line' }], 0),
          rewordState: {
            message: 'First line\nSecond line',
            lineIndex: 0,
            cursorPos: 2  // cursor on first line, col 2
          }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // Second line should be rendered without cursor highlight
        expect(rendered.join('\n')).to.include('Second line');
      });

      it('should scroll so cursor line is visible when below terminal height', function () {
        // height=50, contentHeight=49. Cursor on line 49 → scrollOffset = 49 - 49 + 3 = 3
        // Build a 51-line message: "line0\nline1\n...line50"
        const lines51 = Array.from({ length: 51 }, (_, i) => `line${i}`);
        const msg = lines51.join('\n');
        // cursorPos points to start of line 49
        const cursorPos = lines51.slice(0, 49).reduce((acc, l) => acc + l.length + 1, 0);
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc123', message: msg }], 0),
          rewordState: { message: msg, lineIndex: 0, cursorPos }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // scrollOffset=3 → line 0 of screen shows "line3", not "line0"
        expect(rendered[0]).to.equal('line3');
        // cursor line (line49) appears at row 49-3=46 (3rd from bottom of content)
        expect(rendered[mockTerm.height - 4]).to.include('ine49');
      });

      it('should scroll to follow cursor when extending selection beyond screen', function () {
        // Build a tall message, select from top; cursor on a line with no selected chars visible
        const lines51 = Array.from({ length: 51 }, (_, i) => `line${i}`);
        const msg = lines51.join('\n');
        // anchor at start, cursor on line 49 (below fold)
        const cursorPos = lines51.slice(0, 49).reduce((acc, l) => acc + l.length + 1, 0);
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc123', message: msg }], 0),
          rewordState: { message: msg, lineIndex: 0, cursorPos, selectAnchor: 0, originalMessage: msg }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // Should scroll so cursor line is visible (not stuck at top)
        expect(rendered[0]).not.to.equal('line0');
        expect(rendered[mockTerm.height - 4]).to.include('line49');
      });

      it('should show first line of message for all lines in rebase mode', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const state: RebaseState = {
          ...getState([{
            action: 'reworded',
            hash: 'abc123',
            message: 'First line\nSecond line'
          }], 0)
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        expect(rendered[0]).to.include('First line');
        expect(rendered[0]).not.to.include('Second line');
      });

      it('should show empty message for reworded line with only comment lines', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const state: RebaseState = {
          ...getState([{
            action: 'reworded',
            hash: 'abc123',
            message: '# only a comment'
          }], 0)
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        expect(rendered[0]).to.include('reworded abc123');
      });

      it('should render reword editor from top when rebase cursor is below terminal height', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const lines = Array.from({ length: mockTerm.height + 5 }, (_, i) =>
          ({ action: 'pick' as const, hash: `sha${i}`, message: `commit ${i}` })
        );
        const cursorPos = mockTerm.height + 4;
        const msg = 'my commit message';
        const state: RebaseState = {
          ...getState(lines, cursorPos),
          rewordState: { message: msg, lineIndex: cursorPos, cursorPos: msg.length, originalMessage: msg }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        expect(rendered[0]).to.include('my commit message');
      });

      it('should highlight selected range with inversion when selection is active', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const msg = 'hello world';
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc', message: msg }], 0),
          rewordState: { message: msg, lineIndex: 0, cursorPos: 8, selectAnchor: 3, originalMessage: msg }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // Selection [3,8) = 'lo wo' should be wrapped in ^!...^:
        expect(rendered[0]).to.include('^!lo wo^:');
        expect(rendered[0]).to.match(/^hel/);
        expect(rendered[0]).to.include('rld');
      });

      it('should not highlight lines outside the selection range', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const msg = 'aaa\nbbb\nccc';
        // Selection only covers second line (4-7)
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc', message: msg }], 0),
          rewordState: { message: msg, lineIndex: 0, cursorPos: 7, selectAnchor: 4, originalMessage: msg }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // First and third lines should not have selection highlight
        expect(rendered[0]).not.to.include('^!');
        expect(rendered[2]).not.to.include('^!');
        // Second line should have selection
        expect(rendered[1]).to.include('^!bbb^:');
      });

      it('should highlight selection spanning multiple lines', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        const msg = 'hello\nworld';
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc', message: msg }], 0),
          rewordState: { message: msg, lineIndex: 0, cursorPos: 8, selectAnchor: 3, originalMessage: msg }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // Selection [3,8): on 'hello' (offsets 0-4) → chars 3-4 = 'lo'; on 'world' (offsets 6-10) → chars 0-1 = 'wo'
        expect(rendered[0]).to.include('^!lo^:');
        expect(rendered[1]).to.include('^!wo^:');
      });

      it('should show highlighted space on empty line within selection', function () {
        const terminal = new Terminal(mockTerm as unknown as TerminalKitTerminal);
        // 'hello\n\nworld': empty line at offset 6, selection covers it
        const msg = 'hello\n\nworld';
        const state: RebaseState = {
          ...getState([{ action: 'reword', hash: 'abc', message: msg }], 0),
          rewordState: { message: msg, lineIndex: 0, cursorPos: 9, selectAnchor: 3, originalMessage: msg }
        };
        terminal.render(state);
        const rendered = mockTerm.getRendered();
        // Empty second line (offset 6) is within selection [3,9) → show highlighted space
        expect(rendered[1]).to.equal('^! ^:');
      });
    });
  });
});
