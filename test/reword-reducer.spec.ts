import { expect } from 'chai';
import rewordReducer from '../src/reword-reducer';
import { RewordModeState } from '../src/types';

function state(message: string, cursorPos?: number): RewordModeState {
  return {
    message,
    lineIndex: 0,
    cursorPos: cursorPos ?? message.length
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

  describe('unknown action', function () {
    it('should return state unchanged', function () {
      const s = state('hello', 3);
      const result = rewordReducer(s, 'unknownAction');
      expect(result).to.equal(s);
    });
  });

});
