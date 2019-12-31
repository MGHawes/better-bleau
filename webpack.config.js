const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: "source-map",
  resolve: {
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.js$/, loader: "source-map-loader", enforce: "pre" },
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
    ],
  },
  plugins: [
    new CopyWebpackPlugin([{
        from: "src/manifest.json",
    }]),
  ]
};