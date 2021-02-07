import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function attachDb(db, filename) {
  await db.run(`ATTACH DATABASE '${filename}' AS twitter;`);
  return db;
}

export async function openDb(filename) {
  const db = await open({
    filename,
    driver: sqlite3.cached.Database,
  });
  return db;
}
