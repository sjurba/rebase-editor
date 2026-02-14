import keyBindings from '../lib/key-bindings.js';
import { expect } from 'chai';

describe('Key bindings', function () {
  it('should load default keys', async function () {
    const bindings = await keyBindings();
    expect(bindings.UP).to.equal('up');
  });

  it('should override default keys from json file', async function () {
    const bindings = await keyBindings('test/testfiles/customKeybindings.json');
    expect(bindings.UP).to.equal('override');
    expect(bindings['7']).to.equal('add');
  });

  it('should override default keys from js file', async function () {
    const bindings = await keyBindings('test/testfiles/customKeybindings.js');
    expect(bindings.UP).to.equal('override');
    expect(bindings['7']).to.equal('add');
  });

  it('should override default keys from common js file', async function () {
    const bindings = await keyBindings('test/testfiles/customKeyBindingsCommonJs.cjs');
    expect(bindings.UP).to.equal('override');
    expect(bindings['7']).to.equal('add');
  });

  it('should provide helpful error message when importing common js file', async function () {
    try {
     await keyBindings('test/testfiles/customKeyBindingsCommonJs.js')
      expect.fail('Should have thrown error');
    } catch (err) {
      expect(err.message).to.include('If this is a CommonJS module')
    }
  });
});
