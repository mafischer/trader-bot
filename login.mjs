import readline from 'readline';
import { Writable } from 'stream';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Cryptr from 'cryptr';
import Robinhood from 'robinhood';

let missing = [], credentials, cryptr;

const supported = ['robinhood','twitter'];

async function main() {
    // open the sqlite database
    // no try catch because we want app to fail if this isn't working.
    const db = await open({
        filename: './trader.db',
        driver: sqlite3.cached.Database
    });

    // grab encrypted credentials from the database
    await retrieveCredentials(db);

    // validate user has signed into all required services
    if(!complete(credentials)) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        //prompt user for credentials
        credentials = await chooseService(rl, fs, credentials);

        // send encrypted credentials to the database
        await updateCredentials(db);
    }

    // not closing db as we are running the appliation after login
    // db.close();
}

function chooseService(rl, fs, creds) {

    const services = '\n0.  exit\n1.  robinhood\n2.  twitter\n3.  td ameritrade\n4.  fidelity\n5.  webull\n';

    complete(creds);

    return new Promise(async resolve => {
        console.log(`From the list presented below, please chose ${missing.length > 0? `"${missing[0]}"` : 'which service you would like to authenticate'}:`);
        rl.question(services, async service => {
            switch (service) {
                case "0":
                    if(!complete(creds)) {
                        console.log(`Your credentials are not complete\npress ctrl-c twice to force exit.`);
                        resolve(await chooseService(rl, fs, creds));
                        break;
                    } else {
                        rl.close();
                        resolve(creds);
                        break;
                    }
                case "1":
                    resolve(await chooseService(rl, fs, {
                        ...creds,
                        robinhood: await robinhood(rl)
                    }));
                    break;
                case "2":
                    resolve(await chooseService(rl, fs, {
                        ...creds,
                        twitter: await twitter(rl)
                    }));
                default:
                    console.log(`\n${service} is not a valid option, or not yet supported!`);
                    resolve(await chooseService(rl, fs, creds));
                    break;
            }
        });
    });
};

async function updateCredentials(db) {
    if(credentials === undefined) {
        throw new Error('no credentials exist!');
    }
    if(cryptr === undefined) {
        await unlock();
    }
    await db.run(`
        insert into credentials (id, credentials)
        values (1, $credentials)
        on conflict(id) do update set credentials = $credentials;    
    `, {$credentials: cryptr.encrypt(JSON.stringify(credentials))});
}

async function retrieveCredentials(db, count = 1) {
    if (credentials === undefined) {
        // retreive encrypted credentials
        let creds;
        creds = await db.get("select credentials from credentials where id = 1;");
        if (creds === undefined || creds.credentials === '') {
            credentials = {};
            return;
        }

        // prompt for password to decrypt credentials
        await unlock();

        try {
            // decrypt credentials
            creds = cryptr.decrypt(creds.credentials);

            // parse credentials
            credentials = JSON.parse(creds);

            console.log("Credentials successfully decrypted!");

        } catch (err) {
            cryptr = undefined;
            console.log('incorrect password!');
            if(count >= 3) {
                throw new Error('decryption failed');
            }
            await retrieveCredentials(db, count + 1);
        }
    }
}

function unlock() {
    return new Promise((resolve) => {
        if(cryptr === undefined) {
            const mutedStdOut = new Writable({
                write: function (chunk, encoding, callback) {
                    if (!this.muted)
                        process.stdout.write(chunk, encoding)
                    callback()
                }
            });
        
            const rl = readline.createInterface({
                input: process.stdin,
                output: mutedStdOut,
                terminal: true
            });
        
            mutedStdOut.muted = false;
            rl.question("\nEnter a master password to encrypt/decrypt your account credentials:\n", (password) => {
                rl.close();
                cryptr = new Cryptr(password);
                resolve();
            });
            mutedStdOut.muted = true;
        } else {
            resolve();
        }
    });
}

function complete(creds) {
    // validate all services are signed in
    supported.forEach(service => {
        if(creds.hasOwnProperty(service)) {
            missing = missing.filter(e => e !== service);
        } else if(missing.indexOf(service) === -1) {
            missing.push(service);
        }
    });
    return missing.length === 0;
}

function robinhood(rl) {

    let username, password, token;

    return new Promise(resolve => {
        rl.question(`Please enter your robinhood userid: `, uid => {
            username = uid;
            rl.question(`${username}, please enter your password: `, pw => {
                password = pw;
                const rh = Robinhood({ username, password }, data => {
                    rl.question(`Please enter your multi-factor authentication passcode: `, mfaCode => {
                        if (data && data.mfa_required) {
                            rh.set_mfa_code(mfaCode, () => {
                                token = rh.auth_token();
                                resolve({ token });
                            });
                        }
                        else {
                            console.log('multi-factor auth is not required');
                            token = rh.auth_token();
                            resolve({ token });
                        }
                    });
                });
            });
        });
    });
};

function twitter(rl) {

    let bearer_token, consumer_key, consumer_secret;

    return new Promise(resolve => {
        rl.question(`Please enter your twitter bearer token: `, bt => {
            bearer_token = bt;
            rl.question(`Please enter your twitter consumer key: `, ck => {
                consumer_key = ck;
                rl.question(`Please enter your twitter consumer secret: `, cs => {
                    consumer_secret = cs;
                    resolve({
                        bearer_token,
                        consumer_key,
                        consumer_secret
                    });
                });
            });
        });
    });
};

async function login() {
    await initialized;
    return credentials;
}

await main();

export default credentials;
