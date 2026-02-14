'use strict';

import fs from 'fs';
import util from 'util';
let file;
let origConsoleLog;

const debugLog = {
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

export default debugLog;
