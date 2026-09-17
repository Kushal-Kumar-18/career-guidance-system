const fs = require('fs');
const path = require('path');
const env = require('../config/env');

// Storage abstraction (section 27). Both drivers implement the same
// interface — save/read/exists — so callers (resumeService) never know or
// care which one is active. Switch via STORAGE_DRIVER=local|s3.
//
// IMPORTANT: stored objects are private user data (resume PDFs). Neither
// driver exposes a publicly reachable URL any more; the only way to read
// a stored file is through the authenticated, ownership-checked route
// GET /api/resume/download, which calls read() below. The previous
// LocalStorage.resolveUrl() returned a `/files/...` path served by an
// unauthenticated express.static mount — that mount has been removed
// from app.js and must not be reintroduced.
class LocalStorage {
  constructor(basePath) {
    this.basePath = basePath;
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  async save(relativePath, buffer) {
    const fullPath = path.join(this.basePath, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return { path: relativePath, driver: 'local' };
  }

  async read(relativePath) {
    return fs.readFileSync(path.join(this.basePath, relativePath));
  }

  // eslint-disable-next-line require-await
  async exists(relativePath) {
    return fs.existsSync(path.join(this.basePath, relativePath));
  }
}

// S3-backed implementation, used in AWS deployment (STORAGE_DRIVER=s3).
// Objects are private (no bucket policy grants public read — see
// infrastructure/terraform/modules/s3); access is always via a
// short-lived presigned GET URL, generated per request. The bucket is
// never made public and no AWS credentials are ever handed to the
// frontend — see docs/AWS_ARCHITECTURE.md.
class S3Storage {
  constructor({ bucket, region, presignedUrlTtlSeconds }) {
    // Lazy-required so the AWS SDK is only loaded (and only needs to be
    // installed) when STORAGE_DRIVER=s3 is actually configured — local
    // development never needs these packages.
    const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    this.bucket = bucket;
    this.presignedUrlTtlSeconds = presignedUrlTtlSeconds;
    this.client = new S3Client({ region });
    this.PutObjectCommand = PutObjectCommand;
    this.GetObjectCommand = GetObjectCommand;
    this.getSignedUrl = getSignedUrl;
  }

  async save(relativePath, buffer) {
    await this.client.send(
      new this.PutObjectCommand({
        Bucket: this.bucket,
        Key: relativePath,
        Body: buffer,
        ContentType: 'application/pdf',
        ServerSideEncryption: 'AES256',
      })
    );
    return { path: relativePath, driver: 's3' };
  }

  async read(relativePath) {
    const result = await this.client.send(
      new this.GetObjectCommand({ Bucket: this.bucket, Key: relativePath })
    );
    const chunks = [];
    for await (const chunk of result.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async exists(relativePath) {
    try {
      await this.client.send(new this.GetObjectCommand({ Bucket: this.bucket, Key: relativePath }));
      return true;
    } catch (err) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return false;
      throw err;
    }
  }

  // Short-lived presigned GET for the private object. NOT used by the
  // download route today (which streams bytes through the authenticated
  // backend for both drivers, so access control is identical either way).
  // Kept as the hook for a future optimization that hands the download
  // straight to S3 — doing that would also require a bucket CORS rule
  // allowing the frontend origin, and the URL must only ever be minted
  // AFTER the caller's ownership of the file has been verified.
  async resolveUrl(relativePath) {
    const command = new this.GetObjectCommand({ Bucket: this.bucket, Key: relativePath });
    return this.getSignedUrl(this.client, command, { expiresIn: this.presignedUrlTtlSeconds });
  }
}

function buildStorage() {
  if (env.storageDriver === 'local') {
    return new LocalStorage(path.resolve(env.localStoragePath));
  }
  if (env.storageDriver === 's3') {
    if (!env.s3BucketName) {
      throw new Error('STORAGE_DRIVER=s3 requires S3_BUCKET_NAME to be set.');
    }
    return new S3Storage({
      bucket: env.s3BucketName,
      region: env.awsRegion,
      presignedUrlTtlSeconds: env.s3PresignedUrlTtlSeconds,
    });
  }
  throw new Error(`Unsupported STORAGE_DRIVER: ${env.storageDriver}`);
}

module.exports = buildStorage();
