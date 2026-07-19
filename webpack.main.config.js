const path = require('path');

module.exports = {
  target: 'electron-main',
  entry: {
    index: './src/main/index.ts',
    preload: './src/main/preload.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: '[name].js'
  },
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
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
    'electron-store': 'commonjs electron-store'
  },
  node: {
    __dirname: false,
    __filename: false
  }
};
