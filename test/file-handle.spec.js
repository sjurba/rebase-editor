'use strict';

const Handler = require('../lib/file-handle');
const fs = require('fs');

describe('File handler', function () {

  describe('read', function () {
    it('should read file', function () {
      const handler = new Handler('test/testfiles/testfile.txt');
      return expect(handler.read()).to.eventually.equal('Hello\nWorld\n');
    });

    it('should reject failure', function () {
      const handler = new Handler('notExistingFile');
      return expect(handler.read()).to.be.rejected;
    });

    it('should reject empty file', function () {
      const handler = new Handler('test/testfiles/emptyfile.txt');
      return expect(handler.read()).to.be.rejected;
    });
  });

  describe('write', function () {

    const file = 'test/testfiles/writtenfile.txt';

    function remove(file, done) {
      fs.unlink(file, (err) => {
        //Ignore if file not exists
        if (err && err.code !== 'ENOENT') {
          done(err);
        } else {
          done();
        }
      });
    }

    afterEach(function (done) {
      remove(file, done);
    });

    beforeEach(function (done) {
      remove(file, done);
    });

    it('should write to file', function () {
      const handler = new Handler(file);
      const str = 'Foo\nBar\n';
      return handler.write(str).then(() => {
        return expect(handler.read()).to.be.eventually.equal(str);
      });
    });

    it('should reject on faliure', function () {
      const handler = new Handler('test/notExistingFolder/file');
      return expect(handler.write('foo')).to.be.rejected;
    });
  });



});
