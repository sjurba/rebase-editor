'use strict';

const reduce = require('../lib/reducer.js');

function getState(lines, cursorPos) {
  return {
    lines: new Array(lines || 0).fill().map((val, idx) => {
      return {
        action: 'pick',
        message: 'Line ' + idx
      };
    }),
    cursor: {
      pos: cursorPos || 0
    },
    otherStateVar: {
      foo: 'bar'
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
      expect(newState.otherStateVar).to.equal(state.otherStateVar);
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
      expect(newState.otherStateVar).to.equal(state.otherStateVar);
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
      expect(newState.otherStateVar).to.equal(state.otherStateVar);
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

  describe('change action key', function () {
    it('should do nothing if action is not different', function () {
      const state = getState(1, 0);
      const newState = reduce(state, 'pick');
      expect(newState).to.equal(state);
    });

    it('should change on fixup', function () {
      const state = getState(3, 1);
      const newState = reduce(state, 'fixup');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1].action).to.equal('fixup');
      expect(newState.lines[1].message).to.equal(state.lines[1].message);
      expect(newState.lines[1]).not.to.equal(state.lines[1]);
      expect(newState.lines[2]).to.equal(state.lines[2]);
      expect(newState.otherStateVar).to.equal(state.otherStateVar);
    });
  });

  describe('delete', function () {
    it('should comment line', function () {
      const state = getState(3, 1);
      const newState = reduce(state, 'delete');
      expect(newState.lines[1].action).to.equal('#');
    });
  });
});
