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
  internal.log({
    level: 'info',
    log: `\n${DateTime.local().toISO()} - process stats:\ncpu:\n${JSON.stringify(process.cpuUsage())}\nmemory:\n${JSON.stringify(process.memoryUsage())}`,
  });
}, 600000);

// graceful shutdown
export async function gracefulShutdown() {
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
  internal.log({
    level: 'info',
    log: '\nCaught interrupt signal',
  });
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

  // wait for api initialization
  const { twitter } = await api(settings.credentials);

  // wait for broker initialization
  const { robinhood } = await brokers(internal.log, settings.credentials);

  // get accounts
  const accounts = await robinhood.getAccounts(db);
  internal.log({
    level: 'info',
    log: `Pull data for ${accounts.length} robinhood accounts`,
  });

  // get order history
  const orders = await robinhood.orderHistory(db);
  internal.log({
    level: 'info',
    log: `Transaction history downloaded... found ${orders.length} new records.`,
  });

  // get current positions
  const positions = await robinhood.getPositions(db);
  internal.log({
    level: 'info',
    log: `Positions updated... ${(positions.filter((p) => (parseFloat(p.quantity) > 0))).length} stock(s) in portfolio.`,
  });

  // load user's elected strategies
  const strategies = await db.all(`
    SELECT s.*, es.updated_at FROM elected_strategies es
    JOIN strategies s
    ON es.id = s.id;
  `);

  // TODO: run trading logic based on elected strategies
  if (strategies.length > 0) {
    internal.log({
      level: 'info',
      log: `Executing strategies:\n${JSON.stringify(strategies.map((e) => (e.name)))}\n`,
    });
  }

  // attach secondary databases relevant to strategy
  await db.run(`ATTACH DATABASE '${path.resolve(settings.home, 'twitter.db')}' AS twitter;`);

  // rsa regex
  const rsa = /^I'm buying (?<qty>\d+) shares? of \$(?<ticker>[a-z]{1,5}) by market close on (?<date>[a-z]{3} \d{1,2}, \d{4})\.$/i;
  // stock ticker regex
  const ticker = /\$(?<ticker>[A-Z]{1,5})/ig;

  while (!exit) {
    paused = false;

    let following;
    try {
      following = await db.all('select * from twitter.following;');
    } catch (err) {
      internal.log({
        level: 'error',
        log: err,
      });
    }

    await eachSeries(following, async (tweeter, tweeterCb) => {
      let cache;
      try {
        cache = await db.get('select * from twitter.tweets where created_at = (select MAX(created_at) from twitter.tweets where author_id = $author_id) and author_id = $author_id limit 1;', { $author_id: tweeter.id });
      } catch (err) {
        internal.log({
          level: 'error',
          log: err,
        });
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
        internal.log({
          level: 'error',
          log: err,
        });
      }

      // analyze new tweets and store in db
      if (tweets.length > 0) {
        internal.log({
          level: 'info',
          log: `${tweeter.name} has tweeted since we last checked!!\n`,
        });
      }

      await eachSeries(tweets, async (tweet, tweetCb) => {
        internal.log({
          level: 'info',
          log: `${tweet.created_at}:\n${tweet.text}\n`,
        });

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
          internal.log({
            level: 'error',
            log: err,
          });
        }

        // check for rsa match
        // look for stock ticker symbols in tweet
        if (tweeter.username === 'ReverseSplitArb' && typeof tweet.text === 'string') {
          const match = rsa.exec(tweet.text);
          if (match) {
            internal.log({
              level: 'info',
              log: `@${tweeter.username} said to buy ${match.groups.qty} of ${match.groups.ticker} by the close of ${DateTime.utc.fromFormat(match.groups.date, 'LLL dd, yyyy', { zone: 'America/New_York', hour: 16 }).toISO()}!!`,
            });
          }
        }

        // look for stock ticker symbols in tweet
        if (typeof tweet.text === 'string') {
          let match;
          do {
            match = ticker.exec(tweet.text);
            if (match) {
              const stock = match.groups.ticker;
              internal.log({
                level: 'info',
                log: `${tweeter.name} tweeted about ticker symbol ${stock} in their tweet!!`,
              });

              // quote stock
              try {
                const response = await promisify(robinhood.quote_data)(stock);
                internal.log({
                  level: 'info',
                  log: `\nquote for ${stock}:\n${JSON.stringify(response.body)}\n`,
                });
              } catch (err) {
                internal.log({
                  level: 'error',
                  log: err,
                });
              }

              // execute trade (ask for permission from owner if low probability score)

              // add trade to watch
            }
          // eslint-disable-next-line no-cond-assign
          } while ((match = ticker.exec(tweet.text)) !== null);
        }
        tweetCb();
      });
      tweeterCb();
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
