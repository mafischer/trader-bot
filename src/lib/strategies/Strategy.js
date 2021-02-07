/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
class Strategy {
  constructor(config) {
    // validate config
    if (!(config instanceof Map)) {
      throw new Error('config param must be of type "Map"');
    }

    this.home = config.get('home');
    this.brokers = config.get('brokers');
    this.db = config.get('db');
    this.name = 'strategy';
  }

  async main() {
    throw new Error('main function must be implemented');
  }
}
