'use strict';

const origConsoleLog = console.log;
var fs = require('fs');
var util = require('util');
let file;

module.exports = {
  trapConsole: () => {
    console.log = (...params) => {
      if (!file) {
        file = fs.createWriteStream('debug.log', {
          flags: 'w'
        });
      }
      file.write(util.format(...params) + '\n');
    };
  },
  untrapConsole: () => {
    console.log = origConsoleLog;
    if (file) {
      file.close();
      file = null;
    }
  }
};
