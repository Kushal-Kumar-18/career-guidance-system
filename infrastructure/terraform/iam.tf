# The EC2 instance gets AWS permissions via this IAM role + instance
# profile (attached in ec2.tf) — never via access keys baked into
# .env/user-data/AMI/Docker images. This is how the backend can call S3
# (when enable_s3 = true) and how the CloudWatch agent can ship logs,
# without a single static credential existing anywhere in this project.

resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Minimum needed for the CloudWatch agent (installed by user_data in
# ec2.tf) to create log streams and ship log events — not full
# CloudWatchAgentServerPolicy, which also grants metrics/config-fetch
# permissions this project doesn't use.
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.project_name}-cloudwatch-logs"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
      ]
      Resource = "${aws_cloudwatch_log_group.app.arn}:*"
    }]
  })
}

# Scoped to exactly this bucket, exactly these actions — the backend
# only ever needs to put/get/delete objects it created, never list or
# manage the bucket itself. Only created when enable_s3 = true.
resource "aws_iam_role_policy" "s3_access" {
  count = var.enable_s3 ? 1 : 0
  name  = "${var.project_name}-s3-access"
  role  = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
      ]
      Resource = "${aws_s3_bucket.files[0].arn}/*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}
