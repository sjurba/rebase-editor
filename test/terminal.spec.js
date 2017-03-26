'use strict';

const Terminal = require('../lib/terminal'),
  mockTerminal = require('./mock-terminal'),
  getState = require('./state-gen');

const noopLines = [{
  action: 'noop'
}];

const colors = ['^r', '^y'];

describe('Terminal renderer', function () {
  let mockTerm;

  beforeEach(function () {
    mockTerm = mockTerminal.create();
  });

  describe('on construct', function () {

    describe('when alternate screen enabled', function () {
      it('should call fullscreen', function () {
        new Terminal(mockTerm);
        expect(mockTerm.fullscreen).to.be.calledWith(true);
      });

      it('should hide cursor', function () {
        new Terminal(mockTerm);
        expect(mockTerm.hideCursor).to.be.calledWith(true);
      });

    });

    describe('when alternate screen disabled', function () {

      it('should not call fullscreen', function () {
        new Terminal(mockTerm, {
          alternateScreen: false
        });
        expect(mockTerm.fullscreen).to.not.be.called;
      });

      it('should scroll to top', function () {
        mockTerm.height = 10;
        new Terminal(mockTerm, {
          alternateScreen: false
        });
        expect(mockTerm.initialScroll).to.equal(10);
      });
    });
  });

  describe('render', function () {

    function trim(str) {
      return str.trim().split('\n').map((line) => line.trimLeft()).join('\n');
    }

    function expectRendered(str, from, to) {
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
      const terminal = new Terminal(mockTerm);
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
      };
      const terminal = new Terminal(mockTerm);
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

      const terminal = new Terminal(mockTerm);
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
      const terminal = new Terminal(mockTerm);
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
        hash: 6,
        message: '8^01234567890'
      }], 0, 2);
      const terminal = new Terminal(mockTerm);
      mockTerm.width = 15;
      terminal.render(state);
      expect(mockTerm.getRendered()[0]).to.equal('^!pick 6 8^^012345');
    });

    it('should truncate color lines to screen width', function () {
      const state = getState([{
        action: 'pick',
        hash: 6,
        message: '8^01234567890'
      }, {
        action: 'pick',
        hash: 123,
        message: 'Line 2'
      }], 1, 2);
      const terminal = new Terminal(mockTerm, {
        colors: colors
      });
      mockTerm.width = 15;
      terminal.render(state);
      expect(mockTerm.getRendered()[0]).to.equal('^rpick^ ^y6^ 8^^012345');
    });

    it('should escape ^ in message', function () {
      const state = getState([{
        action: 'pick',
        hash: 123,
        message: 'Unexpected ^red'
      }], 0, 2);
      const terminal = new Terminal(mockTerm);
      terminal.render(state);
      expect(mockTerm.getRendered()[0]).to.equal('^!pick 123 Unexpected ^^red');
    });

    it('should highligt selected lines crossing 10', function () {
      const state = getState(15, {
        from: 9,
        pos: 10
      }, 1);
      const terminal = new Terminal(mockTerm);
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
      const terminal = new Terminal(mockTerm);
      mockTerm.height = 2;
      terminal.render(state);
      expectRendered(`
        ^!pick 123 Line 0
        pick 123 Line 1
        `);
    });

    it('should only render visible info lines', function () {
      const state = getState(1, 0, 3);
      const terminal = new Terminal(mockTerm);
      mockTerm.height = 3;
      terminal.render(state);
      expectRendered(`
        ^!pick 123 Line 0

        # Info 0
        `);
    });

    it('should scroll down on bottom', function () {
      const state = getState(8, 6);
      const terminal = new Terminal(mockTerm);
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
      };
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
      const terminal = new Terminal(mockTerm);
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
      const terminal = new Terminal(mockTerm);
      mockTerm.height = 10;
      terminal.render(state);
      mockTerm.height = 12;
      terminal.render(state, 'resize');
      expect(mockTerm.getRendered().slice(10)).to.deep.equal(['', '']);
    });

    describe('with status', function () {
      it('should render if enabled', function () {
        const state = getState(2, 0, 1);
        const terminal = new Terminal(mockTerm, {
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
        const terminal = new Terminal(mockTerm, {
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
        const terminal = new Terminal(mockTerm, {
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
        const terminal = new Terminal(mockTerm, {
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
        const terminal = new Terminal(mockTerm, {
          keyBindings: {
            f: 'foobar'
          }
        });
        const spy = sinon.spy();
        terminal.addKeyListener(spy);
        mockTerm.emit('key', 'f');
        expect(spy).to.be.calledWith('foobar', 'f');
      });

      describe('on resize', function () {

        let clock;

        beforeEach(function () {
          clock = sinon.useFakeTimers();
        });

        afterEach(function () {
          clock.restore();
        });

        it('should eventually trigger callback', function () {
          const terminal = new Terminal(mockTerm);
          const spy = sinon.spy();
          terminal.addKeyListener(spy);
          mockTerm.emit('resize', 20, 20);
          clock.tick(1000);
          expect(spy).to.be.calledWith('resize', 'resize');
        });

        it('should debounce resize', function () {
          const terminal = new Terminal(mockTerm);
          const spy = sinon.spy();
          terminal.addKeyListener(spy);
          mockTerm.emit('resize', 20, 20);
          expect(spy).not.to.be.called;
          clock.tick(10);
          mockTerm.emit('resize', 20, 20);
          expect(spy).not.to.be.called;
          clock.tick(1000);
          expect(spy).to.be.calledWith('resize', 'resize');
        });

        it('should append blank lines to bottom when increasing window height', function () {
          const terminal = new Terminal(mockTerm);
          mockTerm.height = 5;
          terminal.addKeyListener(() => {});
          mockTerm.height = 7;
          mockTerm.emit('resize');
          clock.tick(1000);
          expect(mockTerm.getRendered()[6]).to.equal('\n\n');
        });

        it('should not append blank lines to bottom when they have already been added', function () {
          const terminal = new Terminal(mockTerm);
          mockTerm.height = 5;
          terminal.addKeyListener(() => {});
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
        const terminal = new Terminal(mockTerm);
        terminal.close();
        expect(mockTerm.fullscreen).to.be.calledWith(false);
      });

      it('should restore cursor', function () {
        const terminal = new Terminal(mockTerm);
        terminal.close();
        expect(mockTerm.hideCursor).to.be.calledWith(false);
      });

      describe('on disabled alternate screen', function () {

        let terminal;

        beforeEach(function () {
          terminal = new Terminal(mockTerm, {
            alternateScreen: false
          });
        });

        it('should not restore screen', function () {
          terminal.close();
          expect(mockTerm.fullscreen).not.to.be.called;
        });

        it('should move cursor to last line', function () {
          mockTerm.height = 15;
          let state = getState(5, 2, 10);
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
        const terminal = new Terminal(mockTerm, {
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
  });
});
