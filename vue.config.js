const { defineConfig } = require("@vue/cli-service");
const { resolve } = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = defineConfig({
  css: {
    extract: false,
  },
  configureWebpack: {
    resolve: {
      fallback: {
        crypto: require.resolve("crypto-browserify"),
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        fs: require.resolve("browserify-fs"),
        buffer: require.resolve("buffer"),
        util: require.resolve("util/"),
      },
    },
        // plugins: [
      // new HtmlWebpackPlugin({
        // template: resolve(__dirname, 'public/index.html'),  //template file to embed the source
        // inlineSource: '.(js|css)$' // embed all javascript and css inline
      // }),
    //   new HtmlWebpackInlineSourcePlugin()
    // ]
  
    // optimization: {
    //   splitChunks: false,
    // },
  },
  publicPath: "",
});

