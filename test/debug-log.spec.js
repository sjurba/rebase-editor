'use strict';

import debugLog from '../lib/debug-log.js';
import fs from 'fs';
import sinon from "sinon";
import { expect } from 'chai';

describe('Debug log', function () {

  const origLog = console.log;
  const logFile = 'console.log';

  afterEach(function () {
    debugLog.untrapConsole();
    console.log = origLog;
  });

  it('should not untrap console log if never trapped', function () {
    const spy = sinon.stub(console, 'log');
    debugLog.untrapConsole();
    console.log('Jalla');
    expect(spy).to.be.calledWith('Jalla');
  });

  it('should trap console log', function () {
    const spy = sinon.spy(console, 'log');
    debugLog.trapConsole();
    console.log('Jalla');
    expect(spy).not.to.be.called;
  });

  it('should write console log to file', function () {
    debugLog.trapConsole();
    console.log("Jalla1")
    return console.log('Jalla2').then(() => {
      expect(fs.readFileSync(logFile, 'utf-8')).to.equal('Jalla1\nJalla2\n');
    });
  });

  it('should untrap console log', function () {
    const spy = sinon.stub(console, 'log');
    debugLog.trapConsole();
    debugLog.untrapConsole();
    console.log('Jalla');
    expect(spy).to.be.calledWith('Jalla');
  });
});
