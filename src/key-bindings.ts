import path from 'path';
import { KeyBindings } from './types';

const defaultRewordBindings: KeyBindings = {
  ESCAPE: 'rewordDone',
  BACKSPACE: 'rewordBackspace',
  DELETE: 'rewordDelete',
  ENTER: 'rewordEnter',
  LEFT: 'rewordLeft',
  RIGHT: 'rewordRight',
  UP: 'rewordUp',
  DOWN: 'rewordDown',
  HOME: 'rewordHome',
  END: 'rewordEnd',
  SHIFT_LEFT: 'rewordShiftLeft',
  SHIFT_RIGHT: 'rewordShiftRight',
  SHIFT_UP: 'rewordShiftUp',
  SHIFT_DOWN: 'rewordShiftDown',
  CTRL_A: 'rewordSelectAll',
  CTRL_K: 'rewordDeleteLine',
  CTRL_Z: 'rewordUndo',
  CTRL_C: 'rewordCancel',
};

async function loadCustom(customKeyBindingsFile?: string): Promise<{ main: KeyBindings; reword: KeyBindings }> {
  if (!customKeyBindingsFile) {
    return { main: {}, reword: {} };
  }
  const modulePath = path.resolve(customKeyBindingsFile);
  let loaded: { default: Record<string, string | KeyBindings> };
  if (modulePath.endsWith('.json')) {
    /* c8 ignore next */
    loaded = await import(modulePath, { with: { type: 'json' } });
  } else {
    try {
      /* c8 ignore next */
      loaded = await import(modulePath);
    } catch (e) {
      throw new Error(
        `Failed to load custom key bindings from ${customKeyBindingsFile}. If this is a CommonJS module, please change the file extension to .cjs. Error: ${(e as Error).message}`,
      );
    }
  }
  const { rewordMode, ...rest } = loaded.default;
  return { main: rest as KeyBindings, reword: (rewordMode ?? {}) as KeyBindings };
}

export default async function keyBindings(customKeyBindingsFile?: string): Promise<KeyBindings> {
  const { main } = await loadCustom(customKeyBindingsFile);
  return Object.assign(
    {
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
      ESCAPE: 'abort',
    },
    main,
  );
}

export async function rewordKeyBindings(customKeyBindingsFile?: string): Promise<KeyBindings> {
  const { reword } = await loadCustom(customKeyBindingsFile);
  return Object.assign({}, defaultRewordBindings, reword);
}
