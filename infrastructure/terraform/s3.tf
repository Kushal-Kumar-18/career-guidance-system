# Optional (var.enable_s3) — only created if you want the backend's
# STORAGE_DRIVER=s3 mode (see backend/src/services/storageService.js)
# instead of storing generated resumes on the EC2 instance's own disk.
# Genuinely optional for a single-instance deployment: local storage on
# the EBS volume works fine as long as you don't need files to survive
# terminating/replacing the instance. See docs/AWS_ARCHITECTURE.md for
# the tradeoff.

resource "aws_s3_bucket" "files" {
  count  = var.enable_s3 ? 1 : 0
  bucket = var.s3_bucket_name
}

# All four public-access blocks on, no exceptions — objects are only
# ever reachable via a short-lived presigned URL the backend generates
# per request (see S3Storage.resolveUrl), never a public bucket policy
# or ACL.
resource "aws_s3_bucket_public_access_block" "files" {
  count  = var.enable_s3 ? 1 : 0
  bucket = aws_s3_bucket.files[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  count  = var.enable_s3 ? 1 : 0
  bucket = aws_s3_bucket.files[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "files" {
  count  = var.enable_s3 ? 1 : 0
  bucket = aws_s3_bucket.files[0].id

  versioning_configuration {
    # "Enabled" would keep every overwritten resume version forever
    # (small extra cost, unnecessary for this project's needs).
    status = "Suspended"
  }
}
