#!/usr/bin/env node
const credentials = require('./credentials');
const Twitter = require('twitter-v2');
const { DateTime } = require('luxon');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { promisify } = require('util');
const path = require('path');

// make setTimeout async
const sleep = promisify(setTimeout);

// create a twitter client
const client = new Twitter(credentials.twitter);

// start application main function
main();

// TODO: create a stategy interface
// TODO: create an electron ui to monitor, config, review, and etc.

async function main() {

    // exit boolean determines whether we should abort at the end of a loop.
    // paused boolean indicates whether the loop is executing or sleeping.
    let exit = false, paused = true;

    // press ctrl+c to exit trader-bot
    process.on('SIGINT', async function() {
        console.log("\nCaught interrupt signal");
        exit = true;
        if(paused) {
            await gracefulShutdown(db);
        }
    });

    // open the sqlite database
    const db = await open({
        filename: './trader.db',
        driver: sqlite3.cached.Database
    });

    // load user's elected strategies
    let strategies;
    try {
        strategies = await db.run("select * from strategies;");
    } catch(err) {
        console.log(err)
    }
    // TODO: run trading logic based on strategy
    console.log(strategies);

    // attach secondary databases relevant to strategy
    await db.run(`ATTACH DATABASE '${path.resolve(__dirname,'twitter.db')}' AS twitter;`);

    // stock ticker regex
    const ticker = /\$([A-Z]{1,4})/ig;

    while(!exit) {

        paused = false;

        let cache;
        try {
            cache = await db.get("select * from twitter.tweets where created_at = (select MAX(created_at) from twitter.tweets where author_id = $author_id) and author_id = $author_id limit 1;", {$author_id: '1332370385921306631'});
        } catch(err) {
            console.log(err)
        }
        console.log(cache);
        
        //fetch latest data for strategy
        const queryParams = {
            start_time: `${DateTime.utc().minus({ days: 2 }).toISO()}`,
            exclude: "retweets,replies",
            'tweet.fields': "id,text,created_at,context_annotations,entities,withheld,public_metrics,geo,author_id"
        };
        // set since_id to avoide duplicate data
        let author = '1332370385921306631';
        if(cache && cache.id) {
            queryParams['since_id'] = cache.id;
            author = cache.author_id;
        }
        const tweets = await client.get(`users/${author}/tweets`, queryParams);

        // add new tweets to db
        if(tweets.hasOwnProperty('data') && Array.isArray(tweets.data)) {

            tweets.data.forEach(async tweet => {
            
                console.log(tweet);
    
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
    
                // look for stock ticker symbol
                let tickers;
                if(typeof tweet.text === 'string') {
                    tickers = tweet.text.matchAll(ticker);
                }
                for (let stock in tickers) {
                    console.log(stock);
                    // quote stock

                    // execute trade (ask for permission from owner if low probability score)

                    // add trade to watch
                }
            });

        }

        // TODO: clean up old data

        // graceful shutdown
        if(exit) {
            break;
        }

        // wait 10 seconds before polling data and/or making trades
        paused = true;
        await sleep(10000);
    }
    await gracefulShutdown(db);
};

// graceful shutdown
async function gracefulShutdown(db){
    console.log('shuttingDown');
    await db.close();
    process.exit();
}

// robinhood stuff
const Robinhood = require('robinhood')(credentials.robinhood, function () {

    Robinhood.quote_data('TSLA', function (error, response, body) {
        if (error) {
            console.error(error);
            process.exit(1);
        }
        console.log(body);
    });

    Robinhood.investment_profile(function (err, response, body) {
        if (err) {
            console.error(err);
        } else {
            console.log('investment_profile');
            console.log(body);
        }
    })
});
