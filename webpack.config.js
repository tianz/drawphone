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
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "fonts",
              publicPath: "dist/fonts"
            }
          }
        ]
      }
    ]
  }
};
