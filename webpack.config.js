const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: "src/manifest.json" },
      { from: "node_modules/plottable/plottable.css" },
      { from: "src/index.css" },
    ]),
  ]
};