'use strict';

const utils = require('../lib/utils');

describe('Utils', function () {


  describe('trimTo', function () {

    it('should trim non styled line', function () {
      expect(utils.trimTo('Line Line', 4)).to.equal('Line');
    });

    it('should not count style', function () {
      expect(utils.trimTo('^!Line Line', 4)).to.equal('^!Line');
    });

    it('should not count style in the middle', function () {
      expect(utils.trimTo('Lin^!e Line', 4)).to.equal('Lin^!e');
    });

    it('should not count multiple styles', function () {
      expect(utils.trimTo('^yLine^: ^rLine Jalla', 9)).to.equal('^yLine^: ^rLine');
    });

    it('should not print style in the end', function () {
      expect(utils.trimTo('Line^! Line', 4)).to.equal('Line');
    });

    it('should count escaped ^', function () {
      expect(utils.trimTo('^^Line Line', 4)).to.equal('^^Lin');
    });

    it('should count "^ "', function () {
      expect(utils.trimTo('Line^ Line Jalla', 9)).to.equal('Line^ Line');
    });

    it('should not include escaped ^ at the end', function () {
      expect(utils.trimTo('Line^^ Line', 4)).to.equal('Line');
    });
  });

});
