#!/usr/bin/env node
const credentials = require('./credentials');
const Twitter = require('twitter-v2');
const { DateTime } = require('luxon');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { promisify } = require('util');

const sleep = promisify(setTimeout);

// twitter stuff
const client = new Twitter(credentials.twitter);

main();

// TODO: run as a loop
// TODO: create a stategy interface
// TODO: persist strategies and configs to sqlite db
// TODO: create an electron ui to monitor, config, review, and etc.

async function main() {

    // exit boolean determines whether we should abort at the end of a loop.
    // paused boolean indicates whether the loop is executing or sleeping.
    let exit = false, paused = true;

    // press ctrl+c to exit
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

    while(!exit) {

        paused = false;

        // load user's elected strategies
        let strategies;
        try {
            strategies = await db.get("select * from twitter where created_at = (select MAX(created_at) from twitter where author_id = :author_id) and author_id = :author_id;", {':author_id': '1332370385921306631'});
        } catch(err) {
            console.log(err)
        }
        console.log(strategies);

        // load data from strategy cache
        let cache;
        try {
            cache = await db.get("select * from twitter where created_at = (select MAX(created_at) from twitter where author_id = :author_id) and author_id = :author_id;", {':author_id': '1332370385921306631'});
        } catch(err) {
            console.log(err)
        }
        console.log(cache);
        
        //fetch latest data for strategy
        client.get(`users/${cache.author_id}/tweets`, {
            start_time: `${DateTime.utc().minus({ days: 1 }).toISO()}`,
            exclude: "retweets,replies",
            'tweet.fields': "id,text,created_at,context_annotations,entities,withheld,public_metrics,geo,author_id"
        }).then(data => {
            console.log(data);
        }).catch(err => {
            console.log(err);
        });

        // clean up old data

        // graceful shutdown
        paused = true;
        if(exit) {
            break;
        }
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
