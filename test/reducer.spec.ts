import reduce from '../src/reducer';
import getState from './state-gen';
import { expect } from 'chai';
import { RebaseState } from '../src/types';

describe('Reducer', function () {

  it('should return same state on unknown command', function () {
    const state = getState(0);
    const newState = reduce(state, 'foobar');
    expect(newState).to.equal(state);
  });

  it('should freeze returned state', function () {
    const state = getState(0);
    const newState = reduce(state, 'foobar');
    expect(Object.isFrozen(newState)).to.equal(true);
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

    describe('page down', function () {
      it('should move term height down', function () {
        let state: RebaseState | Readonly<RebaseState> = getState({
          lines: 10,
          cursor: 0,
          height: 5
        });
        state = reduce(state as RebaseState, 'pageDown');
        expect(state.cursor.pos).to.equal(5);
      });
    });

    describe('page up', function () {
      it('should move term height up', function () {
        let state: RebaseState | Readonly<RebaseState> = getState({
          lines: 10,
          cursor: 9,
          height: 5
        });
        state = reduce(state as RebaseState, 'pageUp');
        expect(state.cursor.pos).to.equal(4);
      });
    });

    describe('to end', function () {
      it('should move to the last line', function () {
        const state = getState(3, 0);
        const newState = reduce(state, 'end');
        expect(newState.cursor.pos).to.equal(2);
        expect(newState.cursor.from).to.equal(2);
      });
      it('should do nothing on the last line', function () {
        const state = getState(3, 2);
        const newState = reduce(state, 'end');
        expect(newState).to.equal(state);
      });
    });

    describe('home', function () {
      it('should move to the first line', function () {
        const state = getState(3, 2);
        const newState = reduce(state, 'home');
        expect(newState.cursor.pos).to.equal(0);
        expect(newState.cursor.from).to.equal(0);
      });
      it('should do nothing on the first line', function () {
        const state = getState(3, 0);
        const newState = reduce(state, 'home');
        expect(newState).to.equal(state);
      });
    });
  });

  describe('select', function () {

    describe('down', function () {
      it('should increase selection', function () {
        let state: RebaseState | Readonly<RebaseState> = getState(3, 0);
        state = reduce(state as RebaseState, 'selectDown');
        state = reduce(state as RebaseState, 'selectDown');
        expect(state.cursor).to.deep.equal({
          from: 0,
          pos: 2
        });
      });
      it('should do nothing when on last line', function () {
        const state = getState(2, 1);
        const newState = reduce(state, 'selectDown');
        expect(newState).to.equal(state);
      });
      it('should reduce selection', function () {
        const state = getState(3, {
          from: 2,
          pos: 0
        });
        const newState = reduce(state, 'selectDown');
        expect(newState.cursor).to.deep.equal({
          from: 2,
          pos: 1
        });
      });
    });

    describe('up', function () {
      it('should increase selection', function () {
        let state: RebaseState | Readonly<RebaseState> = getState(3, 2);
        state = reduce(state as RebaseState, 'selectUp');
        state = reduce(state as RebaseState, 'selectUp');
        expect(state.cursor).to.deep.equal({
          from: 2,
          pos: 0
        });
      });
      it('should do nothing when on last line', function () {
        const state = getState(2, 0);
        const newState = reduce(state, 'selectUp');
        expect(newState).to.equal(state);
      });
      it('should reduce selection', function () {
        const state = getState(2, {
          from: 0,
          pos: 2
        });
        const newState = reduce(state, 'selectUp');
        expect(newState.cursor).to.deep.equal({
          from: 0,
          pos: 1
        });
      });
    });


    describe('home', function () {
      it('should do nothing if on top', function () {
        const state = getState(3, 0);
        const newState = reduce(state, 'selectHome');
        expect(state).to.equal(newState);
      });

      it('should select to top', function () {
        const state = getState(3, 2);
        const newState = reduce(state, 'selectHome');
        expect(newState.cursor).to.deep.equal({
          from: 2,
          pos: 0
        });
      });
    });

    describe('end', function () {
      it('should do nothing if on bottom', function () {
        const state = getState(3, 2);
        const newState = reduce(state, 'selectEnd');
        expect(state).to.equal(newState);
      });

      it('should select to end', function () {
        const state = getState(3, 0);
        const newState = reduce(state, 'selectEnd');
        expect(newState.cursor).to.deep.equal({
          from: 0,
          pos: 2
        });
      });
    });

    describe('page down', function () {
      it('should select page down', function () {
        const state = getState({
          lines: 5,
          cursor: 0,
          height: 3
        });
        const newState = reduce(state, 'selectPageDown');
        expect(newState.cursor).to.deep.equal({
          from: 0,
          pos: 3
        });
      });
    });

    describe('page up', function () {
      it('should select page down', function () {
        const state = getState({
          lines: 5,
          cursor: 4,
          height: 3
        });
        const newState = reduce(state, 'selectPageUp');
        expect(newState.cursor).to.deep.equal({
          from: 4,
          pos: 1
        });
      });
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
        action: 'noop',
        hash: '',
        message: ''
      }], 0);
      const newState = reduce(state, 'pick');
      expect(newState).to.equal(state);
    });

    ['break', 'update-ref', 'label', 'reset', 'merge', '# Comment'].forEach(function (action) {
      it(`should not allow pick if ${action} line`, function () {
        const state = getState([{
          action: action,
          hash: 'some text',
          message: ''
        }], 0);
        const newState = reduce(state, 'pick');
        expect(newState.lines[0]).to.equal(state.lines[0]);
      });

      it(`should delete ${action} line`, function () {
        const state = getState([{
          action: action,
          hash: 'some text',
          message: ''
        }], 0);
        const newState = reduce(state, 'drop');
        expect(newState.lines).to.be.empty;
      });
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

    it('should change on fixup - alternate keybinds with flag', function () {
      const state = getState(3, 1);
      let newState = reduce(state, 'fixup -C');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1].action).to.equal('fixup -C');
      expect(newState.lines[1].message).to.equal(state.lines[1].message);
      expect(newState.lines[1]).not.to.equal(state.lines[1]);
      expect(newState.lines[2]).to.equal(state.lines[2]);
      expect(newState.otherStateVar).to.equal(state.otherStateVar);
      newState = reduce(state, 'fixup -c');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1].action).to.equal('fixup -c');
      expect(newState.lines[1].message).to.equal(state.lines[1].message);
      expect(newState.lines[1]).not.to.equal(state.lines[1]);
      expect(newState.lines[2]).to.equal(state.lines[2]);
      expect(newState.otherStateVar).to.equal(state.otherStateVar);
    });

    it('should change entire selection', function () {
      const state = getState([{
        action: 'pick',
        hash: '123',
        message: ''
      }, {
        action: 'fixup',
        hash: '123',
        message: ''
      }, {
        action: 'pick',
        hash: '123',
        message: ''
      }], {
        from: 2,
        pos: 1
      });
      const newState = reduce(state, 'fixup');
      expect(newState.lines[0].action).to.equal('pick');
      expect(newState.lines[1].action).to.equal('fixup');
      expect(newState.lines[2].action).to.equal('fixup');
    });

  });

  describe('break', function () {

    it('should add a new line with break', function () {
      const state = getState(1, 0);
      const newState = reduce(state, 'break');
      expect(newState.lines.length).to.equal(2);
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1].action).to.equal('break');
      expect(newState.cursor.pos).to.equal(1);
    });

    it('should remove break on drop', function () {
      const state = getState(1, 0);
      let newState = reduce(state, 'break');
      newState = reduce(newState as RebaseState, 'drop');
      expect(newState.lines.length).to.equal(1);
      expect(newState.lines[0]).to.equal(state.lines[0]);
    });

    it('should ignore actions on break', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'break');
      const newState = reduce(state as RebaseState, 'pick');
      expect(newState).to.equal(state);
    });

    it('should not add multiple breaks', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'break');
      const newState = reduce(state as RebaseState, 'break');
      expect(newState).to.equal(state);
    });

    it('should not add multiple breaks 2', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'up');
      const newState = reduce(state as RebaseState, 'break');
      expect(newState.lines).to.equal(state.lines);
      expect(newState.cursor.from).to.equal(1);
      expect(newState.cursor.pos).to.equal(1);
    });

    it('should drop multiple breaks', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(4, 0);
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'down');
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'selectHome');
      const newState = reduce(state as RebaseState, 'drop');
      expect(newState.lines.length).to.equal(4);
      expect(newState.lines[0].action).to.equal('drop');
      expect(newState.lines[1].action).to.equal('drop');
      expect(newState.lines[2].action).to.equal('pick');
      expect(newState.lines[3].action).to.equal('pick');
    });

    it('should move cursor on drop', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'drop');
      expect(state.cursor.from).to.equal(0);
      expect(state.cursor.pos).to.equal(0);
    });

    it('should move up selection on drop', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(2, 1);
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'selectUp');
      state = reduce(state as RebaseState, 'selectUp');
      expect(state.cursor.from).to.equal(2);
      expect(state.cursor.pos).to.equal(0);
      state = reduce(state as RebaseState, 'drop');
      expect(state.cursor.from).to.equal(1);
      expect(state.cursor.pos).to.equal(0);
    });

    it('should move down selection on drop', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(2, 1);
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'home');
      state = reduce(state as RebaseState, 'selectDown');
      state = reduce(state as RebaseState, 'selectDown');
      expect(state.cursor.from).to.equal(0);
      expect(state.cursor.pos).to.equal(2);
      state = reduce(state as RebaseState, 'drop');
      expect(state.cursor.from).to.equal(0);
      expect(state.cursor.pos).to.equal(1);
    });

    it('should only drop selected break', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(4, 0);
      state = reduce(state as RebaseState, 'break');
      state = reduce(state as RebaseState, 'down');
      state = reduce(state as RebaseState, 'break');
      const newState = reduce(state as RebaseState, 'drop');
      expect(newState.lines.length).to.equal(5);
      expect(newState.lines[0].action).to.equal('pick');
      expect(newState.lines[1].action).to.equal('break');
      expect(newState.lines[2].action).to.equal('pick');
      expect(newState.lines[3].action).to.equal('pick');
      expect(newState.lines[4].action).to.equal('pick');
    });
  });

  describe('undo', function () {
    it('should not undo when nothing has changed', function () {
      const state = getState(1, 0);
      const newState = reduce(state, 'undo');
      expect(newState).to.equal(state);
    });

    it('should undo action change', function () {
      const state = getState(1, 0);
      let newState = reduce(state, 'fixup');
      newState = reduce(newState as RebaseState, 'undo');
      expect(newState.lines).to.equal(state.lines);
    });

    it('should not undo on move', function () {
      const state = getState(2, 0);
      let newState = reduce(state, 'down');
      newState = reduce(newState as RebaseState, 'undo');
      expect(newState.lines).to.equal(state.lines);
      expect(newState.cursor).not.to.equal(state.cursor);
    });

    it('should update cursor on undo', function () {
      const state = getState(2, 0);
      let newState = reduce(state, 'fixup');
      newState = reduce(newState as RebaseState, 'down');
      newState = reduce(newState as RebaseState, 'undo');
      expect(newState.lines).to.equal(state.lines);
      expect(newState.cursor).to.equal(state.cursor);
    });

    it('should undo multiple actions', function () {
      const state = getState(1, 0);
      let newState = reduce(state, 'fixup');
      newState = reduce(newState as RebaseState, 'reword');
      expect(newState.lines[0].action).to.equal('reword');
      newState = reduce(newState as RebaseState, 'undo');
      expect(newState.lines[0].action).to.equal('fixup');
      newState = reduce(newState as RebaseState, 'undo');
      expect(newState.lines).to.equal(state.lines);
    });
  });

  describe('redo', function () {
    it('should not undo when nothing has changed', function () {
      const state = getState(1, 0);
      const newState = reduce(state, 'redo');
      expect(newState).to.equal(state);
    });

    it('should redo change', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'fixup');
      let newState = reduce(state as RebaseState, 'undo');
      newState = reduce(newState as RebaseState, 'redo');
      expect(newState.lines).to.equal(state.lines);
    });

    it('should undo redo change', function () {
      const state = getState(1, 0);
      let newState = reduce(state, 'fixup');
      newState = reduce(newState as RebaseState, 'undo');
      newState = reduce(newState as RebaseState, 'redo');
      newState = reduce(newState as RebaseState, 'undo');
      expect(newState.lines).to.equal(state.lines);
    });

    it('should clear redo stack on change', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'fixup');
      state = reduce(state as RebaseState, 'reword');
      state = reduce(state as RebaseState, 'undo');
      state = reduce(state as RebaseState, 'squash');
      const newState = reduce(state as RebaseState, 'redo');
      expect(newState).to.equal(state);
    });
  });

  describe('resize', function () {
    it('should record height', function () {
      let state: RebaseState | Readonly<RebaseState> = getState(1, 0);
      state = reduce(state as RebaseState, 'resize', 10);
      expect(state.height).to.equal(10);
    });
  });

  describe('corner cases', function () {

    it('should add break after last line', function () {
      const state = getState(3, 2);
      const newState = reduce(state, 'break');
      expect(newState.lines.length).to.equal(4);
      expect(newState.lines[3].action).to.equal('break');
      expect(newState.cursor.pos).to.equal(3);
    });

    it('should drop all non-editable lines in selection', function () {
      const state = getState([
        { action: 'update-ref', hash: 'refs/heads/branch', message: '' },
        { action: 'break', hash: '', message: '' },
        { action: 'label', hash: 'onto', message: '' }
      ], { from: 0, pos: 2 });
      const newState = reduce(state, 'drop');
      expect(newState.lines).to.be.empty;
    });

    it('should handle drop of non-editable lines with mixed selection', function () {
      const state = getState([
        { action: 'pick', hash: '123', message: 'First' },
        { action: 'update-ref', hash: 'refs/heads/branch', message: '' },
        { action: 'pick', hash: '456', message: 'Third' }
      ], { from: 0, pos: 2 });
      const newState = reduce(state, 'drop');
      expect(newState.lines.length).to.equal(2);
      expect(newState.lines[0].action).to.equal('drop');
      expect(newState.lines[1].action).to.equal('drop');
    });

    it('should handle moveDown with reversed selection', function () {
      const state = getState(4, { from: 2, pos: 1 });
      const newState = reduce(state, 'moveDown');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1]).to.equal(state.lines[3]);
      expect(newState.lines[2]).to.equal(state.lines[1]);
      expect(newState.lines[3]).to.equal(state.lines[2]);
      expect(newState.cursor.from).to.equal(3);
      expect(newState.cursor.pos).to.equal(2);
    });

    it('should handle moveUp with reversed selection', function () {
      const state = getState(4, { from: 3, pos: 2 });
      const newState = reduce(state, 'moveUp');
      expect(newState.lines[0]).to.equal(state.lines[0]);
      expect(newState.lines[1]).to.equal(state.lines[2]);
      expect(newState.lines[2]).to.equal(state.lines[3]);
      expect(newState.lines[3]).to.equal(state.lines[1]);
      expect(newState.cursor.from).to.equal(2);
      expect(newState.cursor.pos).to.equal(1);
    });

    it('should undo break insertion then drop', function () {
      const state = getState(2, 0);
      let s = reduce(state, 'break') as RebaseState;
      expect(s.lines.length).to.equal(3);
      s = reduce(s, 'drop') as RebaseState;
      expect(s.lines.length).to.equal(2);
      s = reduce(s, 'undo') as RebaseState;
      expect(s.lines.length).to.equal(3);
      expect(s.lines[1].action).to.equal('break');
      s = reduce(s, 'undo') as RebaseState;
      expect(s.lines.length).to.equal(2);
      expect(s.lines).to.equal(state.lines);
    });

    it('should handle pageDown with height 0', function () {
      const state = getState({ lines: [
        { action: 'pick', hash: '123', message: 'First' },
        { action: 'pick', hash: '456', message: 'Second' }
      ], cursor: 0, height: 0 });
      const newState = reduce(state, 'pageDown');
      expect(newState).to.equal(state);
    });

    it('should handle pageUp with height 0', function () {
      const state = getState({ lines: [
        { action: 'pick', hash: '123', message: 'First' },
        { action: 'pick', hash: '456', message: 'Second' }
      ], cursor: 1, height: 0 });
      const newState = reduce(state, 'pageUp');
      expect(newState).to.equal(state);
    });

    it('should handle single line list', function () {
      const state = getState(1, 0);
      expect(reduce(state, 'down')).to.equal(state);
      expect(reduce(state, 'up')).to.equal(state);
      expect(reduce(state, 'moveDown')).to.equal(state);
      expect(reduce(state, 'moveUp')).to.equal(state);
      expect(reduce(state, 'selectDown')).to.equal(state);
      expect(reduce(state, 'selectUp')).to.equal(state);
    });

  });

  describe('reword mode', function () {

    it('should enter reword mode when pressing r on a reworded line', function () {
      const state = getState([{ action: 'reworded', hash: 'abc123', message: 'Edited message\nSecond line' }], 0);
      const newState = reduce(state, 'reword');
      expect(newState.rewordState).to.deep.equal({
        message: 'Edited message\nSecond line',
        originalMessage: 'Edited message\nSecond line',
        lineIndex: 0,
        cursorPos: 26
      });
    });

    it('should enter reword mode on double-press of reword', function () {
      const state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0);
      const newState = reduce(state, 'reword');
      expect(newState.rewordState).to.deep.equal({
        message: 'My commit',
        originalMessage: 'My commit',
        lineIndex: 0,
        cursorPos: 9
      });
    });

    it('should not enter reword mode on first press', function () {
      const state = getState([{ action: 'pick', hash: 'abc123', message: 'My commit' }], 0);
      const newState = reduce(state, 'reword');
      expect(newState.rewordState).to.be.undefined;
      expect(newState.lines[0].action).to.equal('reword');
    });

    it('should delegate text editing to reword-reducer when in reword mode', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      expect(state.rewordState).to.exist;
      state = reduce(state, 'rewordChar', '!') as RebaseState;
      expect(state.rewordState!.message).to.equal('My commit!');
    });

    it('should commit message and set action to reworded on rewordDone', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      state = reduce(state, 'rewordChar', '!') as RebaseState;
      state = reduce(state, 'rewordDone') as RebaseState;
      expect(state.rewordState).to.be.undefined;
      expect(state.lines[0].action).to.equal('reworded');
      expect(state.lines[0].message).to.equal('My commit!');
    });

    it('should push undo entry on rewordDone', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      state = reduce(state, 'rewordChar', '!') as RebaseState;
      const beforeDone = state;
      state = reduce(state, 'rewordDone') as RebaseState;
      const undoStack = state.undoStack!;
      expect(undoStack.length).to.be.greaterThan(0);
      const undoState = reduce(state, 'undo') as RebaseState;
      expect(undoState.lines[0].action).to.equal(beforeDone.lines[0].action);
    });

    it('should clear reword mode before routing normal actions', function () {
      const state = getState([{ action: 'pick', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      const newState = reduce(state, 'down') as RebaseState;
      expect(newState.rewordState).to.be.undefined;
    });

    it('should cancel reword mode and restore original action/message on rewordCancel', function () {
      let state = getState([
        { action: 'reword', hash: 'abc123', message: 'My commit' },
        { action: 'pick', hash: 'def456', message: 'Other commit' }
      ], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      state = reduce(state, 'rewordChar', '!') as RebaseState;
      expect(state.rewordState!.message).to.equal('My commit!');
      state = reduce(state, 'rewordCancel') as RebaseState;
      expect(state.rewordState).to.be.undefined;
      expect(state.lines[0].action).to.equal('reword');
      expect(state.lines[0].message).to.equal('My commit');
      expect(state.lines[1].message).to.equal('Other commit');
    });

    it('should restore original message on rewordUndo without exiting', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      state = reduce(state, 'rewordChar', '!') as RebaseState;
      expect(state.rewordState!.message).to.equal('My commit!');
      state = reduce(state, 'rewordUndo') as RebaseState;
      expect(state.rewordState).to.exist;
      expect(state.rewordState!.message).to.equal('My commit');
      expect(state.rewordState!.cursorPos).to.equal(9);
    });

    it('should return same state when reword-reducer handles unknown action in reword mode', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      expect(state.rewordState).to.exist;
      const newState = reduce(state, 'unknownAction');
      expect(newState).to.equal(state);
    });

    it('should store originalMessage on line when rewordDone', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      state = reduce(state, 'rewordChar', '!') as RebaseState;
      state = reduce(state, 'rewordDone') as RebaseState;
      expect(state.lines[0].originalMessage).to.equal('My commit');
    });

    it('should restore originalMessage when switching action away from reworded', function () {
      let state = getState([{ action: 'reword', hash: 'abc123', message: 'My commit' }], 0) as RebaseState;
      state = reduce(state, 'reword') as RebaseState;
      state = reduce(state, 'rewordDone') as RebaseState;
      // Simulate full message being set (as async git fetch would do)
      state = { ...state, lines: state.lines.map((l, i) => i === 0 ? { ...l, message: '# This is a combination\nMy commit' } : l) };
      state = reduce(state, 'pick') as RebaseState;
      expect(state.lines[0].action).to.equal('pick');
      expect(state.lines[0].message).to.equal('My commit');
      expect(state.lines[0].originalMessage).to.be.undefined;
    });

  });

});
