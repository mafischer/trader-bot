/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import { promisify } from 'util';
import { eachLimit } from 'async-es';
import Robinhood from 'robinhood';
import { DateTime } from 'luxon';

async function getAccounts(db) {
  let accounts = [];
  const { body } = await this.p_accounts();
  if (Object.prototype.hasOwnProperty.call(body, 'results')) {
    accounts = body.results;
    await eachLimit(accounts, 10, async (account, accountCb) => {
      try {
        await db.run(`
          INSERT INTO accounts (broker, id, name, type, raw)
          values ($broker, $id, $name, $type, $raw)
          ON CONFLICT(broker, id) DO UPDATE
          SET name = $name, type = $type, raw = $raw;
        `, {
          $broker: 'robinhood',
          $id: account.account_number,
          $name: account.account_number,
          $type: account.type,
          $raw: JSON.stringify(account),
        });
        accountCb();
      } catch (err) {
        this.log(err);
        accountCb(err);
      }
    });
  }
  return accounts;
}

async function orderHistory(db, fromDate) {
  let latestCached;
  if (fromDate) {
    latestCached = fromDate;
  } else {
    // get most recent latest order from
    try {
      const order = await db.get('select updated_at from orders where created_at = (select MAX(created_at) from orders where broker = $broker) and broker = $broker limit 1;', { $broker: 'robinhood' });
      if (order) {
        // eslint-disable-next-line no-undef
        latestCached = order.updated_at;
        latestCached = DateTime.fromISO(latestCached).plus({ milliseconds: 1 }).toUTC().toISO();
      }
    } catch (err) {
      this.log(err);
    }
  }

  // get order history
  let orders = [];
  let cursor = null;
  let next = null;
  do {
    try {
      const options = {};
      if (cursor) {
        options.cursor = cursor;
      }
      if (latestCached) {
        options.updated_at = latestCached;
      }
      const { body } = await this.p_orders(options);
      orders = [...orders, ...body.results];
      if (body.next) {
        next = new URL(body.next);
        cursor = next.searchParams.get('cursor');
      } else {
        next = null;
      }
    } catch (err) {
      this.log(err);
      next = null;
    }
  } while (next !== null);

  await eachLimit(orders, 10, async (order, orderCb) => {
    try {
      const instrument = await this.p_url(order.instrument);
      order.instrument = instrument.body;
      let price = null;
      if (order.average_price) {
        price = parseFloat(order.average_price);
      }
      if (order.price) {
        price = parseFloat(order.price);
      }
      await db.run(`
        INSERT INTO orders (broker, account, symbol, created_at, updated_at, state, type, quantity, price, action, raw)
        VALUES ($broker, $account, $symbol, $created_at, $updated_at, $state, $type, $quantity, $price, $action, $raw)
        ON CONFLICT(broker, account, symbol, created_at) DO UPDATE SET
        updated_at = $updated_at, state = $state, price = $price, raw = $raw;
      `,
      {
        $broker: 'robinhood',
        $account: order.account,
        $symbol: order.instrument.symbol,
        $created_at: order.created_at,
        $updated_at: order.updated_at,
        $state: order.state,
        $price: price,
        $action: order.side,
        $type: order.type,
        $quantity: order.quantity,
        $raw: JSON.stringify(order),
      });
      orderCb();
    } catch (err) {
      this.log(err);
      orderCb();
    }
  });

  return orders;
}

export default (log, token) => (
  new Promise((resolve, reject) => {
    const rh = Robinhood(token, (err) => {
      if (err) {
        reject(err);
      }
      // set log function
      rh.log = log;

      // set async functions
      // auth_token()
      rh.p_auth_token = promisify(rh.auth_token);
      // expire_token(callback)
      rh.p_expire_token = promisify(rh.expire_token);
      // investment_profile(callback)
      rh.p_investment_profile = promisify(rh.investment_profile);
      // instruments(symbol, callback)
      rh.p_insturments = promisify(rh.instruments);
      // quote_data(stock, callback)
      rh.p_quote_data = promisify(rh.quote_data);
      // accounts(callback)
      rh.p_accounts = promisify(rh.accounts);
      // user(callback)
      rh.p_user = promisify(rh.user);
      // dividends(callback)
      rh.p_dividends = promisify(rh.dividends);
      // earnings(option, callback)
      rh.p_earnings = promisify(rh.earnings);
      // orders(options, callback)
      rh.p_orders = promisify(rh.orders);
      // positions(callback)
      rh.p_positions = promisify(rh.positions);
      // nonzero_positions(callback)
      rh.p_nonzero_positions = promisify(rh.nonzero_positions);
      // place_buy_order(options, callback)
      rh.p_place_buy_order = promisify(rh.place_buy_order);
      // place_sell_order(options, callback)
      rh.p_place_sell_order = promisify(rh.place_sell_order);
      // fundamentals(symbol, callback)
      rh.p_fundamentals = promisify(rh.fundamentals);
      // cancel_order(order, callback)
      rh.p_cancel_order = promisify(rh.cancel_order);
      // watchlists(name, callback)
      rh.p_watchlists = promisify(rh.watchlists);
      // create_watch_list(name, callback)
      rh.p_create_watch_list = promisify(rh.create_watch_list);
      // sp500_up(callback)
      rh.p_sp500_up = promisify(rh.sp500_up);
      // sp500_down(callback)
      rh.p_sp500_down = promisify(rh.sp500_down);
      // splits(instrument, callback)
      rh.p_splits = promisify(rh.splits);
      // historicals(symbol, intv, span, callback)
      rh.p_historicals = promisify(rh.historicals);
      // url(url, callback)
      rh.p_url = promisify(rh.url);
      // news(symbol, callback)
      rh.p_news = promisify(rh.news);
      // tag(tag, callback)
      rh.p_tag = promisify(rh.tag);
      // popularity(symbol, callback)
      rh.p_popularity = promisify(rh.popularity);
      // options_positions
      rh.p_options_positions = promisify(rh.options_positions);

      // custom functions
      // orderHistory
      rh.orderHistory = orderHistory;
      // getAccounts
      rh.getAccounts = getAccounts;

      // return robinhood object
      resolve(rh);
    });
  })
);
