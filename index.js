#!/usr/bin/env node
'use strict';
var editor = require('./lib/editor');
var FileHandle = require('./lib/file-handle.js');

var filename = process.argv[process.argv.length-1];

var file = new FileHandle(filename);

function close(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('File was saved');
  }
  process.exit();
}

function done(output) {
  file.write(output, close);
}

editor.init(done);

file.read(editor.setData, close);
