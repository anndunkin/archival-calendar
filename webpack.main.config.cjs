const path = require('path');

// Two separate configs are required here, not one shared config with two
// entries: Electron's sandboxed preload scripts (webPreferences.sandbox:
// true, set in src/main/index.ts) cannot be loaded as ES modules — only the
// unsandboxed main process supports ESM (.mjs) output. Building "preload"
// with the same `output.module: true` / `.mjs` settings as "index" produces
// a preload.mjs that Electron's sandbox silently fails to load, which left
// `window.archivalCalendar` undefined in the renderer and the app blank.
// So: main process entry -> ESM (.mjs), preload entry -> CommonJS (.js).

const tsRule = {
  test: /\.ts$/,
  use: 'ts-loader',
  exclude: /node_modules/
};

const resolve = {
  extensions: ['.ts', '.js', '.json']
};

const node = {
  __dirname: false,
  __filename: false
};

/** @type {import('webpack').Configuration} */
const mainConfig = {
  target: 'electron-main',
  entry: {
    index: './src/main/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: '[name].mjs',
    module: true
  },
  experiments: {
    outputModule: true
  },
  externalsType: 'module',
  module: {
    rules: [tsRule],
    // By default webpack statically replaces `import.meta.url` with a
    // hardcoded file:// URL pointing at the *build machine's* source path
    // (e.g. the CI runner's D:\a\<repo>\<repo>\... checkout directory).
    // src/main/index.ts uses `fileURLToPath(import.meta.url)` specifically
    // to compute __dirname at RUNTIME (there is no native __dirname in
    // ESM). If webpack bakes in the build-time value instead, the preload
    // script path resolves to a path that only exists on the CI runner,
    // producing "Unable to load preload script: ENOENT" on every real
    // install with a permanently blank window and no catchable JS
    // exception (Electron logs this preload failure to the console
    // itself, it isn't a throw our uncaughtException/onerror handlers
    // ever see). Disabling this parser option forces webpack to leave
    // `import.meta.url` untouched so Node/Electron resolves it against
    // the actual running file's real location at runtime.
    parser: {
      javascript: {
        importMeta: false
      }
    }
  },
  resolve,
  externals: ['better-sqlite3', 'electron-store'],
  node
};

/** @type {import('webpack').Configuration} */
const preloadConfig = {
  target: 'electron-preload',
  entry: {
    preload: './src/main/preload.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: '[name].js',
    module: false
  },
  module: { rules: [tsRule] },
  resolve,
  externals: ['better-sqlite3', 'electron-store'],
  node
};

module.exports = [mainConfig, preloadConfig];
