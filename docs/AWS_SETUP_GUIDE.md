# AWS Setup Guide

Start-to-finish instructions assuming: a fresh AWS account, no existing
AWS infrastructure, and this repository available on your machine.
Read [docs/AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md) first if you
haven't — it explains *why* each piece here exists.

**This has not been run end-to-end against a live AWS account** (see
that doc's "How this was verified" section) — you are the first person
to actually execute these steps. Go slowly, verify each stage's output
before moving to the next, and don't hesitate to stop and read an
error message fully before re-running a command.

**Cost warning, upfront:** AWS Free Tier allowances are limited, change
over time, and are not guaranteed for every account/region. Nothing in
this guide is "unlimited free" — read
[docs/AWS_COST_AND_TEARDOWN.md](./AWS_COST_AND_TEARDOWN.md) before you
apply anything, and check your AWS Billing dashboard regularly while
this is running.

---

## 1. Install and verify tools

| Tool | Install | Verify |
|---|---|---|
| AWS CLI v2 | https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html | `aws --version` |
| Terraform ≥ 1.5 | https://developer.hashicorp.com/terraform/install | `terraform version` |
| Docker | https://docs.docker.com/get-docker/ | `docker --version` |
| Docker Compose plugin | bundled with modern Docker Desktop/Engine | `docker compose version` |
| Git | usually preinstalled on Linux/macOS | `git --version` |

```bash
aws --version
terraform version
docker --version
docker compose version
git --version
```

All five should print a version number with no errors before continuing.

## 2. Create an AWS account and a non-root IAM user

1. Sign up at https://aws.amazon.com if you don't have an account.
   AWS may offer Free Tier credits/allowances for new accounts — check
   your account's actual eligibility on the **Billing → Free Tier**
   page; don't assume based on general internet advice, as terms
   change.
2. **Do not use your root account credentials for day-to-day work.**
   In the IAM console, create an IAM user for yourself (or better, an
   IAM Identity Center / SSO user) with programmatic access, and attach
   a policy scoped to what this project needs (EC2, IAM role/policy
   management, S3, CloudWatch, VPC — `PowerUserAccess` is a reasonable
   starting point for a personal learning account; tighten it later if
   you want the extra IAM practice).
3. Choose a region and stick with it for this project — `us-east-1` is
   the default in `terraform.tfvars.example`, but pick whatever's
   closest to you.

## 3. Configure AWS CLI authentication

```bash
aws configure
# AWS Access Key ID: <your IAM user's key>
# AWS Secret Access Key: <your IAM user's secret>
# Default region name: us-east-1   (or your chosen region)
# Default output format: json
```

Verify:

```bash
aws sts get-caller-identity
```

This should print your IAM user's ARN, not a root account ARN. If it
errors, your credentials aren't configured correctly — fix this before
continuing; Terraform uses these same credentials.

## 4. Create an EC2 key pair

Terraform references an *existing* key pair by name — it doesn't create
or manage the private key file itself (so the private key never touches
Terraform state).

```bash
aws ec2 create-key-pair \
  --key-name career-guidance-key \
  --query 'KeyMaterial' \
  --output text > career-guidance-key.pem

chmod 400 career-guidance-key.pem
```

Keep `career-guidance-key.pem` somewhere safe — you cannot download it
again. Do not commit it to Git (it matches `*.pem` in
`infrastructure/terraform/.gitignore`).

## 5. Find your public IP (for SSH access)

```bash
curl -s https://checkip.amazonaws.com
```

You'll use this as `allowed_ssh_cidr` in the next step, as `<that-ip>/32`.
If your home/office IP changes (common with residential ISPs), you'll
need to update this variable and re-`apply` to keep SSH access working.

## 6. Configure Terraform variables

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
key_pair_name    = "career-guidance-key"
allowed_ssh_cidr = "<your-ip-from-step-5>/32"
# leave everything else at its default unless you have a reason to change it
```

`terraform.tfvars` is git-ignored — never commit it.

## 7. Terraform init, validate, plan

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan
```

Read the `plan` output before applying. It should show roughly 15-18
resources to create: a VPC, subnet, internet gateway, route table +
association, security group, IAM role + policies + instance profile,
CloudWatch log group (+ alarm, since `enable_cpu_alarm`
defaults to `true`), and the EC2 instance itself. It should show **zero**
S3 resources unless you set `enable_s3 = true`.

## 8. Terraform apply

```bash
terraform apply
```

Type `yes` when prompted after reviewing the plan one more time. This
takes a few minutes (mostly waiting for the EC2 instance to launch and
pass its status checks).

When it finishes, note the outputs:

```bash
terraform output
```

You'll see `instance_public_ip`, `ssh_command`, `application_url`,
`cloudwatch_log_group`, and (if enabled) `s3_bucket_name`.

## 9. Wait for the bootstrap script, then connect

The `user_data` script (Docker + Compose + CloudWatch agent install)
runs automatically on first boot — give it 2-3 minutes after the
instance shows as "running" before connecting.

```bash
ssh -i career-guidance-key.pem ubuntu@$(terraform output -raw instance_public_ip)
```

Once connected, confirm bootstrap finished:

```bash
cat ~/BOOTSTRAP_DONE
docker --version
docker compose version
```

If `BOOTSTRAP_DONE` doesn't exist yet, wait another minute and try
again, or check `/var/log/cloud-init-output.log` for what's still
running or what failed (see
[AWS_TROUBLESHOOTING.md](./AWS_TROUBLESHOOTING.md#ec2--bootstrap)).

## 10. Deploy the application

Still connected via SSH:

```bash
cd ~/app
git clone <your-repo-url> .
# or: scp/rsync the project up from your machine if it isn't in a Git remote yet
```

Configure environment files (these are real secrets — create them
directly on the instance, never commit them):

```bash
cp .env.example .env
nano .env
# set POSTGRES_USER and a real, generated POSTGRES_PASSWORD

cp backend/.env.example backend/.env
nano backend/.env
# set a real AUTH_SECRET (generate with: openssl rand -hex 32)
# set ADZUNA_APP_ID / ADZUNA_APP_KEY if you have them (optional feature)
# if enable_s3=true in Terraform: set STORAGE_DRIVER=s3 and S3_BUCKET_NAME
#   to the bucket name from `terraform output s3_bucket_name`
# set CORS_ALLOWED_ORIGINS=http://<this-instance's-public-ip>
#   (Nginx serves the frontend same-origin, so this mainly matters if
#   you ever call the API from a different origin)

cp ml-service/.env.example ml-service/.env
nano ml-service/.env
# defaults are usually fine as-is
```

Build and start the stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

All four services (`postgres`, `ml-service`, `backend`, `nginx`) should
show as `running`/`healthy`.

## 11. Verify

From your own machine (not the EC2 instance):

```bash
curl http://$(terraform output -raw instance_public_ip)/api/health
```

Expected: `{"success":true,"data":{"api":"ok","database":"ok","mlService":"ok"}}`

Then open `http://<the-ip>/` in a browser and walk through the app —
register, log in, view a career recommendation, generate a resume.
See [AWS_TROUBLESHOOTING.md](./AWS_TROUBLESHOOTING.md) if anything
doesn't come up healthy.

## 12. Redeploying after a code change

```bash
ssh -i career-guidance-key.pem ubuntu@<ip>
cd ~/app
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

No Terraform involved — this is the separation of concerns described
in [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md#why-application-deployment-is-separate-from-terraform).

---

## Reference: what each Terraform resource does

### VPC / networking

One VPC (`10.20.0.0/16` by default), one public subnet
(`10.20.1.0/24`), an internet gateway, and a route table sending
`0.0.0.0/0` traffic through it. No private subnets, no NAT Gateway —
the single EC2 instance lives directly in the public subnet with a
public IP.

```
Internet ⇄ Internet Gateway ⇄ Route Table ⇄ Public Subnet ⇄ EC2 instance
```

### IAM

One role (`${project_name}-ec2-role`), assumable only by the EC2
service, with:
- A policy granting exactly `logs:CreateLogStream` /
  `logs:PutLogEvents` / `logs:DescribeLogStreams`, scoped to only this
  project's log group ARN — not full `CloudWatchAgentServerPolicy`.
- (If `enable_s3 = true`) a policy granting exactly
  `s3:PutObject`/`GetObject`/`DeleteObject`, scoped to only this
  project's bucket ARN.

This is attached to the instance via an instance profile — the
instance gets temporary, auto-rotating credentials from the AWS
metadata service, never a static access key.

### RDS

Not used — see [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md#the-rds-tradeoff-explicitly).

### S3 (optional)

Created only if `enable_s3 = true`: one bucket, all four
public-access-block settings on, AES-256 default encryption, object
versioning suspended (to avoid the extra storage cost of keeping every
resume revision). Never has a public bucket policy — objects are only
reachable via presigned URLs the backend generates per request.

### ECS/Fargate

Not used — see [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md#why-this-shape-not-ecsfargaterdsalb).

---

## Uninstalling / starting over

If you need to tear everything down and start fresh, see
[AWS_COST_AND_TEARDOWN.md](./AWS_COST_AND_TEARDOWN.md) — don't just
delete resources by hand in the console, since Terraform's state file
will then be out of sync with reality.
