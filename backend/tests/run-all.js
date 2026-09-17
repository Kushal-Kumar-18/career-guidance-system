// Minimal dependency-free test runner — the project intentionally has
// no test framework installed (jest/mocha), and these tests don't need
// one: each file exports an async function that throws on failure. This
// just runs them all sequentially and exits non-zero on the first
// failure, so it works as an `npm test` and in CI the same way.

const path = require('node:path');
const fs = require('node:fs');

const testsDir = __dirname;
const files = fs.readdirSync(testsDir).filter((f) => f.endsWith('.test.js'));

(async () => {
  let failed = false;
  for (const file of files) {
    const run = require(path.join(testsDir, file));
    try {
      await run();
    } catch (err) {
      failed = true;
      console.error(`FAILED: ${file}`);
      console.error(err);
    }
  }
  if (failed) process.exit(1);
  console.log(`\nAll test files passed (${files.length} file(s)).`);
})();
