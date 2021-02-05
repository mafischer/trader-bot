import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Cryptr from 'cryptr';
import Robinhood from 'robinhood';

const internal = {
  credentials: null,
  cryptr: null,
};

const supported = ['robinhood', 'twitter'];

async function retrieveCredentials(db) {
  // retreive encrypted credentials
  let creds;
  creds = await db.get('select credentials from credentials where id = 1;');
  if (creds === undefined || creds.credentials === '') {
    return {};
  }

  try {
    // decrypt credentials
    creds = internal.cryptr.decrypt(creds.credentials);

    // parse credentials
    creds = JSON.parse(creds);

    console.log('Credentials successfully decrypted!');

    return creds;
  } catch (err) {
    internal.cryptr = undefined;
    console.log('incorrect password!');
    throw new Error('invalid password!');
  }
}

export function missingCredentials(creds) {
  // validate all services are signed in
  let missing = [];
  supported.forEach((service) => {
    if (Object.prototype.hasOwnProperty.call(creds, service)) {
      missing = missing.filter((e) => e !== service);
    } else if (missing.indexOf(service) === -1) {
      missing.push(service);
    }
  });
  return missing;
}

export async function login(filename, password) {
  // open the sqlite database
  // no try catch because we want app to fail if this isn't working.
  const db = await open({
    filename,
    driver: sqlite3.cached.Database,
  });

  // set password
  internal.cryptr = new Cryptr(password);

  // grab encrypted credentials from the database
  internal.credentials = await retrieveCredentials(db);

  // validate user has signed into all required services
  const missing = missingCredentials(internal.credentials);

  // not closing db as we are running the appliation after login
  // db.close();

  return {
    cryptr: internal.cryptr,
    credentials: internal.credentials,
    db,
    missing,
  };
}

export async function updateCredentials(db, cryptr, credentials) {
  await db.run(`
        insert into credentials (id, credentials)
        values (1, $credentials)
        on conflict(id) do update set credentials = $credentials;    
    `, { $credentials: cryptr.encrypt(JSON.stringify(credentials)) });
}

export function robinhood(username, password) {
  return new Promise((resolve, reject) => {
    const rh = Robinhood({ username, password }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rh, data });
      }
    });
  });
}
