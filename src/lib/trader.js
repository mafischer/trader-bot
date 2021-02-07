/* eslint-disable global-require */
/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
import { DateTime } from 'luxon';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promisify } from 'util';
import path from 'path';
import { eachSeries } from 'async-es';
import api from './api';
import brokers from './brokers';

// make setTimeout async
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

// declare db variable in the highest scope
let db;

// exit boolean determines whether we should abort at the end of a loop.
// paused boolean indicates whether the loop is executing or sleeping.
let exit = false;
let paused = true;
let initialized = false;
const internal = {
  log: console.log,
};

// keep tabs on the process
const watch = setInterval(() => {
  internal.log(`\n${DateTime.local().toISO()} - process stats:\ncpu:\n${JSON.stringify(process.cpuUsage())}\nmemory:\n${JSON.stringify(process.memoryUsage())}`);
}, 600000);

// graceful shutdown
export async function gracefulShutdown() {
  internal.log('preparing for shutddown..');
  clearInterval(watch);
  if (db && typeof db.close === 'function') {
    try {
      await db.close();
      internal.log('ready for shutdown.');
    } catch (err) {
      internal.log(`forcing shutdown shutdown because of:\n${err.message}`);
    }
    internal.quit();
  }
}

// press ctrl+c to exit trader-bot
if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}
process.on('SIGINT', async () => {
  internal.log('\nCaught interrupt signal');
  exit = true;
  if (paused) {
    await gracefulShutdown(db);
  }
});

// TODO: create a stategy base class / interface <-- this!!
/**
     * Name
     * Description
     * project_directory
     */
// strategy must inherity base strategy class
// Object.getPrototypeOf(CustomStrategy.constructor) === Strategy;

// TODO: create an electron ui to monitor, config, review, and etc.
// TODO: throw in some error handling

export async function main(settings) {
  if (initialized) {
    return;
  }
  initialized = true;
  internal.log = settings.log;
  internal.log('initializing..\n');

  // open the sqlite database
  // no try catch because we want app to fail if this isn't working.
  db = await open({
    filename: path.resolve(settings.home, 'trader.db'),
    driver: sqlite3.cached.Database,
  });

  // wait for api initialization
  const { twitter } = await api(settings.credentials);

  // wait for broker initialization
  const { robinhood } = await brokers(internal.log, settings.credentials);

  // get accounts
  const accounts = await robinhood.getAccounts(db);
  internal.log(`Pull data for ${accounts.length} robinhood accounts`);

  // get order histories
  const orders = await robinhood.orderHistory(db);

  internal.log(`Transaction history downloaded... found ${orders.length} new records.`);

  // load user's elected strategies
  const strategies = await db.all('select * from strategies;');

  // TODO: run trading logic based on elected strategies
  internal.log(`Executing strategies:\n${JSON.stringify(strategies)}\n`);

  // attach secondary databases relevant to strategy
  await db.run(`ATTACH DATABASE '${path.resolve(settings.home, 'twitter.db')}' AS twitter;`);

  // stock ticker regex
  const ticker = /\$(?<ticker>[A-Z]{1,4})/ig;

  while (!exit) {
    paused = false;

    let following;
    try {
      following = await db.all('select * from twitter.following;');
    } catch (err) {
      internal.log(err);
    }

    await eachSeries(following, async (tweeter, callback1) => {
      let cache;
      try {
        cache = await db.get('select * from twitter.tweets where created_at = (select MAX(created_at) from twitter.tweets where author_id = $author_id) and author_id = $author_id limit 1;', { $author_id: tweeter.id });
      } catch (err) {
        internal.log(err);
      }

      // fetch latest data for strategy
      const queryParams = {
        start_time: `${DateTime.utc().minus({ years: 1 }).toISO()}`,
        exclude: 'retweets,replies',
        'tweet.fields': 'id,text,created_at,context_annotations,entities,withheld,public_metrics,geo,author_id',
      };
      // set since_id to avoide duplicate data
      if (cache && cache.id) {
        queryParams.since_id = cache.id;
      }
      let tweets = [];
      try {
        let response;
        do {
          response = await twitter.get(`users/${tweeter.id}/tweets`, queryParams);
          if (response.meta.result_count > 0) {
            tweets = [...tweets, ...response.data];
          }
          queryParams.pagination_token = response.meta.next_token;
        } while (response.meta.next_token !== undefined);
      } catch (err) {
        internal.log(err);
      }

      // analyze new tweets and store in db
      if (tweets.length > 0) {
        internal.log(`${tweeter.name} has tweeted since we last checked!!\n`);
      }

      await eachSeries(tweets, async (tweet, callback2) => {
        internal.log(`${tweet.created_at}:\n${tweet.text}\n`);

        try {
          await db.run(`
            insert into twitter.tweets
            (id, author_id, created_at, text, entities, public_metrics, context_annotations, withheld, geo)
            values
            ($id, $author_id, $created_at, $text, $entities, $public_metrics, $context_annotations, $withheld, $geo);
          `, {
            $id: tweet.id || null,
            $author_id: tweet.author_id || null,
            $created_at: tweet.created_at || null,
            $text: tweet.text || null,
            $entities: tweet.entities !== undefined ? JSON.stringify(tweet.entities) : null,
            $public_metrics: tweet.public_metrics !== undefined ? JSON.stringify(tweet.public_metrics) : null,
            $context_annotations: tweet.context_annotations !== undefined ? JSON.stringify(tweet.context_annotations) : null,
            $withheld: tweet.withheld !== undefined ? JSON.stringify(tweet.withheld) : null,
            $geo: tweet.geo !== undefined ? JSON.stringify(tweet.geo) : null,
          });
        } catch (err) {
          internal.log(err);
        }

        // look for stock ticker symbols in tweet
        if (typeof tweet.text === 'string') {
          let match;
          do {
            match = ticker.exec(tweet.text);
            if (match) {
              const stock = match.groups.ticker;
              internal.log(`${tweeter.name} tweeted about ticker symbol ${stock} in their tweet!!`);

              // quote stock
              try {
                const response = await promisify(robinhood.quote_data)(stock);
                internal.log(`\nquote for ${stock}:\n${JSON.stringify(response.body)}\n`);
              } catch (err) {
                internal.log(err);
              }

              // execute trade (ask for permission from owner if low probability score)

              // add trade to watch
            }
          // eslint-disable-next-line no-cond-assign
          } while ((match = ticker.exec(tweet.text)) !== null);
        }
        callback2();
      });
      callback1();
    });

    // TODO: clean up old data

    // graceful shutdown
    if (exit) {
      break;
    }

    // wait 10 seconds before polling data and/or making trades
    paused = true;
    await sleep(10000);
  }

  await gracefulShutdown();
}
