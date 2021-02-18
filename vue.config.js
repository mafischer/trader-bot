/* eslint-disable import/no-extraneous-dependencies */
// vue.config.js
// const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  // options...
  pages: {
    index: 'src/main.js',
    worker: 'src/worker/worker.js',
  },
  pluginOptions: {
    electronBuilder: {
      externals: ['sqlite3', 'aws-sdk', 'electron-prompt'],
      nodeIntegration: true,
      builderOptions: {
        // options placed here will be merged with
        // default configuration and passed to electron-builder
        appId: 'com.fischerapps.trader-bot',
        productName: 'Trader Bot',
      },
    },
  },
  configureWebpack: {
    // devtool: 'source-map',
    devtool: 'inline-source-map',
    // optimization: {
    //   minimize: true,
    //   minimizer: [
    //     new TerserPlugin({
    //       terserOptions: {
    //         mangle: false,
    //       },
    //     }),
    //   ],
    // },
  },
  transpileDependencies: [
    'vuetify',
  ],
};
