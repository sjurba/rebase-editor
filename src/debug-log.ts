import fs from 'fs';
import util from 'util';

let file: fs.WriteStream | null;
let origConsoleLog: typeof console.log | undefined;
let pendingWrites: Promise<void>[] = [];

const debugLog = {
  trapConsole: (): void => {
    origConsoleLog = console.log;
    console.log = (...params: unknown[]): void => {
      file ??= fs.createWriteStream('console.log', { flags: 'w' });
      const f = file;
      const p = new Promise<void>((resolve) => {
        f.write(util.format(...params) + '\n', () => {
          resolve();
        });
      });
      pendingWrites.push(p);
      void p.then(() => {
        pendingWrites = pendingWrites.filter((w) => w !== p);
      });
    };
  },
  flush: async (): Promise<void> => {
    await Promise.all(pendingWrites);
    pendingWrites = [];
  },
  untrapConsole: (): void => {
    if (origConsoleLog) {
      console.log = origConsoleLog;
    }
    if (file) {
      file.close();
      file = null;
    }
    pendingWrites = [];
  },
};

export default debugLog;
