'use strict';

const keyBindings = require('../lib/key-bindings');

describe('Key bindings', function () {
  it('should load default keys', function () {
    const bindings = keyBindings();
    expect(bindings.UP).to.equal('up');
  });

  it('should override default keys from json file', function () {
    const bindings = keyBindings('test/testfiles/customKeybindings.json');
    expect(bindings.UP).to.equal('override');
    expect(bindings['7']).to.equal('add');
  });

  it('should override default keys from js file', function () {
    const bindings = keyBindings('test/testfiles/customKeybindings.js');
    expect(bindings.UP).to.equal('override');
    expect(bindings['7']).to.equal('add');
  });
});
