import keyBindings, { rewordKeyBindings } from '../src/key-bindings';
import { expect } from 'chai';

describe('Key bindings', function () {
  it('should load default keys', async function () {
    const bindings = await keyBindings();
    expect(bindings.UP).to.equal('up');
  });

  it('should load default reword bindings', async function () {
    const bindings = await rewordKeyBindings();
    expect(bindings.ESCAPE).to.equal('rewordDone');
    expect(bindings.ENTER).to.equal('rewordEnter');
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

  it('should override reword bindings from rewordMode field in custom file', async function () {
    const bindings = await rewordKeyBindings('test/testfiles/customKeybindingsWithReword.json');
    expect(bindings.ESCAPE).to.equal('rewordDone');      // default unchanged
    expect(bindings.CTRL_ENTER).to.equal('rewordEnter'); // custom added
  });

  it('should provide helpful error message when importing common js file', async function () {
    try {
     await keyBindings('test/testfiles/customKeyBindingsCommonJs.js');
      expect.fail('Should have thrown error');
    } catch (err) {
      expect((err as Error).message).to.include('If this is a CommonJS module');
    }
  });
});
