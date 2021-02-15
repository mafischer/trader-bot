/* eslint-disable class-methods-use-this */
export default class Strategy {
  constructor(config) {
    // validate config
    if (!(config instanceof Map)) {
      throw new Error('config param must be of type "Map"');
    }

    this.home = config.get('home');
    this.brokers = config.get('brokers');
    this.api = config.get('api');
    this.db = config.get('db');
    this.name = 'strategy';
    this.log = config.get('log');
    if (this.log === undefined) {
      this.log = ({ level, log }) => {
        console.log(level, log);
      };
    }
  }

  async main() {
    throw new Error('main function must be implemented');
  }

  loop() {
    this.running = this.main();
    this.running.then(() => {
      this.running = undefined;
    }).catch((err) => {
      this.running = undefined;
      this.log({
        level: 'error',
        log: err,
      });
    });
  }

  start(interval) {
    this.log({
      level: 'info',
      log: `Starting strategy ${this.constructor.name}`,
    });
    // run first loop
    this.loop();
    // set interval for continuous looping
    this.mainInterval = setInterval(() => {
      if (this.running === undefined) {
        this.loop();
      }
    }, interval);
  }

  async stop() {
    this.log({
      level: 'info',
      log: `Stopping strategy ${this.constructor.name}`,
    });
    clearInterval(this.mainInterval);
    if (this.running) {
      await this.running;
    }
  }
}
