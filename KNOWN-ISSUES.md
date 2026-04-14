# Known Issues

## mocha pinned to `^11.3.0`

**mocha is intentionally kept below `11.7.0`.** Do not run `npm audit fix` without reading this first.

### What breaks

mocha `11.7.0` introduced a change ([#5366](https://github.com/mochajs/mocha/pull/5366)) that uses Node's native `require(esm)` to load test files when running on Node 22.12+, where `process.features.require_module === true`. This causes each `.ts` source file to be loaded twice:

1. Via `require()`, intercepted by tsx's CJS transform (produces a CJS bundle)
2. Via the `--import=tsx` ESM hook (produces native ESM)

V8 emits two separate coverage entries for the same source file with mismatched byte offsets. When c8 applies the tsx source map, it generates phantom uncovered functions/lines at wrong line numbers, dropping coverage from 100% to ~97%.

The loss is **not real** — all code is covered. It is a false negative in the coverage report.

### What was tried

- Upgrading tsx (already at latest, did not help)
- Upgrading c8 to v11 (did not help)
- Loading `setup.ts` via `--import` instead of `require` (broke chai plugin setup)
- Renaming `setup.ts` to `setup.mts` (mocha only bypasses `.mjs`, not `.mts`)
- Renaming all `.ts` to `.mts` (mocha still routes `.mts` through `require()`)

### Upstream status

No issue has been filed upstream for this specific tsx + c8 + mocha combination. The relevant mocha PRs are:

- [#5366](https://github.com/mochajs/mocha/pull/5366) — introduced the regression (`11.7.0`)
- [#5384](https://github.com/mochajs/mocha/pull/5384) — partial fix, does not help with tsx (`11.7.1`)
- [#5429](https://github.com/mochajs/mocha/pull/5429) — fixes `.mjs` only, not `.ts` (`11.7.2`)

### Resolution

Keep `mocha` pinned to `^11.3.0` in `package.json` until a mocha release properly handles `.ts` files in the `requireModule` path (i.e. routes them through `import()` instead of `require()` when an ESM loader like tsx is registered).
