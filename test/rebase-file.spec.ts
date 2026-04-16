import rebaseFile from '../src/rebase-file';
import keyBindings from '../src/key-bindings';
import { expect, assert } from 'chai';
import { RebaseState } from '../src/types';

function trim(str: string): string {
  return str
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

describe('Rebase file', function () {
  describe('to state', function () {
    it('should parse lines', function () {
      const state = rebaseFile.toState('pick ad3d434 Hello message');
      expect(state.lines).to.deep.equal([
        {
          action: 'pick',
          hash: 'ad3d434',
          message: 'Hello message',
        },
      ]);
    });

    it('should parse lines with Windows-style CRLF line endings', function () {
      const state = rebaseFile.toState('pick ad3d434 Hello message\r\npick b1c2d3e Goodbye message');
      expect(state.lines).to.deep.equal([
        { action: 'pick', hash: 'ad3d434', message: 'Hello message' },
        { action: 'pick', hash: 'b1c2d3e', message: 'Goodbye message' },
      ]);
    });

    it('should parse info lines', function () {
      const state = rebaseFile.toState(
        `pick ad3d434 Hello message

          # Info here`,
      );
      expect(state.info).to.deep.equal(['# Info here']);
    });

    it('should parse noop', function () {
      const file = trim(`
          noop

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(rebaseFile.toFile(state)).to.equal(file);
    });

    it('should should remove blank lines', function () {
      const file = trim(`update-ref refs/heads/my-branch
      
      pick 123 First
      
      # Info here`);
      const state = rebaseFile.toState(file);
      expect(rebaseFile.toFile(state)).to.equal(
        trim(`update-ref refs/heads/my-branch
      pick 123 First
      
      # Info here`),
      );
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

    it('should parse --rebase-merges', function () {
      const file = trim(`
          label onto
          # Branch: merge
          reset onto
          pick 345 Last
          label branch
          pick 123 First
          label merge
          reset branch
          merge -C 234 merge # Merge branch 'merge' into first
          
          # Info here`);
      const state = rebaseFile.toState(file);
      expect(rebaseFile.toFile(state)).to.equal(file);
    });

    it('should print key bindings as help', async function () {
      const state = rebaseFile.toState('pick ad3d434 Hello message');
      const bindings = await keyBindings();
      assert.isDefined(state.extraInfo);
      expect(state.extraInfo(bindings)).to.deep.equal([
        '# NOTE: execute (x) is not supported by rebase editor',
        '# You cannot add update-ref (u), label (l), reset (t) or merge (m), but you can move them around',
        '# Press the reword key twice to open an inline message editor (ENTER=new line, ESC=save).',
        '#',
        '# Rebase Editor Commands:',
        '# UP = Moves cursor up',
        '# DOWN = Moves cursor down',
        '# SHIFT_DOWN, SHIFT_RIGHT = Select one line down',
        '# SHIFT_UP, SHIFT_LEFT = Select one line up',
        '# RIGHT, CTRL_DOWN = Moves current line down one position',
        '# LEFT, CTRL_UP = Moves current line up one position',
        '# z, CTRL_Z = Undo',
        '# Z, CTRL_SHIFT_Z = Redo',
        '# q, ENTER = Save and quit',
        '# CTRL_C, ESCAPE = Abort',
        '# ALT_F = fixup -c',
        '# CTRL_F = fixup -C',
        '# HOME, END, PAGE_UP, PAGE_DOWN = Moves cursor and selects with SHIFT',
      ]);
    });
  });

  it('to file', function () {
    const state = {
      lines: [
        {
          action: 'pick',
          hash: 'ad3d434',
          message: 'Hello message',
        },
        {
          action: 'fixup',
          hash: 'bf44d54',
          message: 'Hello 2 message',
        },
      ],
      info: ['# Info'],
    } as unknown as RebaseState;
    const file = rebaseFile.toFile(state);
    expect(file).to.equal(
      trim(`
      pick ad3d434 Hello message
      fixup bf44d54 Hello 2 message

      # Info
    `),
    );
  });

  it('should only write first line of message for non-reworded lines', function () {
    const state = {
      lines: [
        {
          action: 'pick',
          hash: 'ad3d434',
          message: 'Hello message\nSecond line',
        },
      ],
      info: [],
    } as unknown as RebaseState;
    expect(rebaseFile.toFile(state)).to.equal('pick ad3d434 Hello message\n');
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

  describe('corner cases', function () {
    it('should parse update-ref lines', function () {
      const file = trim(`
          pick 123 First commit
          update-ref refs/heads/my-branch

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(state.lines[1].action).to.equal('update-ref');
      expect(state.lines[1].hash).to.equal('refs/heads/my-branch');
      expect(state.lines[1].message).to.equal('');
    });

    it('should roundtrip update-ref lines through toFile', function () {
      const file = trim(`
          pick 123 First commit
          update-ref refs/heads/my-branch

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(rebaseFile.toFile(state)).to.equal(file);
    });

    it('should roundtrip break lines through toFile', function () {
      const file = trim(`
          pick 123 First commit
          break

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(state.lines[1].action).to.equal('break');
      expect(rebaseFile.toFile(state)).to.equal(file);
    });

    it('should parse file with only comments after first line', function () {
      const file = trim(`
          noop

          # Rebase info
          # More info`);
      const state = rebaseFile.toState(file);
      expect(state.lines.length).to.equal(1);
      expect(state.lines[0].action).to.equal('noop');
      expect(state.info.length).to.equal(2);
    });

    it('should parse Branch: comment as inline', function () {
      const file = trim(`
          label onto
          # Branch: feature
          pick 123 First

          # Info here`);
      const state = rebaseFile.toState(file);
      expect(state.lines[1].action).to.equal('# Branch:');
      expect(state.lines[1].hash).to.equal('feature');
    });

    it('should return empty string for undefined state in toFile', function () {
      expect(rebaseFile.toFile(undefined)).to.equal('');
    });

    it('should serialize reworded lines as pick + exec git commit --amend', function () {
      const state = {
        lines: [
          {
            action: 'reworded',
            hash: 'abc123',
            message: 'New commit message',
          },
        ],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('pick abc123 # New commit message');
      expect(file).to.include("exec git commit --amend -m 'New commit message'");
    });

    it('should serialize reworded lines with multiple message paragraphs', function () {
      const state = {
        lines: [
          {
            action: 'reworded',
            hash: 'abc123',
            message: 'First line\n\nSecond paragraph',
          },
        ],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('pick abc123 # First line');
      expect(file).to.include("exec git commit --amend -m 'First line' -m 'Second paragraph'");
    });

    it('should escape single quotes in reworded message', function () {
      const state = {
        lines: [
          {
            action: 'reworded',
            hash: 'abc123',
            message: "It's a bug",
          },
        ],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.equal(`pick abc123 # It's a bug\nexec git commit --amend -m 'It'\\''s a bug'\n`);
    });

    it('should serialize reworded lines with multiple lines in message', function () {
      const state = {
        lines: [
          {
            action: 'reworded',
            hash: 'abc123',
            message: 'First line\nSecond line',
          },
        ],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('pick abc123 # First line');
      expect(file).to.include("exec git commit --amend -m 'First line' -m 'Second line'");
    });

    it('should convert following squash lines to fixup when preceded by reworded', function () {
      const state = {
        lines: [
          { action: 'pick', hash: 'aaa111', message: 'base commit' },
          { action: 'reworded', hash: 'ddd444', message: 'New message' },
          { action: 'squash', hash: 'bbb222', message: 'squash commit b' },
          { action: 'squash', hash: 'ccc333', message: 'squash commit c' },
        ],

        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('pick aaa111 base commit');
      expect(file).to.include('pick ddd444 # New message');
      expect(file).to.include('fixup bbb222 squash commit b');
      expect(file).to.include('fixup ccc333 squash commit c');
      expect(file).to.include("exec git commit --amend -m 'New message'");
    });

    it('should not convert squash to fixup if not followed by reworded', function () {
      const state = {
        lines: [
          { action: 'pick', hash: 'aaa111', message: 'base commit' },
          { action: 'squash', hash: 'bbb222', message: 'squash commit b' },
          { action: 'pick', hash: 'ccc333', message: 'other commit' },
        ],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('squash bbb222 squash commit b');
    });

    it('should strip # comment lines from multi-message reworded content', function () {
      const multiMessage = [
        '# This is a combination of 2 commits',
        '# This is the 1st commit message:',
        '',
        'First commit subject',
        '',
        '# This is the 2nd commit message:',
        '',
        'Second commit subject',
        '',
        '# Please enter the commit message for your changes.',
      ].join('\n');
      const state = {
        lines: [{ action: 'reworded', hash: 'abc123', message: multiMessage }],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('pick abc123 # First commit subject');
      expect(file).to.include("-m 'First commit subject' -m 'Second commit subject'");
    });

    it('should handle reworded message with only comment lines', function () {
      const state = {
        lines: [{ action: 'reworded', hash: 'abc123', message: '# only comments' }],
        info: [],
      } as unknown as RebaseState;
      const file = rebaseFile.toFile(state);
      expect(file).to.include('pick abc123 # \nexec git commit --amend');
    });
  });
});
