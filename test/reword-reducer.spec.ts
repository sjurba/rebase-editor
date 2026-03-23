import { expect } from 'chai';
import rewordReducer from '../src/reword-reducer';
import { RewordModeState } from '../src/types';

function state(message: string, cursorPos?: number, selectAnchor?: number): RewordModeState {
  return {
    message,
    originalMessage: message,
    lineIndex: 0,
    cursorPos: cursorPos ?? message.length,
    selectAnchor
  };
}

describe('Reword reducer', function () {

  describe('rewordChar', function () {
    it('should insert character at cursor position', function () {
      const s = rewordReducer(state('hello', 3), 'rewordChar', 'X');
      expect(s.message).to.equal('helXlo');
      expect(s.cursorPos).to.equal(4);
    });

    it('should append character at end', function () {
      const s = rewordReducer(state('hello'), 'rewordChar', '!');
      expect(s.message).to.equal('hello!');
      expect(s.cursorPos).to.equal(6);
    });
  });

  describe('rewordEnter', function () {
    it('should insert newline at cursor', function () {
      const s = rewordReducer(state('hello world', 5), 'rewordEnter');
      expect(s.message).to.equal('hello\n world');
      expect(s.cursorPos).to.equal(6);
    });
  });

  describe('rewordBackspace', function () {
    it('should remove character before cursor', function () {
      const s = rewordReducer(state('hello', 3), 'rewordBackspace');
      expect(s.message).to.equal('helo');
      expect(s.cursorPos).to.equal(2);
    });

    it('should do nothing at position 0', function () {
      const s = rewordReducer(state('hello', 0), 'rewordBackspace');
      expect(s.message).to.equal('hello');
      expect(s.cursorPos).to.equal(0);
    });

    it('should remove newline', function () {
      const s = rewordReducer(state('hello\nworld', 6), 'rewordBackspace');
      expect(s.message).to.equal('helloworld');
      expect(s.cursorPos).to.equal(5);
    });
  });

  describe('rewordDelete', function () {
    it('should remove character at cursor', function () {
      const s = rewordReducer(state('hello', 2), 'rewordDelete');
      expect(s.message).to.equal('helo');
      expect(s.cursorPos).to.equal(2);
    });

    it('should do nothing at end of message', function () {
      const s = rewordReducer(state('hello'), 'rewordDelete');
      expect(s.message).to.equal('hello');
    });
  });

  describe('rewordLeft', function () {
    it('should move cursor left', function () {
      const s = rewordReducer(state('hello', 3), 'rewordLeft');
      expect(s.cursorPos).to.equal(2);
    });

    it('should clamp at 0', function () {
      const s = rewordReducer(state('hello', 0), 'rewordLeft');
      expect(s.cursorPos).to.equal(0);
    });
  });

  describe('rewordRight', function () {
    it('should move cursor right', function () {
      const s = rewordReducer(state('hello', 2), 'rewordRight');
      expect(s.cursorPos).to.equal(3);
    });

    it('should clamp at message length', function () {
      const s = rewordReducer(state('hello'), 'rewordRight');
      expect(s.cursorPos).to.equal(5);
    });
  });

  describe('rewordHome', function () {
    it('should move to start of current line', function () {
      const s = rewordReducer(state('hello\nworld', 8), 'rewordHome');
      expect(s.cursorPos).to.equal(6); // start of 'world'
    });

    it('should move to start of first line', function () {
      const s = rewordReducer(state('hello', 3), 'rewordHome');
      expect(s.cursorPos).to.equal(0);
    });
  });

  describe('rewordEnd', function () {
    it('should move to end of current line', function () {
      const s = rewordReducer(state('hello\nworld', 6), 'rewordEnd');
      expect(s.cursorPos).to.equal(11); // end of 'world'
    });

    it('should move to end of first line', function () {
      const s = rewordReducer(state('hello\nworld', 2), 'rewordEnd');
      expect(s.cursorPos).to.equal(5); // end of 'hello'
    });
  });

  describe('rewordUp', function () {
    it('should move cursor to same column on previous line', function () {
      const s = rewordReducer(state('hello\nworld', 8), 'rewordUp'); // col 2 on 'world'
      expect(s.cursorPos).to.equal(2); // col 2 on 'hello'
    });

    it('should clamp to end of shorter previous line', function () {
      const s = rewordReducer(state('hi\nworld', 7), 'rewordUp'); // col 3 on 'world'
      expect(s.cursorPos).to.equal(2); // end of 'hi'
    });

    it('should do nothing on first line', function () {
      const s = rewordReducer(state('hello', 3), 'rewordUp');
      expect(s.cursorPos).to.equal(3);
    });
  });

  describe('rewordDown', function () {
    it('should move cursor to same column on next line', function () {
      const s = rewordReducer(state('hello\nworld', 2), 'rewordDown'); // col 2 on 'hello'
      expect(s.cursorPos).to.equal(8); // col 2 on 'world'
    });

    it('should clamp to end of shorter next line', function () {
      const s = rewordReducer(state('hello\nhi', 4), 'rewordDown'); // col 4 on 'hello'
      expect(s.cursorPos).to.equal(8); // end of 'hi'
    });

    it('should do nothing on last line', function () {
      const s = rewordReducer(state('hello\nworld', 8), 'rewordDown');
      expect(s.cursorPos).to.equal(8);
    });
  });

  describe('selection', function () {
    describe('rewordSelectAll', function () {
      it('should set selectAnchor to 0 and cursorPos to end', function () {
        const s = rewordReducer(state('hello', 2), 'rewordSelectAll');
        expect(s.selectAnchor).to.equal(0);
        expect(s.cursorPos).to.equal(5);
      });
    });

    describe('rewordShiftRight', function () {
      it('should set anchor at current pos and move cursor right', function () {
        const s = rewordReducer(state('hello', 2), 'rewordShiftRight');
        expect(s.selectAnchor).to.equal(2);
        expect(s.cursorPos).to.equal(3);
      });

      it('should extend existing selection', function () {
        const s = rewordReducer(state('hello', 3, 1), 'rewordShiftRight');
        expect(s.selectAnchor).to.equal(1);
        expect(s.cursorPos).to.equal(4);
      });

      it('should do nothing at end of message', function () {
        const s0 = state('hello', 5);
        expect(rewordReducer(s0, 'rewordShiftRight')).to.equal(s0);
      });
    });

    describe('rewordShiftLeft', function () {
      it('should set anchor at current pos and move cursor left', function () {
        const s = rewordReducer(state('hello', 3), 'rewordShiftLeft');
        expect(s.selectAnchor).to.equal(3);
        expect(s.cursorPos).to.equal(2);
      });

      it('should clamp at start', function () {
        const s = rewordReducer(state('hello', 0), 'rewordShiftLeft');
        expect(s.cursorPos).to.equal(0);
        expect(s.selectAnchor).to.be.undefined; // state unchanged — no phantom anchor
      });
    });

    describe('rewordShiftDown', function () {
      it('should set anchor and move cursor down', function () {
        const s = rewordReducer(state('hello\nworld', 2), 'rewordShiftDown');
        expect(s.selectAnchor).to.equal(2);
        expect(s.cursorPos).to.equal(8); // col 2 on 'world'
      });

      it('should do nothing on last line, preserving existing selection', function () {
        // On last line with no selection — state returned unchanged
        const s0 = state('hello\nworld', 8);
        expect(rewordReducer(s0, 'rewordShiftDown')).to.equal(s0);
        // On last line with existing selection — state still unchanged
        const withSel = state('hello\nworld', 8, 2);
        expect(rewordReducer(withSel, 'rewordShiftDown')).to.equal(withSel);
      });
    });

    describe('rewordShiftUp', function () {
      it('should set anchor and move cursor up', function () {
        const s = rewordReducer(state('hello\nworld', 8), 'rewordShiftUp');
        expect(s.selectAnchor).to.equal(8);
        expect(s.cursorPos).to.equal(2); // col 2 on 'hello'
      });

      it('should do nothing on first line', function () {
        const s0 = state('hello\nworld', 2);
        expect(rewordReducer(s0, 'rewordShiftUp')).to.equal(s0);
      });
    });

    describe('clearing selection on non-shift moves', function () {
      it('rewordLeft should clear selection', function () {
        const s = rewordReducer(state('hello', 3, 1), 'rewordLeft');
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordRight should clear selection', function () {
        const s = rewordReducer(state('hello', 3, 1), 'rewordRight');
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordUp should clear selection', function () {
        const s = rewordReducer(state('hello\nworld', 8, 2), 'rewordUp');
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordDown should clear selection', function () {
        const s = rewordReducer(state('hello\nworld', 2, 0), 'rewordDown');
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordHome should clear selection', function () {
        const s = rewordReducer(state('hello', 3, 1), 'rewordHome');
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordEnd should clear selection', function () {
        const s = rewordReducer(state('hello', 2, 0), 'rewordEnd');
        expect(s.selectAnchor).to.be.undefined;
      });
    });

    describe('deleting selection', function () {
      it('rewordBackspace should delete selection', function () {
        const s = rewordReducer(state('hello', 4, 1), 'rewordBackspace'); // selects 'ell'
        expect(s.message).to.equal('ho');
        expect(s.cursorPos).to.equal(1);
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordDelete should delete selection', function () {
        const s = rewordReducer(state('hello', 4, 1), 'rewordDelete');
        expect(s.message).to.equal('ho');
        expect(s.cursorPos).to.equal(1);
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordChar should replace selection with typed character', function () {
        const s = rewordReducer(state('hello', 4, 1), 'rewordChar', 'x');
        expect(s.message).to.equal('hxo');
        expect(s.cursorPos).to.equal(2);
        expect(s.selectAnchor).to.be.undefined;
      });

      it('rewordEnter should replace selection with newline', function () {
        const s = rewordReducer(state('hello', 4, 1), 'rewordEnter');
        expect(s.message).to.equal('h\no');
        expect(s.cursorPos).to.equal(2);
        expect(s.selectAnchor).to.be.undefined;
      });

      it('should work with reversed selection (anchor > cursor)', function () {
        const s = rewordReducer(state('hello', 1, 4), 'rewordDelete'); // anchor=4, cursor=1 → delete [1,4)
        expect(s.message).to.equal('ho');
        expect(s.cursorPos).to.equal(1);
      });
    });

    describe('rewordUndo clears selection', function () {
      it('should clear selectAnchor on undo', function () {
        const s = rewordReducer(state('hello', 3, 1), 'rewordUndo');
        expect(s.selectAnchor).to.be.undefined;
      });

      it('should restore fullMessage when available', function () {
        const base = state('edited message', 5);
        const withFull: RewordModeState = { ...base, fullMessage: '# Full\nOriginal message' };
        const s = rewordReducer(withFull, 'rewordUndo');
        expect(s.message).to.equal('# Full\nOriginal message');
        expect(s.cursorPos).to.equal('# Full\nOriginal message'.length);
      });

      it('should fall back to originalMessage when fullMessage is absent', function () {
        const s = rewordReducer(state('edited', 3), 'rewordUndo');
        expect(s.message).to.equal('edited'); // originalMessage === message in state()
      });
    });
  });

  describe('rewordDeleteLine', function () {
    it('should delete the current line and the following newline', function () {
      const s = rewordReducer(state('hello\nworld', 2), 'rewordDeleteLine');
      expect(s.message).to.equal('world');
      expect(s.cursorPos).to.equal(0);
    });

    it('should delete last line including preceding newline', function () {
      const s = rewordReducer(state('hello\nworld', 8), 'rewordDeleteLine');
      expect(s.message).to.equal('hello');
      expect(s.cursorPos).to.equal(5);
    });

    it('should clear message when only one line', function () {
      const s = rewordReducer(state('hello', 3), 'rewordDeleteLine');
      expect(s.message).to.equal('');
      expect(s.cursorPos).to.equal(0);
    });

    it('should delete a middle line', function () {
      const s = rewordReducer(state('aaa\nbbb\nccc', 5), 'rewordDeleteLine');
      expect(s.message).to.equal('aaa\nccc');
      expect(s.cursorPos).to.equal(4);
    });

    it('should clear selection', function () {
      const s = rewordReducer(state('hello\nworld', 2, 1), 'rewordDeleteLine');
      expect(s.selectAnchor).to.be.undefined;
    });
  });

  describe('unknown action', function () {
    it('should return state unchanged', function () {
      const s = state('hello', 3);
      const result = rewordReducer(s, 'unknownAction');
      expect(result).to.equal(s);
    });
  });

});
