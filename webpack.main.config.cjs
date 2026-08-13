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
  module: { rules: [tsRule] },
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
