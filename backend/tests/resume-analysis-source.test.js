// Regression guard for master prompt problems 1 & 2: the "Analyze
// career from this resume" button (ResumePage.jsx's
// analyzeFromReviewedResume) must send source 'resume_upload', not
// 'merge'. Sending 'merge' silently unions the reviewed resume with
// whatever the user's stored profile already contains
// (candidateProfileService.merge), which is how a brand-new resume from
// a completely different professional background could still surface
// careers from an old, unrelated profile.
//
// There's no frontend test framework in this project (no jest/RTL), so
// this is a plain static check on the component's source rather than a
// rendered-component test — cheap, and it directly guards the exact
// regression that was observed rather than merely being "some test".
//
// Run with: npm test

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function run() {
  // This test file lives in backend/tests/; ResumePage.jsx is in the
  // separate frontend package — see ARCHITECTURE.md's "Frontend"
  // section (frontend/src/pages/*.jsx).
  const filePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages', 'ResumePage.jsx');
  const src = fs.readFileSync(filePath, 'utf8');

  const fnMatch = src.match(/function analyzeFromReviewedResume\(\)\s*{[\s\S]*?\n  }/);
  assert.ok(fnMatch, 'analyzeFromReviewedResume() not found in ResumePage.jsx — has it been renamed/moved?');
  const fnBody = fnMatch[0];

  assert.ok(
    /source:\s*'resume_upload'/.test(fnBody),
    "analyzeFromReviewedResume must navigate with source: 'resume_upload' (the resume-only analysis action)"
  );
  assert.ok(
    !/source:\s*'merge'/.test(fnBody),
    "analyzeFromReviewedResume must NOT send source: 'merge' — that silently mixes in the user's stored profile"
  );

  console.log('resume-analysis-source.test.js: "Analyze career from this resume" sends source=resume_upload, not merge ✓');
}

module.exports = async function () {
  run();
};
