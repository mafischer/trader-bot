// vue.config.js
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
    devtool: 'source-map',
  },
};
