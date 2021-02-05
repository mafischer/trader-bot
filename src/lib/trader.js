/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable global-require */
import { DateTime } from 'luxon';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promisify } from 'util';
import path from 'path';
import { eachSeries } from 'async';
import api from './api/index';
import brokers from './brokers/index';

// make setTimeout async
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

// declare db variable globally
let db;

// exit boolean determines whether we should abort at the end of a loop.
// paused boolean indicates whether the loop is executing or sleeping.
let exit = false;
let paused = true;
let initialized = false;

// keep tabs on the process
const watch = setInterval(() => {
  console.log(`\n${DateTime.local().toISO()} - process stats:\ncpu:\n${JSON.stringify(process.cpuUsage())}\nmemory:\n${JSON.stringify(process.memoryUsage())}`);
}, 600000);

// graceful shutdown
export async function gracefulShutdown() {
  console.log('shuttingDown');
  clearInterval(watch);
  if (db) {
    await db.close();
  }
  process.exit();
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
  console.log('\nCaught interrupt signal');
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
  console.log('initializing..\n');

  // wait for api initialization
  const { twitter } = await api(settings.credentials);

  // wait for broker initialization

  /**
    * robinhood
    * */
  const { robinhood } = await brokers(settings.credentials);

  // no try catch because we want app to fail if this isn't working.
  // const robinhood.= await robinhood;

  // get investment_profile
  const resp = await promisify(robinhood.investment_profile)();
  console.log(resp.body);

  /**
    * webull
    * */

  /**
    * fidelity
    * */

  // open the sqlite database
  // no try catch because we want app to fail if this isn't working.
  db = await open({
    filename: path.resolve(settings.home, 'trader.db'),
    driver: sqlite3.cached.Database,
  });

  // load user's elected strategies
  // no try catch because we want app to fail if this isn't working.
  const strategies = await db.all('select * from strategies;');

  // TODO: run trading logic based on elected strategies
  console.log(`Executing strategies:\n${JSON.stringify(strategies)}\n`);

  // attach secondary databases relevant to strategy
  // no try catch because we want app to fail if this isn't working.
  await db.run(`ATTACH DATABASE '${path.resolve(settings.home, 'twitter.db')}' AS twitter;`);

  // stock ticker regex
  const ticker = /\$(?<ticker>[A-Z]{1,4})/ig;

  while (!exit) {
    paused = false;

    let following;
    try {
      following = await db.all('select * from twitter.following;');
    } catch (err) {
      console.log(err);
    }

    await eachSeries(following, async (tweeter, callback1) => {
      let cache;
      try {
        cache = await db.get('select * from twitter.tweets where created_at = (select MAX(created_at) from twitter.tweets where author_id = $author_id) and author_id = $author_id limit 1;', { $author_id: tweeter.id });
      } catch (err) {
        console.log(err);
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
        console.log(err);
      }

      // analyze new tweets and store in db
      if (tweets.length > 0) {
        console.log(`${tweeter.name} has tweeted since we last checked!!\n`);
      }

      await eachSeries(tweets, async (tweet, callback2) => {
        console.log(`${tweet.created_at}:\n${tweet.text}\n`);

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
          console.log(err);
        }

        // look for stock ticker symbols in tweet
        if (typeof tweet.text === 'string') {
          let match;
          do {
            match = ticker.exec(tweet.text);
            if (match) {
              const stock = match.groups.ticker;
              console.log(`${tweeter.name} tweeted about ticker symbol ${stock} in their tweet!!`);

              // quote stock
              try {
                const response = await promisify(robinhood.quote_data)(stock);
                console.log(`\nquote for ${stock}:\n${JSON.stringify(response.body)}\n`);
              } catch (err) {
                console.log(err);
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
