// Run this from your backend folder: node recreate-db-utf8.js
//
// WARNING: this DROPS the database named in your DATABASE_URL and
// recreates it empty with ENCODING 'UTF8', then reapplies
// db/migrations/0001_baseline.sql, 0002_add_recommendation_source.sql,
// and 0003_ml_feedback.sql in order. ALL EXISTING DATA IN THAT
// DATABASE IS LOST. Only run this against a local/dev database you
// don't mind wiping. If you have real data to keep, back it up first
// with pg_dump, or ask before running this.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS = [
  '0001_baseline.sql',
  '0002_add_recommendation_source.sql',
  '0003_ml_feedback.sql',
];

async function main() {
  const appUrl = new URL(process.env.DATABASE_URL.replace('postgresql://', 'postgres://'));
  const dbName = appUrl.pathname.replace('/', '');
  if (!dbName) throw new Error('Could not read a database name out of DATABASE_URL.');

  // Connect to the 'postgres' maintenance database -- you can't drop a
  // database while connected to it.
  const maintenanceUrl = new URL(appUrl.toString());
  maintenanceUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: maintenanceUrl.toString() });
  await admin.connect();

  console.log(`Terminating other connections to "${dbName}"...`);
  await admin.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid();`,
    [dbName]
  );

  console.log(`Dropping database "${dbName}" (all data in it is lost)...`);
  await admin.query(`DROP DATABASE IF EXISTS "${dbName}";`);

  console.log(`Creating "${dbName}" fresh with ENCODING 'UTF8'...`);
  await admin.query(`CREATE DATABASE "${dbName}" WITH ENCODING 'UTF8' TEMPLATE template0;`);
  await admin.end();

  const app = new Client({ connectionString: process.env.DATABASE_URL });
  await app.connect();

  for (const file of MIGRATIONS) {
    const filePath = path.join(__dirname, '..', 'db', 'migrations', file);
    console.log(`Applying ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await app.query(sql);
  }
  await app.end();

  console.log('\nDone. "%s" is now UTF8 with the current schema applied.', dbName);
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
