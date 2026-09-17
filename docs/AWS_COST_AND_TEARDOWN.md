# AWS Cost and Teardown

**Nothing described here is guaranteed permanently free.** AWS Free
Tier allowances are limited in amount/duration, vary by account
(especially accounts created after AWS's mid-2024 Free Tier changes),
and can change at any time. Always check your account's actual
eligibility on the **Billing → Free Tier** page in the AWS console, and
check the **Billing → Cost Explorer** dashboard regularly while this is
running — don't rely solely on this document.

## What this architecture costs, resource by resource

| Resource | Typical cost driver | Notes |
|---|---|---|
| EC2 `t3.micro` | Hourly compute charge (or free-tier hours/month, if your account qualifies) | The single biggest ongoing cost if outside any free allowance. Stop it when not in use (see below) — you're billed for running hours, not for the instance merely existing. |
| EBS root volume (20GB gp3) | Per-GB-month storage charge (or free-tier GB-months, if eligible) | Persists (and keeps costing) even while the instance is *stopped* — only `terraform destroy` removes it. |
| Data transfer out | Per-GB charge past a free monthly allowance | Negligible for a portfolio project's traffic levels. |
| CloudWatch Logs | Per-GB ingested/stored past a free allowance | Kept low by `log_retention_days = 14` (default) — logs auto-expire instead of accumulating forever. |
| CloudWatch alarm | First 10 alarms are free | This project creates exactly one (`enable_cpu_alarm`, on by default). |
| S3 (only if `enable_s3 = true`) | Per-GB storage + per-request charges past a free allowance | Off by default. Resume PDFs are small; this stays cheap even outside any free tier for a personal project's usage. |
| VPC, subnet, IGW, route table, security group, IAM role/policies | No charge | These AWS resource *types* have no associated cost by themselves. |

**Bottom line:** the EC2 instance (compute + its EBS volume) is the
only cost driver worth actively managing. Everything else is either
free by resource type or has such a low practical ceiling for this
project's traffic that it's not worth optimizing further.

## Reducing cost while not actively using the app

**Stop the instance (cheapest short pause, easy to resume):**

```bash
aws ec2 stop-instances --instance-ids $(terraform output -raw instance_public_ip 2>/dev/null || echo "<instance-id>")
```

(Better: get the instance ID directly — `terraform state show
aws_instance.app | grep '^id'` — since the output above only exposes
the IP.)

- Stops the EC2 compute charge.
- The EBS volume (and everything on it — your Docker images, the
  Postgres data volume, generated resumes if `STORAGE_DRIVER=local`)
  **keeps costing storage charges and is NOT deleted.**
- The instance gets a **new public IP** when restarted (unless you
  attach an Elastic IP, which is a small additional resource this
  project doesn't create, to keep things minimal) — expect to re-run
  `terraform output` and update anywhere you'd hard-coded the old IP
  (you shouldn't have, per this project's config, but double-check).

```bash
aws ec2 start-instances --instance-ids <instance-id>
```

Docker Compose's `restart: unless-stopped` policy means all four
containers come back up automatically once the instance boots — no
manual `docker compose up` needed after a stop/start cycle.

## Full teardown

```bash
cd infrastructure/terraform
terraform destroy
```

Review the plan Terraform shows before typing `yes` — it lists every
resource about to be deleted.

### What gets deleted

- The EC2 instance and its **EBS root volume** — this is the one that
  matters most: **all data on the instance is gone**, including the
  Postgres database (all users, saved careers, resume records — since
  Postgres itself also runs on that same volume, not RDS) and any
  locally-stored resume PDFs (`STORAGE_DRIVER=local`).
- The VPC, subnet, internet gateway, route table, security group.
- The IAM role, its policies, and the instance profile.
- The CloudWatch log group (and its log history) and, if
  `enable_cpu_alarm = true`, the alarm.
- The S3 bucket **and everything in it**, if `enable_s3 = true` — S3
  buckets with objects in them can't be destroyed by Terraform by
  default; either empty the bucket first (`aws s3 rm
  s3://<bucket-name> --recursive`) or add `force_destroy = true` to the
  bucket resource temporarily if you're sure you want everything gone.

### What does NOT get deleted automatically

- The EC2 key pair (`career-guidance-key`) — Terraform never created
  it, so it doesn't manage or delete it. Remove it yourself if you want
  it gone: `aws ec2 delete-key-pair --key-name career-guidance-key`.
- The local `career-guidance-key.pem` file on your machine.
- Anything in your Git repository (the app code itself is unaffected —
  only AWS resources are destroyed).
- CloudWatch Logs already exported/downloaded elsewhere.

### There is no backup step here — by design

This architecture doesn't include RDS automated backups or S3
versioning-as-backup (S3 versioning is explicitly `Suspended` in
`s3.tf` to avoid extra storage cost). **If you have data in the
deployed database or generated resumes you actually care about
keeping, export it before running `terraform destroy`:**

```bash
# On the EC2 instance, before destroying:
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U $POSTGRES_USER career_guidance > backup_$(date +%F).sql
scp -i career-guidance-key.pem ubuntu@<ip>:~/app/backup_*.sql .
```

If `enable_s3 = true` and you want to keep the files before deleting
the bucket:

```bash
aws s3 sync s3://<bucket-name> ./s3-backup/
```

## Recommended habit while this project is active

- Check **AWS Billing → Cost Explorer** at least weekly.
- Set up a **Billing Alert / Budget** (in the AWS Billing console,
  under Budgets) for a small threshold (e.g. $5) so you get an email if
  something unexpected starts accruing cost — this project doesn't
  create one via Terraform (it's account-level, not project-scoped,
  and setting a budget threshold that's meaningful to you is a personal
  choice, not something to hard-code into shared infrastructure code).
- When you're done actively demoing/using the deployment for a
  while, prefer `terraform destroy` over leaving the instance stopped
  indefinitely — a stopped instance's EBS volume still accrues storage
  charges with nothing to show for it.
