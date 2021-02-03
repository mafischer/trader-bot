import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function attachDb(db, filepath) {
  await db.run(`ATTACH DATABASE '${filepath}' AS twitter;`);
  return db;
}

export async function openDb(filepath) {
  const db = await open({
    filepath,
    driver: sqlite3.cached.Database,
  });
  return db;
}
