const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Section 5/12 of the master prompt: uploaded resumes are validated by
// type and size and handled safely. Memory storage is used deliberately
// — the file is only ever needed transiently (to extract text), never
// written to disk, so there is no path-traversal or stale-file surface
// to worry about. Nothing here is persisted; see resumeExtractionService.

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

function extensionOf(filename = '') {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx).toLowerCase();
}

function fileFilter(req, file, cb) {
  const extOk = ALLOWED_EXTENSIONS.has(extensionOf(file.originalname));
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
  if (!extOk || !mimeOk) {
    return cb(new ApiError(422, 'Only PDF (.pdf) or Word (.docx) resume files are supported.'));
  }
  cb(null, true);
}

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.resumeUploadMaxMb * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

module.exports = { resumeUpload };
