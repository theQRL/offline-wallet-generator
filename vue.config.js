const { defineConfig } = require("@vue/cli-service");
// const { resolve } = require("path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
// var HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = defineConfig({
    css: {
      extract: false,
    },
  configureWebpack: {
    //     output: {
    //       filename: "app[name].js",
    //       path: __dirname + "/dist",
    //       //chunkFilename: '[id].[chunkhash].js'
    //     },
    output: {
      wasmLoading: "fetch",
    },
    resolve: {
      fallback: {
        crypto: require.resolve("crypto-browserify"),
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        fs: require.resolve("srepollock-browserify-fs"),
        buffer: require.resolve("buffer"),
        util: require.resolve("util/"),
      },
    },
    experiments: {
      syncWebAssembly: true,
    },

  

    //     plugins: [
    //       new HtmlWebpackPlugin({
    //         // template: "public/index.html", //template file to embed the source
    //         inlineSource: ".(js|css)$", // embed all javascript and css inline
    //       }),
    //       new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
    //     ],

        optimization: {
          splitChunks: false,
        },
  },
    publicPath: "",
  //   outputDir: "dist",
});

// module.exports = {
//   transpileDependencies: true,
//   publicPath: "/",
//   outputDir: "dist",
//   configureWebpack: {
//     resolve: {
//       fallback: {
//         crypto: require.resolve("crypto-browserify"),
//         path: require.resolve("path-browserify"),
//         stream: require.resolve("stream-browserify"),
//         fs: require.resolve("browserify-fs"),
//         buffer: require.resolve("buffer"),
//         util: require.resolve("util/"),
//       },
//     },
//   },
//   chainWebpack: (config) => config.resolve.extensions.delete(".wasm"),
  // chainWebpack: (config) => {
  //   config.plugin("html").tap((args) => {
  //     return [
  //       /* new args to pass to html-webpack-plugin's constructor */
  //     ];
  //   });
  // },
// };
