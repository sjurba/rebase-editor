'use strict';
var chai = require('chai');
global.expect = chai.expect;
chai.use(require('chai-sinon'));
chai.use(require('chai-as-promised'));
global.sinon = require('sinon');
