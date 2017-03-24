'use strict';

const rebaseFile = require('../lib/rebase-file');

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
