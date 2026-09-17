// Exercises resumeExtractionService against real (generated) PDF and
// DOCX files, and the malformed/empty-file error paths required by
// master prompt section 20 ("missing fields", "malformed files",
// "empty files", "unsupported files"). Generates its own fixtures at
// run time (via pdfkit/docx, already project dependencies or
// dev-installed) rather than committing binary test fixtures.
//
// Run with: npm test

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const resumeExtractionService = require('../src/services/resumeExtractionService');

async function buildSamplePdf() {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text('Jane Doe');
  doc.fontSize(10).text('jane.doe@example.com | +1 415-555-0132');
  doc.moveDown();
  doc.fontSize(14).text('Summary');
  doc.fontSize(10).text('Backend engineer with a passion for distributed systems.');
  doc.moveDown();
  doc.fontSize(14).text('Skills');
  doc.fontSize(10).text('Python, Django, PostgreSQL, AWS, Docker, Git');
  doc.moveDown();
  doc.fontSize(14).text('Education');
  doc.fontSize(10).text('B.Tech Computer Science, XYZ University');
  doc.moveDown();
  doc.fontSize(14).text('Experience');
  doc.fontSize(10).text('Software Engineer - Acme Corp');
  doc.text('2021 - Present');
  doc.text('Built and maintained backend services using Django and PostgreSQL.');
  doc.moveDown();
  doc.fontSize(14).text('Certifications');
  doc.fontSize(10).text('AWS Certified Solutions Architect');
  doc.moveDown();
  doc.fontSize(14).text('Interests');
  doc.fontSize(10).text('Chess, Hiking, Open source');
  doc.end();

  return done;
}

async function run() {
  // --- Happy path: PDF ---
  const pdfBuffer = await buildSamplePdf();
  const pdfResult = await resumeExtractionService.extractFromBuffer(pdfBuffer, 'application/pdf', 'sample.pdf');
  assert.equal(pdfResult.extracted.email, 'jane.doe@example.com');
  assert.equal(pdfResult.extracted.education, 'B.Tech Computer Science, XYZ University');
  assert.deepEqual(pdfResult.extracted.interests, ['Chess', 'Hiking', 'Open source']); // no pdf-parse page-marker leakage
  assert.equal(pdfResult.extracted.experience[0].company, 'Acme Corp');

  // --- Happy path: DOCX ---
  const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
  const docx = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'John Smith', heading: HeadingLevel.HEADING_1 }),
          new Paragraph('john.smith@example.com'),
          new Paragraph({ text: 'Technical Skills', heading: HeadingLevel.HEADING_2 }),
          new Paragraph('SQL, Python, Apache Spark'),
          new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_2 }),
          new Paragraph('M.C.A, RVITM Bengaluru'),
        ],
      },
    ],
  });
  const docxBuffer = await Packer.toBuffer(docx);
  const docxResult = await resumeExtractionService.extractFromBuffer(
    docxBuffer,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'sample.docx'
  );
  assert.equal(docxResult.extracted.email, 'john.smith@example.com');
  assert.ok(docxResult.extracted.skills.includes('SQL'));
  assert.equal(docxResult.extracted.education, 'M.C.A, RVITM Bengaluru');

  // --- Error path: empty buffer ---
  await assert.rejects(
    () => resumeExtractionService.extractFromBuffer(Buffer.alloc(0), 'application/pdf', 'a.pdf'),
    (err) => err.status === 422
  );

  // --- Error path: malformed/corrupt PDF ---
  await assert.rejects(
    () => resumeExtractionService.extractFromBuffer(Buffer.from('not a real pdf'), 'application/pdf', 'a.pdf'),
    (err) => err.status === 422
  );

  // --- Error path: DOCX with no readable text ---
  const emptyDocx = new Document({ sections: [{ children: [] }] });
  const emptyDocxBuffer = await Packer.toBuffer(emptyDocx);
  await assert.rejects(
    () =>
      resumeExtractionService.extractFromBuffer(
        emptyDocxBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'empty.docx'
      ),
    (err) => err.status === 422
  );

  console.log('resume-extraction.test.js: all assertions passed');
}

module.exports = run;

if (require.main === module) {
  run().catch((err) => {
    console.error('resume-extraction.test.js FAILED:', err);
    process.exit(1);
  });
}
