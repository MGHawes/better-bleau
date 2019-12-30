const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/content.js',
  output: {
    filename: 'content.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin([{
        from: "src/manifest.json",
    }]),
  ]
};