'use strict';
import path from 'path';
import { createRequire } from "module";
const require = createRequire(import.meta.url);


export default async function keyBindings(customKeyBindingsFile) {
  let customCmds = {};
  if (customKeyBindingsFile) {
    const modulePath = path.resolve(customKeyBindingsFile);
    let loaded;
    if (modulePath.endsWith('.json')) {
      loaded = await import(modulePath, { with: { type: 'json' } });
    } else {
      try {
        loaded = await import(modulePath);
      } catch (e) {
        throw new Error(`Failed to load custom key bindings from ${customKeyBindingsFile}. If this is a CommonJS module, please change the file extension to .cjs. Error: ${e.message}`);
      }
    }
    customCmds = loaded.default;
  }
  return Object.assign({
    UP: 'up',
    DOWN: 'down',
    LEFT: 'moveUp',
    CTRL_UP: 'moveUp',
    RIGHT: 'moveDown',
    CTRL_DOWN: 'moveDown',
    END: 'end',
    HOME: 'home',
    PAGE_DOWN: 'pageDown',
    PAGE_UP: 'pageUp',
    SHIFT_UP: 'selectUp',
    SHIFT_DOWN: 'selectDown',
    SHIFT_LEFT: 'selectUp',
    SHIFT_RIGHT: 'selectDown',
    SHIFT_PAGE_DOWN: 'selectPageDown',
    SHIFT_PAGE_UP: 'selectPageUp',
    SHIFT_HOME: 'selectHome',
    SHIFT_END: 'selectEnd',
    p: 'pick',
    r: 'reword',
    e: 'edit',
    s: 'squash',
    f: 'fixup',
    ALT_F: 'fixup -c',
    CTRL_F: 'fixup -C',
    b: 'break',
    d: 'drop',
    BACKSPACE: 'drop',
    DELETE: 'drop',
    z: 'undo',
    CTRL_Z: 'undo',
    Z: 'redo',
    CTRL_SHIFT_Z: 'redo',
    q: 'quit',
    ENTER: 'quit',
    CTRL_C: 'abort',
    ESCAPE: 'abort'
  }, customCmds);
}
