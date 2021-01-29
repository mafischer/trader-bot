const { DateTime } = require('luxon');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { promisify } = require('util');
const path = require('path');
const { eachSeries } = require('async');
// const home = __dirname;
const api = import('./api/index.mjs');
const brokers = import('./brokers/index.mjs');

// make setTimeout async
const sleep = promisify(setTimeout);

// declare db variable globally
let db;

// exit boolean determines whether we should abort at the end of a loop.
// paused boolean indicates whether the loop is executing or sleeping.
let exit, paused;
exit = false;
paused = true;

// start application main function
main();

// press ctrl+c to exit trader-bot
if (process.platform === 'win32') {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}
process.on('SIGINT', async function () {
  console.log('\nCaught interrupt signal');
  exit = true;
  if (paused) {
    await gracefulShutdown(db);
  }
});

// keep tabs on the process
const watch = setInterval(() => {
  console.log(`\n${DateTime.local().toISO()} - process stats:\ncpu:\n${JSON.stringify(process.cpuUsage())}\nmemory:\n${JSON.stringify(process.memoryUsage())}`);
}, 600000);

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

async function main () {
  console.log('initializing..\n');

  // wait for api initialization
  const { twitter } = await api;

  // wait for broker initialization

  /**
    * robinhood
    **/
  const { robinhood } = await brokers;

  // no try catch because we want app to fail if this isn't working.
  // const robinhood.= await robinhood;

  // get investment_profile
  await new Promise((resolve, reject) => {
    robinhood.investment_profile(function (err, response, body) {
      if (err) {
        return reject(err);
      } else {
        console.log('robinhood investment profile downloaded successfully.\n');
        resolve(body);
      }
    }
    );
  });

  /**
    * webull
    **/

  /**
    * fidelity
    **/

  // open the sqlite database
  // no try catch because we want app to fail if this isn't working.
  db = await open({
    filename: './trader.db',
    driver: sqlite3.cached.Database
  });

  // load user's elected strategies
  // no try catch because we want app to fail if this isn't working.
  const strategies = await db.all('select * from strategies;');

  // TODO: run trading logic based on elected strategies
  console.log(`Executing strategies:\n${JSON.stringify(strategies)}\n`);

  // attach secondary databases relevant to strategy
  // no try catch because we want app to fail if this isn't working.
  await db.run(`ATTACH DATABASE '${path.resolve(__dirname, 'twitter.db')}' AS twitter;`);

  // stock ticker regex
  const ticker = /\$(?<ticker>[A-Z]{1,4})/ig;

  // eslint-disable-next-line no-unmodified-loop-condition
  while (!exit) {
    paused = false;

    let following;
    try {
      following = await db.all('select * from twitter.following;');
    } catch (err) {
      console.log(err);
    }

    await eachSeries(following, async tweeter => {
      let cache;
      try {
        cache = await db.get('select * from twitter.tweets where created_at = (select MAX(created_at) from twitter.tweets where author_id = $author_id) and author_id = $author_id limit 1;', { $author_id: tweeter.id });
      } catch (err) {
        console.log(err);
      }

      // fetch latest data for strategy
      const queryParams = {
        start_time: `${DateTime.utc().minus({ days: 10 }).toISO()}`,
        exclude: 'retweets,replies',
        'tweet.fields': 'id,text,created_at,context_annotations,entities,withheld,public_metrics,geo,author_id'
      };
      // set since_id to avoide duplicate data
      if (cache && cache.id) {
        queryParams['since_id'] = cache.id;
      }
      let tweets;
      try {
        tweets = await twitter.get(`users/${tweeter.id}/tweets`, queryParams);
      } catch (err) {
        console.log(err);
      }

      // analyze new tweets and store in db
      if (tweets.hasOwnProperty('data') && Array.isArray(tweets.data)) {
        if (tweets.meta.result_count > 0) {
          console.log(`${tweeter.name} has tweeted since we last checked!!\n`);
        } else {
          console.log(`No new tweets from ${tweeter.name} :(\n`);
        }

        await eachSeries(tweets.data, async tweet => {
          console.log(`${tweet.created_at}:\n${tweet.text}\n`);

          try {
            await db.run(`
                            insert into twitter.tweets
                            (id, author_id, created_at, text, entities, public_metrics, context_annotations, withheld, geo)
                            values
                            ($id, $author_id, $created_at, $text, $entities, $public_metrics, $context_annotations, $withheld, $geo);
                        `, {
              $id: tweet.id,
              $author_id: tweet.author_id,
              $created_at: tweet.created_at,
              $text: tweet.text,
              $entities: JSON.stringify(tweet.entities),
              $public_metrics: JSON.stringify(tweet.public_metrics),
              $context_annotations: JSON.stringify(tweet.context_annotations),
              $withheld: JSON.stringify(tweet.withheld),
              $geo: JSON.stringify(tweet.geo)
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
                  await new Promise((resolve, reject) => {
                    robinhood.quote_data(stock, function (error, response, body) {
                      if (error) {
                        reject(error);
                      } else {
                        console.log(`\nquote for ${stock}:\n${JSON.stringify(body)}\n`);
                        resolve(body);
                      }
                    });
                  });
                } catch (err) {
                  console.log(err);
                }

                // execute trade (ask for permission from owner if low probability score)

                // add trade to watch
              }
            } while ((match = ticker.exec(tweet.text)) !== null);
          }
        });
      }
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

// graceful shutdown
async function gracefulShutdown () {
  console.log('shuttingDown');
  clearInterval(watch);
  if (db) {
    await db.close();
  }
  process.exit();
}
