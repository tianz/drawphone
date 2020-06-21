const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./public/js/client.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "public/dist")
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    })
  ],
  node: {
    fs: "empty"
  }
};
