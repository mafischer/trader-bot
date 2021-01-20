const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');

createSQLiteDb();

async function createSQLiteDb() {

    console.log('starting db initialization');

    if(!fs.existsSync('./trader.db')) {
        // create trader table
        const traderDb = await open({
            filename: './trader.db',
            driver: sqlite3.cached.Database
        });
        // create strategies table
        await traderDb.run(`
            CREATE TABLE "strategies" (
                "id"	INTEGER NOT NULL,
                "name"	TEXT NOT NULL UNIQUE,
                PRIMARY KEY("id" AUTOINCREMENT)
            );
        `);
        // add initial strategy
        await traderDb.run(`
            INSERT INTO strategies (id, name) VALUES (1, 'reverse_stock_arbitrage');
        `);

        await traderDb.close();
    }

    if(!fs.existsSync('./twitter.db')) {
        // create twitter db
        const twitterDb = await open({
            filename: './twitter.db',
            driver: sqlite3.cached.Database
        });
        // create tweets table
        await twitterDb.run(`
            CREATE TABLE "tweets" (
                "id"	TEXT NOT NULL UNIQUE,
                "author_id"	TEXT NOT NULL,
                "created_at"	TIMESTAMP NOT NULL,
                "text"	TEXT NOT NULL,
                "entities"	TEXT,
                "public_metrics"	TEXT,
                "context_annotations"	TEXT,
                "withheld"	TEXT,
                "geo"	TEXT,
                PRIMARY KEY("id")
            );
        `);

        // await twitterDb.run(`
        //     INSERT INTO "tweets" ("id", "author_id", "created_at", "text") VALUES ('1351263271261769728', '1332370385921306631', '2021-01-18T20:20:43.000Z', 'Since markets are closed today, I wanted to share a video @FeeFiFoFreedom made that walks through the strategy. If you ever tried to explain reverse split arbitrage to a friend and they''re all "huh?", this video is for them. https://t.co/AS7H2RX8xK');
        // `);

        await twitterDb.close();
    }

    console.log('done initializing db');
}