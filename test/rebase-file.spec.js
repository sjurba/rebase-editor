'use strict';

const rebaseFile = require('../lib/rebase-file');

function trim(str) {
  return str.trim().split('\n').map((line) => line.trim()).join('\n');
}

describe('Rebase file', function () {

  describe('to state', function () {
    it('should parse lines', function () {
      const state = rebaseFile.toState(`
          pick ad3d434 Hello message`);
      expect(state.lines).to.deep.equal([{
        action: 'pick',
        hash: 'ad3d434',
        message: 'Hello message'
      }]);
    });

    it('should parse info lines', function () {
      const state = rebaseFile.toState(`
          pick ad3d434 Hello message

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
});
