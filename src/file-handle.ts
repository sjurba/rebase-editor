import fs from 'fs';

export default class FileHandle {
  file: string;

  constructor(file: string) {
    this.file = file;
  }

  read(): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.file, 'utf8', function (err, data) {
        if (err) {
          reject(err);
          return;
        }
        if (data.length > 0) {
          resolve(data);
          return;
        } else {
          reject(new Error('File was empty'));
          return;
        }
      });
    });
  }

  write(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.file, data, function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
}
