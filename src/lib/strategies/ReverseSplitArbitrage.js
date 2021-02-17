/* eslint-disable no-await-in-loop */
import { DateTime } from 'luxon';
import { eachSeries } from 'async-es';
import Strategy from './Strategy';

export default class ReverseSplitArbitrage extends Strategy {
  constructor(config) {
    super(config);

    this.name = 'Reverse Split Arbitrage';

    // rsa regex
    this.rsa = /^.*I'm buying (?<qty>\d+) shares? of \$(?<ticker>[a-z]{1,5}) by market close on (?<date>[a-z]{3} \d{1,2}, \d{4})\..*$/im;
    // stock ticker regex
    this.ticker = /\$(?<ticker>[A-Z]{1,5})/ig;
  }

  async main() {
    const self = this;
    let following;
    try {
      following = await self.db.all('select * from twitter.following where username = \'ReverseSplitArb\';');
    } catch (err) {
      self.log({
        level: 'error',
        log: err.message,
      });
    }

    await eachSeries(following, async (tweeter, tweeterCb) => {
      let cache;
      try {
        cache = await self.db.get('select * from twitter.tweets where created_at = (select MAX(created_at) from twitter.tweets where author_id = $author_id) and author_id = $author_id limit 1;', { $author_id: tweeter.id });
      } catch (err) {
        self.log({
          level: 'error',
          log: err.message,
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
          response = await self.api.twitter.get(`users/${tweeter.id}/tweets`, queryParams);
          if (response.meta.result_count > 0) {
            tweets = [...tweets, ...response.data];
          }
          queryParams.pagination_token = response.meta.next_token;
        } while (response.meta.next_token !== undefined);
      } catch (err) {
        self.log({
          level: 'error',
          log: err.message,
        });
      }

      // analyze new tweets and store in db
      if (tweets.length > 0) {
        self.log({
          level: 'info',
          log: `${tweeter.name} has tweeted since we last checked!!\n`,
        });
      }

      await eachSeries(tweets, async (tweet, tweetCb) => {
        self.log({
          level: 'info',
          log: `${tweeter.name}: ${tweet.text}\n`,
        });

        try {
          await self.db.run(`
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
          self.log({
            level: 'error',
            log: err.message,
          });
        }

        // check for rsa match
        // look for stock ticker symbols in tweet
        if (tweeter.username === 'ReverseSplitArb' && typeof tweet.text === 'string') {
          const match = self.rsa.exec(tweet.text);
          if (match) {
            self.log({
              level: 'info',
              log: `@${tweeter.username} said to buy ${match.groups.qty} of ${match.groups.ticker} by the close of ${DateTime.fromFormat(match.groups.date, 'LLL dd, yyyy', { zone: 'America/New_York', hour: 16 }).toISO()}!!`,
            });
            // execute market buy for each enabled broker
            try {
              const { body } = await self.brokers.robinhood.p_quote_data(match.groups.ticker);
              self.log({
                level: 'info',
                log: `\nquote for ${match.groups.ticker}:\n${JSON.stringify(body)}\n`,
              });
              if (Object.prototype.hasOwnProperty.call(body, 'missing_instruments') && Array.isArray(body.missing_instruments) && body.missing_instruments.indexOf(match.groups.ticker) >= 0) {
                self.log({
                  level: 'warn',
                  log: `Broker: ${'robinhood'} does not support ticker: ${match.groups.ticker}`,
                });
              } else {
                await self.brokers.robinhood.p_place_buy_order({
                  type: 'market',
                  quantity: 1,
                  instrument: {
                    url: body.instrument,
                    symbol: match.groups.ticker,
                  },
                });
                self.log({
                  level: 'info',
                  log: `Attempted by of ${match.groups.ticker} on ${'robinhood'}.`,
                });
              }
            } catch (err) {
              self.log({
                level: 'error',
                log: err.message,
              });
            }
          }
        }

        // look for stock ticker symbols in tweet
        // if (typeof tweet.text === 'string') {
        //   let match;
        //   do {
        //     match = this.ticker.exec(tweet.text);
        //     if (match) {
        //       const stock = match.groups.ticker;
        //       this.log({
        //         level: 'info',
        //         log: `${tweeter.name} tweeted about ticker symbol ${stock} in their tweet!!`,
        //       });

        //       // quote stock
        //       try {
        //         const response = await promisify(this.robinhood.quote_data)(stock);
        //         this.log({
        //           level: 'info',
        //           log: `\nquote for ${stock}:\n${JSON.stringify(response.body)}\n`,
        //         });
        //       } catch (err) {
        //         this.log({
        //           level: 'error',
        //           log: err.message,
        //         });
        //       }

        //       // execute trade (ask for permission from owner if low probability score)

        //       // add trade to watch
        //     }
        //   // eslint-disable-next-line no-cond-assign
        //   } while ((match = this.ticker.exec(tweet.text)) !== null);
        // }
        tweetCb();
      });
      tweeterCb();
    });
  }
}
