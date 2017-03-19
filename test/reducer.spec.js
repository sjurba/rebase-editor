'use strict';

const reduce = require('../lib/reducer.js');

function getState(lines, cursorPos) {
  return {
    lines: new Array(lines).fill().map((val, idx) => {
      return 'Line ' + idx;
    }),
    cursor: {
      pos: cursorPos
    }
  };
}

describe('Reducer', function () {

  it('should return same state on unknown command', function () {
    const state = {
      foo: 'bar'
    };
    const newState = reduce(state, 'foobar');
    expect(newState).to.equal(state);
  });

  describe('moving cursor', function () {
    it('down', function () {
      const state = getState(2, 0);
      const newState = reduce(state, 'down');
      expect(newState.lines).to.equal(state.lines);
      expect(newState.cursor).not.to.equal(state.cursor);
      expect(newState.cursor.pos).to.equal(1);
    });

    it('down on last line should do nothing', function () {
      const state = getState(2, 1);
      const newState = reduce(state, 'down');
      expect(newState).to.equal(state);
    });

    it('up', function () {
      const state = getState(2, 1);
      const newState = reduce(state, 'up');
      expect(newState.cursor.pos).to.equal(0);
    });

    it('up on top line should do nothing', function () {
      const state = getState(2, 0);
      const newState = reduce(state, 'up');
      expect(newState).to.equal(state);
    });
  });
});
