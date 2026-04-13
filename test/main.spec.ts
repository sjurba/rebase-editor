import orgMain from '../src/main';
import mockTerminal from './mock-terminal';
import sinon from 'sinon';
import { expect } from 'chai';
import { MainArgs, TerminalKitTerminal } from '../src/types';
import { MockTerm } from './mock-terminal';

const debugLog = {
  trapConsole: sinon.stub(),
  untrapConsole: sinon.stub(),
};

function main(args: MainArgs, onExit?: (err?: unknown) => void) {
  return orgMain(args, debugLog, onExit);
}

describe('Main loop', function () {
  let mockTerm: MockTerm, args: MainArgs, file: { read: sinon.SinonStub; write: sinon.SinonStub };

  beforeEach(function () {
    mockTerm = mockTerminal.create();
    file = {
      read: sinon.stub(),
      write: sinon.stub(),
    };
    args = {
      term: mockTerm as unknown as TerminalKitTerminal,
      file: file,
      alternateScreen: true,
    };
  });

  it('should render file to terminal', function (done) {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    setImmediate(() => {
      expect(mockTerm.getRendered().length).to.be.greaterThan(10);
      done();
    });
  });

  function nextTick(func?: () => unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      setImmediate(() => {
        if (!func) {
          resolve(undefined);
        }
        try {
          resolve(func!());
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  it('should write file on quit', function () {
    file.read.returns(Promise.resolve(rebaseText));
    file.write.returns(Promise.resolve);
    main(args);
    return nextTick()
      .then(() => {
        mockTerm.emit('key', 'q');
        return nextTick();
      })
      .then(() => {
        expect(file.write).to.be.calledWith(sinon.match.string);
      });
  });
  it('should write blank file on abort', function () {
    file.read.returns(Promise.resolve(rebaseText));
    file.write.returns(Promise.resolve);
    main(args);
    return nextTick()
      .then(() => {
        mockTerm.emit('key', 'ESCAPE');
        return nextTick();
      })
      .then(() => {
        expect(file.write).to.be.calledWith('');
      });
  });
  it('should exit on quit', function (done) {
    file.read.returns(Promise.resolve(rebaseText));
    file.write.returns(Promise.resolve);
    main(args, done);
    nextTick().then(() => {
      mockTerm.emit('key', 'q');
    });
  });

  it('should render changes', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    return nextTick().then(() => {
      mockTerm.emit('key', 'f');
      expect(mockTerm.getRendered()[0]).to.match(/fixup.*/);
    });
  });

  it('should exit on render errors', function (done) {
    file.read.returns(Promise.resolve(rebaseText));
    main(args, (err) => {
      expect(err).to.equal('Error');
      done();
    });
    nextTick().then(() => {
      mockTerm.throwOnRender('Error' as unknown as Error);
      mockTerm.emit('key', 'f');
    });
  });

  it('should trap debug messages', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    expect(debugLog.trapConsole).to.be.called;
  });

  it('should untrap debug messages on close', function () {
    file.read.returns(Promise.resolve(rebaseText));
    file.write.returns(Promise.resolve);
    main(args);
    return nextTick()
      .then(() => {
        mockTerm.emit('key', 'q');
      })
      .then(nextTick)
      .then(() => {
        expect(debugLog.untrapConsole).to.be.called;
      });
  });

  it('should exit with error when file read fails', function (done) {
    file.read.returns(Promise.reject('File not found'));
    main(args, (err) => {
      expect(err).to.equal('File not found');
      done();
    });
  });

  it('should enter reword mode on double-press r', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    return nextTick().then(() => {
      mockTerm.emit('key', 'r'); // first press: reword action
      mockTerm.emit('key', 'r'); // second press: enter reword mode
      const rendered = mockTerm.getRendered();
      // Footer is on the last line
      expect(rendered[mockTerm.height - 1]).to.include('ESC: save');
    });
  });

  it('should route characters to reword mode when active', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    return nextTick().then(() => {
      mockTerm.emit('key', 'r'); // reword
      mockTerm.emit('key', 'r'); // enter reword mode
      mockTerm.emit('key', 'A'); // type a character
      const rendered = mockTerm.getRendered();
      const text = rendered.join('\n');
      expect(text).to.include('1 implemented stuffA');
    });
  });

  it('should insert newline on ENTER in reword mode', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    return nextTick().then(() => {
      mockTerm.emit('key', 'r');
      mockTerm.emit('key', 'r');
      mockTerm.emit('key', 'ENTER'); // newline
      mockTerm.emit('key', 'ESCAPE'); // save
      const rendered = mockTerm.getRendered();
      expect(rendered[0]).to.match(/reworded.*/);
    });
  });

  it('should save and exit reword mode on ESCAPE', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    return nextTick().then(() => {
      mockTerm.emit('key', 'r'); // reword
      mockTerm.emit('key', 'r'); // enter reword mode
      mockTerm.emit('key', 'ESCAPE'); // save
      const rendered = mockTerm.getRendered();
      expect(rendered[0]).to.match(/reworded.*/);
    });
  });

  it('should fetch full commit message when entering reword mode', async function () {
    file.read.returns(Promise.resolve(rebaseText));
    const getFullCommitMessages = sinon.stub().returns(Promise.resolve('Full commit message\n\nWith body'));
    args.getFullCommitMessages = getFullCommitMessages;
    main(args);
    await nextTick();
    mockTerm.emit('key', 'r');
    mockTerm.emit('key', 'r');
    expect(getFullCommitMessages).to.be.calledWith(['142a871']);
    await nextTick();
    const text = mockTerm.getRendered().join('\n');
    expect(text).to.include('Full commit message');
  });

  it('should include following squash hashes when entering reword mode', async function () {
    const squashText = `pick sha_x base commit
reword sha_c reword commit c
squash sha_b squash commit b
squash sha_a squash commit a

# Rebase info`;
    file.read.returns(Promise.resolve(squashText));
    const getFullCommitMessages = sinon.stub().returns(Promise.resolve('Message C\n\nMessage B\n\nMessage A'));
    args.getFullCommitMessages = getFullCommitMessages;
    main(args);
    await nextTick();
    mockTerm.emit('key', 'DOWN'); // move to sha_c (index 1)
    mockTerm.emit('key', 'r'); // reword
    mockTerm.emit('key', 'r'); // enter reword mode
    expect(getFullCommitMessages).to.be.calledWith(['sha_c', 'sha_b', 'sha_a']);
    await nextTick();
    const text = mockTerm.getRendered().join('\n');
    expect(text).to.include('Message C');
  });

  it('should keep short message if full commit message fetch fails', async function () {
    file.read.returns(Promise.resolve(rebaseText));
    const getFullCommitMessages = sinon.stub().returns(Promise.reject(new Error('git error')));
    args.getFullCommitMessages = getFullCommitMessages;
    main(args);
    await nextTick();
    mockTerm.emit('key', 'r');
    mockTerm.emit('key', 'r');
    await nextTick();
    const text = mockTerm.getRendered().join('\n');
    expect(text).to.include('1 implemented stuff');
  });

  it('should not update state if reword mode exited before fetch completes', async function () {
    file.read.returns(Promise.resolve(rebaseText));
    let resolveFetch: (msg: string) => void;
    const getFullCommitMessages = sinon.stub().returns(
      new Promise<string>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    args.getFullCommitMessages = getFullCommitMessages;
    main(args);
    await nextTick();
    mockTerm.emit('key', 'r');
    mockTerm.emit('key', 'r'); // enter reword mode
    mockTerm.emit('key', 'ESCAPE'); // save and exit reword mode
    resolveFetch!('Full commit message');
    await nextTick();
    // Should be back in rebase mode, not reword mode
    const rendered = mockTerm.getRendered();
    expect(rendered[mockTerm.height - 1]).not.to.include('ESC: save');
  });

  it('should restore original message when cancelling after full message fetch', async function () {
    file.read.returns(Promise.resolve(rebaseText));
    const getFullCommitMessages = sinon
      .stub()
      .returns(Promise.resolve('# This is a combination of 2 commits\nFull message'));
    args.getFullCommitMessages = getFullCommitMessages;
    main(args);
    await nextTick();
    mockTerm.emit('key', 'r');
    mockTerm.emit('key', 'r'); // enter reword mode
    await nextTick(); // full message loaded
    mockTerm.emit('key', 'CTRL_C'); // cancel
    const text = mockTerm.getRendered().join('\n');
    expect(text).to.include('1 implemented stuff');
    expect(text).not.to.include('This is a combination');
  });
});

const rebaseText = `
pick 142a871 1 implemented stuff
pick 142a871 2 implemented stuff
# pick 142a871 3 Empty commit
edit 142a871 4 implemented stuff

# Rebase 98b090ef..928e1806 onto 98b090ef (2 commands)
#
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# x, exec = run command (the rest of the line) using shell
# d, drop = remove commit
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
`.trim();
