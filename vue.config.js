// vue.config.js
module.exports = {
  // options...
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with
        // default configuration and passed to electron-builder
        appId: 'com.fischerapps.trader-bot',
        productName: 'Trader Bot',
      },
    },
  },
};
