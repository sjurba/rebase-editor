'use strict';

const reduce = require('../lib/reducer.js');

function getState(lines, cursorPos) {
  return {
    lines: new Array(lines || 0).fill().map((val, idx) => {
      return 'Line ' + idx;
    }),
    cursor: {
      pos: cursorPos || 0
    }
  };
}

describe('Reducer', function () {

  it('should return same state on unknown command', function () {
    const state = getState();
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

  describe('moving line', function () {
    it('down', function () {
      const state = getState(2, 0);
      const newState = reduce(state, 'moveDown');
      expect(newState.lines[0]).to.equal(state.lines[1]);
      expect(newState.lines[1]).to.equal(state.lines[0]);
      expect(newState.cursor.pos).to.equal(1);
    });
    it('down in the middle', function () {
      const state = getState(4, 1);
      const newState = reduce(state, 'moveDown');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1]).to.equal(state.lines[2]);
      expect(newState.lines[2]).to.equal(state.lines[1]);
      expect(newState.lines[3]).to.equal(state.lines[3]);
      expect(newState.cursor.pos).to.equal(2);
    });
    it('down on last line should do nothing', function () {
      const state = getState(2, 1);
      const newState = reduce(state, 'moveDown');
      expect(newState).to.equal(state);
    });
    it('up', function () {
      const state = getState(2, 1);
      const newState = reduce(state, 'moveUp');
      expect(newState.lines[0]).to.equal(state.lines[1]);
      expect(newState.lines[1]).to.equal(state.lines[0]);
      expect(newState.cursor.pos).to.equal(0);
    });
    it('up in the middle', function () {
      const state = getState(4, 2);
      const newState = reduce(state, 'moveUp');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1]).to.equal(state.lines[2]);
      expect(newState.lines[2]).to.equal(state.lines[1]);
      expect(newState.lines[3]).to.equal(state.lines[3]);
      expect(newState.cursor.pos).to.equal(1);
    });
    it('up on top line should do nothing', function () {
      const state = getState(2, 0);
      const newState = reduce(state, 'moveUp');
      expect(newState).to.equal(state);
    });
  });
});
