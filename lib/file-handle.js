'use strict';
var fs = require('fs');

var FileHandle = function (file) {
    this.file = file;
};

FileHandle.prototype = {
    read: function (onData, onError) {
        fs.readFile(this.file, 'utf8', function (err, data) {
            if (err) {
                return onError(err);
            }
            if (data !== null) {
                return onData(data);
            } else {
                return onError('File was empty');
            }
        });
    },

    write: function (data, done) {
        fs.writeFile(this.file, data, function (err) {
            if (err) {
                done(err);
            }
            done();
        });
    }
};


module.exports = FileHandle;
