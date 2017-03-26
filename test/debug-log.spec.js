'use strict';

const debugLog = require('../lib/debug-log.js');
const fs = require('fs');

describe('Debug log', function () {

  const origLog = console.log;

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
    return console.log('Jalla').then(() => {
      expect(fs.readFileSync('console.log', 'utf-8')).to.equal('Jalla\n');
    });
  });

  it('should trap console log', function () {
    const spy = sinon.spy(console, 'log');
    debugLog.trapConsole();
    console.log('Jalla');
    expect(spy).not.to.be.called;
  });

  it('should untrap console log', function () {
    const spy = sinon.stub(console, 'log');
    debugLog.trapConsole();
    debugLog.untrapConsole();
    console.log('Jalla');
    expect(spy).to.be.calledWith('Jalla');
  });
});
