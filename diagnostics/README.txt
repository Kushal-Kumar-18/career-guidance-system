HOW TO USE THIS
================
1. Copy diagnose_profile_bug.js into your project's `backend` folder
   (same level as package.json).
2. In that backend folder run:
       npm install pg-mem --no-save
       node diagnose_profile_bug.js

WHAT IT DOES
============
Spins up a real, in-memory Postgres engine, loads your ACTUAL
db/schema.sql into it, then calls your ACTUAL
src/repositories/profileRepository.js, src/services/profileService.js
and src/validators/profileValidators.js -- the real files sitting in
your backend folder right now -- through the exact request shape the
Resume page sends when applying a resume to your profile.

HOW TO READ THE RESULT
=======================
- If it prints "ALL SCENARIOS COMPLETED WITHOUT THROWING." at the end,
  your backend FILES are correct. The 500 you're seeing is coming from
  something else running (a stale/duplicate node process still serving
  the old code, wrong DATABASE_URL, or a DB whose columns don't match
  db/schema.sql). Kill all node processes (taskkill /IM node.exe /F on
  Windows), confirm the DB has the columns listed in db/schema.sql, and
  restart.

- If it throws an error instead, paste that exact error text back --
  that's the real bug, direct from your own files, not a guess.

CHECK-DB-ENCODING.JS / RECREATE-DB-UTF8.JS
===========================================
The "has no equivalent in encoding WIN1252" error means your Postgres
DATABASE itself (not just the connection) was created with WIN1252 as
its permanent encoding -- common on Windows Postgres installs whose
locale defaults to something like "English_United States.1252". This
cannot be changed on an existing database; it has to be recreated.

1. Copy both files into your backend folder.
2. Confirm the diagnosis (no data changed):
       node check-db-encoding.js
   It will print every database on your server and its real encoding,
   and tell you plainly if the one your app uses isn't UTF8.
3. If confirmed, fix it (THIS WIPES ALL DATA in that database --
   fine for a dev DB, back up first with pg_dump if you have real data
   you want to keep):
       node recreate-db-utf8.js
   This drops the database, recreates it as UTF8, and reapplies
   db/migrations/0001, 0002, 0003 automatically.
4. Restart the backend and retry.
