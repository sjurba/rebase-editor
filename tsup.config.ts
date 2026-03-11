import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  outDir: 'dist',
  sourcemap: true,
  dts: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  splitting: false,
  noExternal: [],
  external: ['terminal-kit', 'minimist'],
});
