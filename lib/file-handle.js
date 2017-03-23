'use strict';
var fs = require('fs');

module.exports = class FileHandle {
  constructor(file) {
    this.file = file;
  };

  read() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.file, 'utf8', function (err, data) {
        if (err) {
          return reject(err);
        }
        if (data !== null && data.length > 0) {
          return resolve(data);
        } else {
          return reject('File was empty');
        }
      });
    });
  }

  write(data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.file, data, function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
};
