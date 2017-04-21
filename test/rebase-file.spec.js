'use strict';

const rebaseFile = require('../lib/rebase-file');
const keyBindings = require('../lib/key-bindings');

function trim(str) {
  return str.trim().split('\n').map((line) => line.trim()).join('\n');
}

describe('Rebase file', function () {

  describe('to state', function () {
    it('should parse lines', function () {
      const state = rebaseFile.toState('pick ad3d434 Hello message');
      expect(state.lines).to.deep.equal([{
        action: 'pick',
        hash: 'ad3d434',
        message: 'Hello message'
      }]);
    });

    it('should parse info lines', function () {
      const state = rebaseFile.toState(
        `pick ad3d434 Hello message

          # Info here`);
      expect(state.info).to.deep.equal(['# Info here']);
    });

    it('should parse noop', function () {
      const file = trim(`
          noop

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(rebaseFile.toFile(state)).to.equal(file);
    });

    it('should parse with empty commits', function () {
      const file = trim(`
          # pick 234 Empty commit
          pick 123 First
          pick 345 Last

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(rebaseFile.toFile(state)).to.equal(file);
      expect(state.lines[0].action).to.equal('# pick');
    });

    it('should print key bindings as help', function () {
      const state = rebaseFile.toState('pick ad3d434 Hello message');
      expect(state.extraInfo(keyBindings())).to.deep.equal([
        '# NOTE: x is not supported by rebase editor',
        '#',
        '# Rebase Editor Commands:',
        '# UP = Moves cursor up',
        '# DOWN = Moves cursor down',
        '# SHIFT_DOWN, SHIFT_RIGHT = Select one line down',
        '# SHIFT_UP, SHIFT_LEFT = Select one line up',
        '# RIGHT, CTRL_DOWN = Moves current line down one position',
        '# LEFT, CTRL_UP = Moves current line up one position',
        '# z, CTRL_Z = Undo',
        '# Z, CTRL_SHIFT_Z = Redo',
        '# q, ENTER = Save and quit',
        '# CTRL_C, ESCAPE = Abort',
        '# HOME, END, PAGE_UP, PAGE_DOWN = Moves cursor and selects with SHIFT'
      ]);
    });

  });

  it('to file', function () {
    const state = {
      lines: [{
          action: 'pick',
          hash: 'ad3d434',
          message: 'Hello message'
        },
        {
          action: 'fixup',
          hash: 'bf44d54',
          message: 'Hello 2 message'
        }
      ],
      info: ['# Info']
    };
    const file = rebaseFile.toFile(state);
    expect(file).to.equal(trim(`
      pick ad3d434 Hello message
      fixup bf44d54 Hello 2 message

      # Info
    `));
  });

  it('should throw error if file is not a rebase file', function () {
    function parse() {
      const file = trim(`
          #!/bin/sh

          echo 'Jalla'`);
      rebaseFile.toState(file);
    }
    expect(parse).to.throw();
  });
});
