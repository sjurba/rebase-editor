#!/usr/bin/env node

'use strict';
var args = require('minimist')(process.argv, {
    boolean: ['s'],
    alias: {
        s: 'status',
        k: 'keys'
    }
});

global.appconfig = {
    color: args.color,
    status: args.status,
    keys: args.keys
};

var filename = args._[args._.length - 1];

var FileHandle = require('./lib/file-handle.js');
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

var editor = require('./lib/editor');
editor.init(done);

file.read(editor.setData, close);
