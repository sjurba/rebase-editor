'use strict';

const Terminal = require('../lib/terminal');
const mockTerminal = require('./mock-terminal');

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
      return str.trim().split('\n').map((line) => line.trim()).join('\n');
    }

    function expectRendered(str) {
      expect(mockTerm.getRendered()).to.equal(trim(str));
    }

    describe('on load', function () {
      it('should render lines', function () {
        const terminal = new Terminal(mockTerm);
        terminal.render(null, {
          lines: [{
            action: 'pick',
            message: 'Hello'
          }, {
            action: 'pick',
            message: 'World'
          }],
          info: ['# More', '# Info'],
          cursor: {
            pos: 0
          }
        });
        expectRendered(`
          pick Hello
          pick World

          # More
          # Info
          `);
        expect(mockTerm.clear).to.be.called;
        expect(mockTerm.getCursorPos()).to.equal(1);
      });

      it('should only render changed line', function () {
        const oldState = {
          lines: [{
            action: 'pick',
            message: 'Hello'
          }, {
            action: 'pick',
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
            message: 'Hello'
          }, oldState.lines[1]],
          info: oldState.info,
          cursor: oldState.cursor
        };
        const terminal = new Terminal(mockTerm);
        terminal.render(oldState, state);
        expectRendered(`
          fixup Hello
          `);
        expect(mockTerm.clear).not.to.be.called;
        expect(mockTerm.eraseLineAfter).to.be.called;
      });

      it('should only render status line if enabled', function () {
        const state = {
          lines: [{
            action: 'pick',
            message: 'Hello'
          }, {
            action: 'pick',
            message: 'World'
          }],
          info: ['# Info'],
          cursor: {
            pos: 0
          }
        };
        const terminal = new Terminal(mockTerm, {
          status: true
        });
        terminal.render(null, state, 'up', 'UP');
        expectRendered(`
          Cursor: 0 Key: up Raw key: UP
          pick Hello
          pick World

          # Info
          `);
        expect(mockTerm.getCursorPos()).to.equal(2);
      });
    });
  });
});
