variable "aws_region" {
  description = "AWS region to deploy into. Free-tier eligibility for EC2/S3 is region-independent, but pick one close to you for latency."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short name used as a prefix for all resource names and tags."
  type        = string
  default     = "career-guidance"
}

variable "environment" {
  description = "Environment name (e.g. dev, prod) — used in tags/naming only, this project has a single environment."
  type        = string
  default     = "prod"
}

# ---------------------------------------------------------------------------
# EC2
# ---------------------------------------------------------------------------

variable "instance_type" {
  description = "EC2 instance type. t3.micro is Free-Tier eligible for new AWS accounts (check your account's actual eligibility — Free Tier terms change and not all accounts/regions qualify)."
  type        = string
  default     = "t3.micro"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB. 20-30GB is comfortable for Docker images + Postgres data for this project; the EBS Free Tier (where eligible) covers up to 30GB of gp2/gp3 storage."
  type        = number
  default     = 20
}

variable "key_pair_name" {
  description = "Name of an EXISTING EC2 key pair in this region, used for SSH access. Create one first (docs/AWS_SETUP_GUIDE.md covers this) — Terraform does not create or manage the private key."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance on port 22. Set this to YOUR public IP with /32 (e.g. \"203.0.113.10/32\") — never leave this as 0.0.0.0/0."
  type        = string
}

# ---------------------------------------------------------------------------
# Networking
# ---------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the dedicated VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the single public subnet the EC2 instance lives in. No private subnets/NAT Gateway are created — everything for this project runs on the one instance, so there's nothing to put in a private subnet."
  type        = string
  default     = "10.20.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for the public subnet. Leave null to let Terraform pick the first AZ available in aws_region automatically."
  type        = string
  default     = null
}

# ---------------------------------------------------------------------------
# S3 (optional — resume/file storage)
# ---------------------------------------------------------------------------

variable "enable_s3" {
  description = "Whether to create an S3 bucket for resume/file storage (STORAGE_DRIVER=s3 on the backend). If false, the backend uses STORAGE_DRIVER=local with files persisted on the EC2 instance's EBS volume instead — genuinely sufficient for a single-instance portfolio deployment. Set true only if you want the hands-on S3/IAM experience or plan to survive instance replacement without losing generated resumes."
  type        = bool
  default     = false
}

variable "s3_bucket_name" {
  description = "Globally-unique S3 bucket name, used only when enable_s3 = true. S3 bucket names are global across ALL AWS accounts, so the default below will likely collide — set your own (e.g. \"career-guidance-files-yourname-2026\")."
  type        = string
  default     = "career-guidance-files-changeme"
}

# ---------------------------------------------------------------------------
# CloudWatch
# ---------------------------------------------------------------------------

variable "enable_cpu_alarm" {
  description = "Whether to create a basic CloudWatch alarm on EC2 CPU utilization. CloudWatch's free tier includes 10 alarms and basic (5-minute) EC2 metrics at no charge, so this is essentially free — but it's a togglable variable rather than hard-coded so you can see exactly what it costs to remove it."
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "How long to keep the CloudWatch Logs group for application logs. Shorter retention = lower cost; 14 days is plenty for a portfolio project."
  type        = number
  default     = 14
}
