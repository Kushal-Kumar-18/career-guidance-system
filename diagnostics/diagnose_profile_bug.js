// Ad-hoc integration test: runs the ACTUAL repository/service/controller
// code from this project against a real (in-memory) Postgres engine, so
// we exercise real SQL instead of guessing. Not part of the delivered
// project -- diagnostic only.
const path = require('path');
const fs = require('fs');
const { newDb } = require('pg-mem');

const db = newDb({ autoCreateForeignKeyIndices: true });
db.public.registerFunction({ name: 'now', returns: 'timestamptz', implementation: () => new Date() });

let schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
// pg-mem doesn't support trigger/function syntax reliably; strip that
// block entirely for this test -- it only auto-touches updated_at,
// which profileRepository.upsert already sets explicitly, so it has no
// bearing on the bug being investigated.
schemaSql = schemaSql.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;.*$/m, '');
schemaSql = schemaSql.replace(/CREATE OR REPLACE FUNCTION touch_updated_at[\s\S]*$/, '');
db.public.none(schemaSql);

// Seed a user so profiles.user_id FK is satisfiable (matches the REAL schema's users columns).
db.public.none(`INSERT INTO users (id, username, email, password_hash, role) VALUES (1, 'testuser', 'test@example.com', 'x', 'user')`);

const { Pool } = db.adapters.createPg();

// Intercept `require('pg')` so backend/src/config/db.js picks up the
// in-memory Pool instead of trying to open a real TCP connection.
const Module = require('module');
const pgPath = require.resolve('pg');
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: { Pool } };

process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';
process.env.AUTH_SECRET = 'test-secret-value-0123456789-0123456789';
process.env.NODE_ENV = 'test';

async function main() {
  const profileRepository = require('./src/repositories/profileRepository');
  const profileService = require('./src/services/profileService');
  const { validateProfileUpdate } = require('./src/validators/profileValidators');

  console.log('--- 1. GET profile (no row yet) ---');
  let profile = await profileService.getProfile(1);
  console.log(profile);

  console.log('\n--- 2. First save from ProfilePage (normal fields) ---');
  let payload = validateProfileUpdate({
    education: 'BSc Computer Science',
    skills: 'JavaScript, SQL',
    interests: 'Backend systems',
    experience_years: 2,
    certifications: '',
    projects: 'Built a chat app',
    preferred_location: 'Bengaluru',
    salary_expectation: '12 LPA',
  });
  profile = await profileService.updateProfile(1, payload);
  console.log(profile);

  console.log('\n--- 3. Simulate the EXACT frontend "apply resume to profile" request ---');
  // This mirrors mergeResumeIntoProfile() output: full spread of the
  // existing profile row (including id/user_id/updated_at) plus the
  // merged resume fields -- exactly what ResumePage.jsx PUTs.
  const mergedFromFrontend = {
    ...profile, // id, user_id, education, skills, ..., updated_at (Date object!)
    education: profile.education, // preferExisting kept it
    skills: 'JavaScript, SQL, Python, React', // union with resume skills
    interests: profile.interests,
    certifications: 'AWS Certified Cloud Practitioner',
    projects: profile.projects,
    experience_years: 3, // Math.max(2, 3)
  };
  console.log('Request body the frontend would send:', JSON.stringify(mergedFromFrontend, null, 2));
  payload = validateProfileUpdate(mergedFromFrontend);
  console.log('Validated payload (extra keys stripped):', payload);
  profile = await profileService.updateProfile(1, payload);
  console.log('Resulting profile row:', profile);

  console.log('\n--- 4. Edge case: experience_years as empty string (the historical bug) ---');
  payload = validateProfileUpdate({ experience_years: '' });
  profile = await profileService.updateProfile(1, payload);
  console.log('Survived empty-string experience_years:', profile.experience_years);

  console.log('\n--- 5. Edge case: partial save must not blank other fields ---');
  payload = validateProfileUpdate({ preferred_location: 'Mumbai' });
  profile = await profileService.updateProfile(1, payload);
  console.log('skills still present after unrelated partial save?', profile.skills);
  console.log('preferred_location updated?', profile.preferred_location);

  console.log('\nALL SCENARIOS COMPLETED WITHOUT THROWING.');
}

main().catch((err) => {
  console.error('\n!!! THREW AN ERROR !!!');
  console.error(err);
  process.exit(1);
});
