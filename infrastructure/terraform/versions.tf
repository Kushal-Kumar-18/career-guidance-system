terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # No remote backend configured — state is local (terraform.tfstate in
  # this directory) for simplicity, matching the "smallest useful
  # architecture" goal. This is fine for a single-person portfolio
  # project; it means only run terraform from one machine at a time, and
  # never commit terraform.tfstate (see .gitignore). If you outgrow
  # this, add an S3 backend block here later — not needed to start.
}
