'use strict';

var fs = require('fs');
var util = require('util');
let file;
let origConsoleLog;

module.exports = {
  trapConsole: () => {
    origConsoleLog = console.log;
    console.log = (...params) => {
      if (!file) {
        file = fs.createWriteStream('console.log', {
          flags: 'w'
        });
      }
      return new Promise((resolve) => {
        file.write(util.format(...params) + '\n', resolve);
      });
    };
  },
  untrapConsole: () => {
    if (origConsoleLog) {
      console.log = origConsoleLog;
    }
    if (file) {
      file.close();
      file = null;
    }
  }
};
