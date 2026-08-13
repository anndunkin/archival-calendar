const path = require('path');

module.exports = {
  target: 'electron-main',
  entry: {
    index: './src/main/index.ts',
    preload: './src/main/preload.ts'
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
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  externals: ['better-sqlite3', 'electron-store'],
  node: {
    __dirname: false,
    __filename: false
  }
};
