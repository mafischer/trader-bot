#!/usr/bin/env node
const credentials = require('./credentials');
const Twitter = require('twitter-v2');
const { DateTime } = require('luxon');

// robinhood stuff
const Robinhood = require('robinhood')(credentials.robinhood, function(){

    Robinhood.quote_data('TSLA', function(error, response, body) {
        if (error) {
            console.error(error);
            process.exit(1);
        }
        console.log(body);
    });

    Robinhood.investment_profile(function(err, response, body){
        if(err){
            console.error(err);
        }else{
            console.log('investment_profile');
            console.log(body);
        }
    })
});

// twitter stuff
const client = new Twitter(credentials.twitter);

// TODO: setup twitter data strategies for trading.
const id = "1332370385921306631";

// pull tweets from user since "start_time"
client.get(`users/${id}/tweets`, { 
    start_time: `${DateTime.utc().minus({days: 1}).toISO()}`,
    exclude: "retweets,replies"
}).then(data => {
    console.log(data);
}).catch(err => {
    console.log(err);
});
