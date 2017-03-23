'use strict';

const main = require('../lib/main'),
  mockTerminal = require('./mock-terminal'),
  debugLog = require('../lib/debug-log.js');

describe('Main loop', function () {

  let mockTerm, args, file;

  beforeEach(function () {
    mockTerm = mockTerminal.create();
    file = {
      read: sinon.stub(),
      write: sinon.stub()
    };
    args = {
      term: mockTerm,
      file: file
    };
  });

  afterEach(function () {
    debugLog.untrapConsole();
  });

  it('should render file to terminal', function (done) {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    setImmediate(() => {
      expect(mockTerm.getRendered().length).to.be.greaterThan(10);
      done();
    });
  });

  function nextTick(func) {
    return new Promise((resolve, reject) => {
      setImmediate(() => {
        if (!func) {
          resolve();
        }
        try {
          resolve(func());
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
    nextTick()
      .then(() => {
        mockTerm.emit('key', 'q');
      });
  });

  it('should render changes', function () {
    file.read.returns(Promise.resolve(rebaseText));
    main(args);
    return nextTick()
      .then(() => {
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
    nextTick()
      .then(() => {
        mockTerm.throwOnRender('Error');
        mockTerm.emit('key', 'f');
      });
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
