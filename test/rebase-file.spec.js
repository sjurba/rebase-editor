'use strict';

const rebaseFile = require('../lib/rebase-file');

describe('Rebase file', function () {

  describe('to state', function () {
    it('should parse lines', function () {
      const state = rebaseFile.toState(`
          pick ad3d434 Hello message`);
      expect(state.lines).to.deep.equal([{
        action: 'pick',
        message: 'ad3d434 Hello message'
      }]);
    });

    it('should parse info lines', function () {
      const state = rebaseFile.toState(`
          pick ad3d434 Hello message

          # Info here`);
      expect(state.info).to.deep.equal(['# Info here']);
    });
  });
});
