import debugLog from '../src/debug-log';
import fs from 'fs';
import sinon from 'sinon';
import { expect } from 'chai';

describe('Debug log', function () {
  const origLog = console.log;
  const logFile = 'console.log';

  afterEach(function () {
    debugLog.untrapConsole();
    console.log = origLog;
    try {
      fs.unlinkSync(logFile);
    } catch {
      /* ignore */
    }
  });

  it('should not untrap console log if never trapped', function () {
    const spy = sinon.stub(console, 'log');
    debugLog.untrapConsole();
    console.log('Jalla');
    expect(spy).to.be.calledWith('Jalla');
  });

  it('should trap console log', async function () {
    const spy = sinon.spy(console, 'log');
    debugLog.trapConsole();
    console.log('Jalla');
    await debugLog.flush();
    expect(spy).not.to.be.called;
  });

  it('should write console log to file', async function () {
    debugLog.trapConsole();
    console.log('Jalla1');
    console.log('Jalla2');
    await debugLog.flush();
    expect(fs.readFileSync(logFile, 'utf-8')).to.equal('Jalla1\nJalla2\n');
  });

  it('should untrap console log', function () {
    const spy = sinon.stub(console, 'log');
    debugLog.trapConsole();
    debugLog.untrapConsole();
    console.log('Jalla');
    expect(spy).to.be.calledWith('Jalla');
  });
});
