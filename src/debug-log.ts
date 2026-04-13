import fs from 'fs';
import util from 'util';

let file: fs.WriteStream | null;
let origConsoleLog: typeof console.log | undefined;

const debugLog = {
  trapConsole: (): void => {
    origConsoleLog = console.log;
    console.log = (...params: unknown[]): Promise<void> => {
      if (!file) {
        file = fs.createWriteStream('console.log', {
          flags: 'w',
        });
      }
      const f = file;
      return new Promise((resolve) => {
        f.write(util.format(...params) + '\n', () => {
          resolve();
        });
      });
    };
  },
  untrapConsole: (): void => {
    if (origConsoleLog) {
      console.log = origConsoleLog;
    }
    if (file) {
      file.close();
      file = null;
    }
  },
};

export default debugLog;
