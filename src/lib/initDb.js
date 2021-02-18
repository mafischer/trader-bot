import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { eachSeries } from 'async-es';

export default async function initDb(home) {
  console.log('starting db initialization');

  if (!fs.existsSync(path.resolve(home, 'trader.db'))) {
    // create trader database
    const traderDb = await open({
      filename: path.resolve(home, 'trader.db'),
      driver: sqlite3.cached.Database,
    });
    // initialize trader database
    const queries = `
    PRAGMA foreign_keys=OFF;
    BEGIN TRANSACTION;
    CREATE TABLE IF NOT EXISTS "strategies" (
      "id"  INTEGER NOT NULL,
      "name"  TEXT NOT NULL UNIQUE,
      "description"  TEXT NOT NULL,
      "class"  TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );
    INSERT INTO strategies VALUES(1,'Reverse Stock Split Arbitrage','Schedule the purchase of  1 share of stock 10 minutes prior to the market close on last trading day before said stock is scheduled to undergo a reverse stock split.','ReverseStockArbitrage');
    CREATE TABLE IF NOT EXISTS "credentials" (
      "id"  INTEGER NOT NULL CHECK(id=1),
      "credentials"  TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );
    CREATE TABLE IF NOT EXISTS "actions" (
      "id"  INTEGER NOT NULL,
      "name"  TEXT NOT NULL UNIQUE,
      PRIMARY KEY("id" AUTOINCREMENT)
    );
    INSERT INTO actions VALUES(1,'BUY');
    INSERT INTO actions VALUES(2,'SELL');
    CREATE TABLE IF NOT EXISTS "status" (
      "id"  INTEGER NOT NULL,
      "name"  TEXT NOT NULL UNIQUE,
      PRIMARY KEY("id" AUTOINCREMENT)
    );
    INSERT INTO status VALUES(1,'PENDING');
    INSERT INTO status VALUES(2,'FILLED');
    INSERT INTO status VALUES(3,'CONFIRMED');
    INSERT INTO status VALUES(4,'NOT_TRIGGERED');
    CREATE TABLE IF NOT EXISTS "brokers" (
      "id"  INTEGER NOT NULL,
      "name"  TEXT NOT NULL UNIQUE,
      "supported"  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY("id" AUTOINCREMENT)
    );
    INSERT INTO brokers VALUES(1,'robinhood',1);
    INSERT INTO brokers VALUES(2,'webull',0);
    INSERT INTO brokers VALUES(3,'fidelity',0);
    CREATE TABLE IF NOT EXISTS "api" (
      "id"  INTEGER NOT NULL,
      "service"  TEXT NOT NULL UNIQUE,
      "inputs"  TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );
    INSERT INTO api VALUES(1,'robinhood','["username","password"]');
    INSERT INTO api VALUES(2,'twitter','["bearer_token","client_secret","client_token"]');
    CREATE TABLE IF NOT EXISTS "orders" (
      "account"  TEXT NOT NULL,
      "broker"  TEXT NOT NULL,
      "symbol"  TEXT NOT NULL,
      "created_at"  INTEGER NOT NULL,
      "updated_at"  TIMESTAMP,
      "state"  TEXT NOT NULL,
      "type"  TEXT NOT NULL,
      "action"  TEXT,
      "price"  NUMERIC,
      "quantity"  INTEGER NOT NULL,
      "raw"  TEXT NOT NULL,
      PRIMARY KEY("broker","account","symbol","created_at")
    );
    CREATE TABLE IF NOT EXISTS "accounts" (
      "broker"  TEXT NOT NULL,
      "id"  TEXT NOT NULL,
      "type"  TEXT NOT NULL,
      "name"  TEXT NOT NULL,
      "raw"  TEXT NOT NULL,
      PRIMARY KEY("broker","id")
    );
    CREATE TABLE IF NOT EXISTS "elected_strategies" (
      "id"  INTEGER NOT NULL,
      "active"  INTEGER NOT NULL,
      "updated_at"  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY("id")
    );
    CREATE TABLE IF NOT EXISTS "positions" (
      "broker"  TEXT NOT NULL,
      "symbol"  TEXT NOT NULL,
      "qty"  INTEGER NOT NULL,
      "average_cost"  NUMERIC NOT NULL,
      "raw"  TEXT NOT NULL,
      PRIMARY KEY("broker","symbol")
    );
    DELETE FROM sqlite_sequence;
    INSERT INTO sqlite_sequence VALUES('strategies',2);
    INSERT INTO sqlite_sequence VALUES('credentials',1);
    INSERT INTO sqlite_sequence VALUES('actions',2);
    INSERT INTO sqlite_sequence VALUES('status',4);
    INSERT INTO sqlite_sequence VALUES('brokers',3);
    INSERT INTO sqlite_sequence VALUES('api',2);
    COMMIT     
    `.split(';');
    await eachSeries(queries, async (query) => {
      await traderDb.run(query);
    });

    await traderDb.close();

    console.log('sucessfully initialized trader database');
  }

  if (!fs.existsSync(path.resolve(home, 'twitter.db'))) {
    // create twitter db
    const twitterDb = await open({
      filename: path.resolve(home, 'twitter.db'),
      driver: sqlite3.cached.Database,
    });
    // initialize twitter database
    const queries = `
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      CREATE TABLE IF NOT EXISTS "tweets" (
        "id"  TEXT NOT NULL UNIQUE,
        "author_id"  TEXT NOT NULL,
        "created_at"  TIMESTAMP NOT NULL,
        "text"  TEXT NOT NULL,
        "entities"  TEXT,
        "public_metrics"  TEXT,
        "context_annotations"  TEXT,
        "withheld"  TEXT,
        "geo"  TEXT,
        PRIMARY KEY("id")
      );
      CREATE TABLE IF NOT EXISTS "following" (
        "id"  TEXT NOT NULL,
        "name"  TEXT NOT NULL,
        "username"  TEXT NOT NULL,
        PRIMARY KEY("id")
      );
      INSERT INTO "following" VALUES('44196397','Elon Musk','elonmusk');
      INSERT INTO "following" VALUES('1332370385921306631','Reverse Split Arbitrage','ReverseSplitArb');
      INSERT INTO "following" VALUES('898021206967951360','Tesla Daily','TeslaPodcast');
      COMMIT
    `.split(';');
    await eachSeries(queries, async (query) => {
      await twitterDb.run(query);
    });

    await twitterDb.close();

    console.log('sucessfully initialized twitter database');
  }

  console.log('SQLite databases are initialized.');
}
