'use strict';

const Terminal = require('../lib/terminal'),
  mockTerminal = require('./mock-terminal'),
  getState = require('./state-gen');

describe('Terminal renderer', function () {
  let mockTerm;

  beforeEach(function () {
    mockTerm = mockTerminal.create();
  });

  describe('constructor', function () {
    it('should call fullscreen', function () {
      new Terminal(mockTerm);
      expect(mockTerm.fullscreen).to.be.calledWith(true);
      expect(mockTerm.grabInput).to.be.calledWith();
    });
  });

  describe('render', function () {

    function trim(str) {
      return str.trim().split('\n').map((line) => line.trimLeft()).join('\n');
    }

    function expectRendered(str) {
      expect(mockTerm.getRendered()).to.equal(trim(str));
    }

    it('should render lines', function () {
      const terminal = new Terminal(mockTerm);
      terminal.render({
        lines: [{
          action: 'pick',
          hash: '123',
          message: 'Hello'
        }, {
          action: 'pick',
          hash: '234',
          message: 'World'
        }],
        info: ['# More', '# Info'],
        cursor: {
          pos: 0
        }
      });
      expectRendered(`
          pick 123 Hello
          pick 234 World

          # More
          # Info
          `);
      expect(mockTerm.getCursorPos()).to.equal(1);
    });

    it('should only render changed line', function () {
      const oldState = {
        lines: [{
          action: 'pick',
          hash: '123',
          message: 'Hello'
        }, {
          action: 'pick',
          hash: '234',
          message: 'World'
        }],
        info: ['# Info'],
        cursor: {
          pos: 0
        }
      };
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
          fixup 123 Hello
          `);
      expect(mockTerm.clear).not.to.be.called;
    });

    it('should render noop', function () {
      const state = {
        lines: [{
          action: 'noop'
        }],
        info: ['# Info'],
        cursor: {
          pos: 0
        }
      };
      const terminal = new Terminal(mockTerm);
      terminal.render(state);
      expectRendered(`
          noop

          # Info
          `);
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
      const state = getState(4, 3);
      const terminal = new Terminal(mockTerm);
      mockTerm.height = 2;
      terminal.render(state);
      expectRendered(`
        pick 123 Line 2
        ^!pick 123 Line 3
        `);
    });

    it('should only render status line if enabled', function () {
      const state = {
        lines: [{
          action: 'pick',
          hash: '123',
          message: 'Hello'
        }, {
          action: 'pick',
          hash: '234',
          message: 'World'
        }],
        info: ['# Info'],
        cursor: {
          pos: 0,
          from: 0
        }
      };
      const terminal = new Terminal(mockTerm, {
        status: true
      });
      terminal.render(state, 'up', 'UP');
      expectRendered(`
          Cursor: 0 From: 0 Key: up  Raw key: UP
          ^!pick 123 Hello
          pick 234 World

          # Info
          `);
      expect(mockTerm.getCursorPos()).to.equal(2);
    });

    describe('with color', function () {
      it('should render colors if enabled', function () {
        const state = {
          lines: [{
            action: 'pick',
            hash: '123',
            message: 'Hello'
          }, {
            action: 'pick',
            hash: '234',
            message: 'World'
          }],
          info: ['# Info'],
          cursor: {
            pos: 0
          }
        };
        const terminal = new Terminal(mockTerm, {
          colors: true
        });
        terminal.render(state);
        expectRendered(`
          ^rpick ^y123^ Hello
          ^rpick ^y234^ World

          # Info
      `);
      });

      it('should render noop', function () {
        const state = {
          lines: [{
            action: 'noop'
          }],
          info: ['# Info'],
          cursor: {
            pos: 0
          }
        };
        const terminal = new Terminal(mockTerm, {
          colors: true
        });
        terminal.render(state);
        expectRendered(`
            ^rnoop ^y^${' '}

            # Info
            `);
      });

      it('should render extra info', function () {
        const state = {
          lines: [{
            action: 'pick',
            hash: '123',
            message: 'Message'
          }],
          info: ['# Info', '#', '# Commands', '#', '# Rest'],
          extraInfo: ['# Extra info'],
          cursor: {
            pos: 0
          }
        };
        const terminal = new Terminal(mockTerm);
        terminal.render(state);
        expectRendered(`
            pick 123 Message

            # Info
            #
            # Commands
            # Extra info
            #
            # Rest
            `);
      });
    });
  });
});
