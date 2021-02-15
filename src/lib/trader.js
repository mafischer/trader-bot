import { DateTime } from 'luxon';
import { eachOf } from 'async-es';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import api from './api';
import brokers from './brokers';
import ReverseSplitArbitrage from './strategies/ReverseSplitArbitrage';

// declare db variable in the highest scope
let db;

// exit boolean determines whether we should abort at the end of a loop.
// paused boolean indicates whether the loop is executing or sleeping.
let initialized = false;
const internal = {
  log: console.log,
};

// keep tabs on the process
const watch = setInterval(() => {
  internal.log({
    level: 'debug',
    log: `\n${DateTime.local().toISO()} - process stats:\ncpu:\n${JSON.stringify(process.cpuUsage())}\nmemory:\n${JSON.stringify(process.memoryUsage())}`,
  });
}, 600000);

// graceful shutdown
export async function gracefulShutdown() {
  eachOf(internal.strategies, async (strategy, strategyCb) => {
    await internal.strategies[strategy].stop();
    strategyCb();
  });
  internal.log({
    level: 'info',
    log: 'preparing for shutddown..',
  });
  clearInterval(watch);
  if (db && typeof db.close === 'function') {
    try {
      await db.close();
      internal.log({
        level: 'info',
        log: 'ready for shutdown.',
      });
    } catch (err) {
      internal.log({
        level: 'info',
        log: `forcing shutdown shutdown because of:\n${err.message}`,
      });
    }
    internal.quit();
  }
}

// TODO: create a stategy base class / interface <-- this!!
/**
     * Name
     * Description
     * project_directory
     */
// strategy must inherit base strategy class
// Object.getPrototypeOf(CustomStrategy.constructor) === Strategy;

// TODO: create an electron ui to monitor, config, review, and etc.
// TODO: throw in some error handling

export async function main(settings) {
  if (initialized) {
    return;
  }
  initialized = true;
  internal.log = settings.log;
  internal.log({
    level: 'info',
    log: 'initializing..\n',
  });

  // open the sqlite database
  // no try catch because we want app to fail if this isn't working.
  db = await open({
    filename: path.resolve(settings.home, 'trader.db'),
    driver: sqlite3.cached.Database,
  });

  // attach secondary databases
  await db.run(`ATTACH DATABASE '${path.resolve(settings.home, 'twitter.db')}' AS twitter;`);

  // wait for api initialization
  const API = await api(settings.credentials);

  // wait for broker initialization
  const Brokers = await brokers(internal.log, settings.credentials);

  // get accounts
  const accounts = await Brokers.robinhood.getAccounts(db);
  internal.log({
    level: 'info',
    log: `Pull data for ${accounts.length} robinhood accounts`,
  });

  // get order history
  const orders = await Brokers.robinhood.orderHistory(db);
  internal.log({
    level: 'info',
    log: `Transaction history downloaded... found ${orders.length} new records.`,
  });

  // get current positions
  const positions = await Brokers.robinhood.getPositions(db);
  internal.log({
    level: 'info',
    log: `Positions updated... ${(positions.filter((p) => (parseFloat(p.quantity) > 0))).length} stock(s) in portfolio.`,
  });

  // load user's elected strategies
  const elected = await db.all(`
    SELECT s.*, es.updated_at FROM elected_strategies es
    JOIN strategies s
    ON es.id = s.id;
  `);

  // TODO: run trading logic based on elected strategies
  const rsaConfig = new Map();
  rsaConfig.set('brokers', Brokers);
  rsaConfig.set('api', API);
  rsaConfig.set('home', settings.home);
  rsaConfig.set('db', db);
  rsaConfig.set('log', internal.log);

  internal.strategies = {
    ReverseSplitArbitrage: new ReverseSplitArbitrage(rsaConfig),
  };

  if (elected.length > 0) {
    elected.forEach((electee) => {
      internal.strategies[electee.class].start(10000);
    });
    internal.log({
      level: 'info',
      log: `Executing strategies:\n${JSON.stringify(elected.map((e) => (e.name)))}\n`,
    });
  }
}
