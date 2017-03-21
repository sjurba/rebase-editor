  'use strict';

  const reduce = require('../lib/reducer'),
    getState = require('./state-gen');

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

    describe('moving selection', function () {
      it('down', function () {
        const state = getState(4, {
          from: 2,
          pos: 1
        });
        const newState = reduce(state, 'moveDown');
        expect(newState.lines[0]).to.equal(state.lines[0]);
        expect(newState.lines[1]).to.equal(state.lines[3]);
        expect(newState.lines[2]).to.equal(state.lines[1]);
        expect(newState.lines[3]).to.equal(state.lines[2]);
        expect(newState.cursor.from).to.equal(3);
        expect(newState.cursor.pos).to.equal(2);
      });

      it('up when selection is from the bottom', function () {
        const state = getState(4, {
          from: 3,
          pos: 2
        });
        const newState = reduce(state, 'moveDown');
        expect(newState).to.equal(state);
      });

      it('up', function () {
        const state = getState(4, {
          from: 1,
          pos: 2
        });
        const newState = reduce(state, 'moveUp');
        expect(newState.lines[0]).to.equal(state.lines[1]);
        expect(newState.lines[1]).to.equal(state.lines[2]);
        expect(newState.lines[2]).to.equal(state.lines[0]);
        expect(newState.lines[3]).to.equal(state.lines[3]);
        expect(newState.cursor.from).to.equal(0);
        expect(newState.cursor.pos).to.equal(1);
      });

      it('up when selection is from the top', function () {
        const state = getState(4, {
          from: 0,
          pos: 2
        });
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

      it('should do nothing if line has no hash', function () {
        const state = getState([{
          action: 'noop'
        }], 0);
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

      it('should change entire selection', function () {
        const state = getState(3, {
          from: 2,
          pos: 1
        });
        const newState = reduce(state, 'fixup');
        expect(newState.lines[0].action).to.equal('pick');
        expect(newState.lines[1].action).to.equal('fixup');
        expect(newState.lines[2].action).to.equal('fixup');
      });
    });

    describe('undo', function () {
      it('should not undo when nothing has changed', function () {
        const state = getState(1, 0);
        let newState = reduce(state, 'undo');
        expect(newState).to.equal(state);
      });

      it('should undo action change', function () {
        const state = getState(1, 0);
        let newState = reduce(state, 'fixup');
        newState = reduce(newState, 'undo');
        expect(newState.lines).to.equal(state.lines);
      });

      it('should not undo on move', function () {
        const state = getState(2, 0);
        let newState = reduce(state, 'down');
        newState = reduce(newState, 'undo');
        expect(newState.lines).to.equal(state.lines);
        expect(newState.cursor).not.to.equal(state.cursor);
      });

      it('should update cursor on undo', function () {
        const state = getState(2, 0);
        let newState = reduce(state, 'fixup');
        newState = reduce(newState, 'down');
        newState = reduce(newState, 'undo');
        expect(newState.lines).to.equal(state.lines);
        expect(newState.cursor).to.equal(state.cursor);
      });

      it('should undo multiple actions', function () {
        const state = getState(1, 0);
        let newState = reduce(state, 'fixup');
        newState = reduce(newState, 'reword');
        expect(newState.lines[0].action).to.equal('reword');
        newState = reduce(newState, 'undo');
        expect(newState.lines[0].action).to.equal('fixup');
        newState = reduce(newState, 'undo');
        expect(newState.lines).to.equal(state.lines);
      });
    });

    describe('redo', function () {
      it('should not undo when nothing has changed', function () {
        const state = getState(1, 0);
        let newState = reduce(state, 'redo');
        expect(newState).to.equal(state);
      });

      it('should redo change', function () {
        let state = getState(1, 0);
        state = reduce(state, 'fixup');
        let newState = reduce(state, 'undo');
        newState = reduce(newState, 'redo');
        expect(newState.lines).to.equal(state.lines);
      });

      it('should undo redo change', function () {
        const state = getState(1, 0);
        let newState = reduce(state, 'fixup');
        newState = reduce(newState, 'undo');
        newState = reduce(newState, 'redo');
        newState = reduce(newState, 'undo');
        expect(newState.lines).to.equal(state.lines);
      });

      it('should clear redo stack on change', function () {
        let state = getState(1, 0);
        state = reduce(state, 'fixup');
        state = reduce(state, 'reword');
        state = reduce(state, 'undo');
        state = reduce(state, 'squash');
        const newState = reduce(state, 'redo');
        expect(newState).to.equal(state);
      });
    });

    describe('select', function () {

      describe('down', function () {
        it('should increase selection', function () {
          let state = getState(3, 0);
          state = reduce(state, 'selectDown');
          state = reduce(state, 'selectDown');
          expect(state.cursor).to.deep.equal({
            from: 0,
            pos: 2
          });
        });
        it('should do nothing when on last line', function () {
          let state = getState(2, 1);
          let newState = reduce(state, 'selectDown');
          expect(newState).to.equal(state);
        });
        it('should reduce selection', function () {
          let state = getState(2, {
            from: 2,
            pos: 0
          });
          state = reduce(state, 'selectDown');
          expect(state.cursor).to.deep.equal({
            from: 2,
            pos: 1
          });
        });
      });

      describe('up', function () {
        it('should increase selection', function () {
          let state = getState(3, 2);
          state = reduce(state, 'selectUp');
          state = reduce(state, 'selectUp');
          expect(state.cursor).to.deep.equal({
            from: 2,
            pos: 0
          });
        });
        it('should do nothing when on last line', function () {
          let state = getState(2, 0);
          let newState = reduce(state, 'selectUp');
          expect(newState).to.equal(state);
        });
        it('should reduce selection', function () {
          let state = getState(2, {
            from: 0,
            pos: 2
          });
          state = reduce(state, 'selectUp');
          expect(state.cursor).to.deep.equal({
            from: 0,
            pos: 1
          });
        });
      });

    });
  });
