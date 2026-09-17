# AWS Architecture

**Status: designed and written, not yet provisioned or run against a live
AWS account.** No AWS credentials or Terraform binary were available in
the environment this was built in — everything here was validated as
far as possible without a real account (see "How this was verified"
at the bottom) but you must run [docs/AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md)
yourself and treat the first `terraform apply` as the actual first
test of this infrastructure.

## Why this shape, not ECS/Fargate/RDS/ALB

An earlier pass explored a fuller ECS Fargate + ALB + RDS + ECR
architecture. That was deliberately replaced with this smaller one
because the priorities for this deployment are **low cost, hands-on
learning, and being able to personally explain every piece** — not
maximum AWS surface area. A single EC2 instance running Docker Compose
teaches Linux server administration, Docker networking, and a reverse
proxy directly, in a way that ECS's managed orchestration abstracts
away. See [docs/INTERVIEW_HANDBOOK.md](./INTERVIEW_HANDBOOK.md) for the
"why this over the bigger version" talking points.

## Diagram

```text
                         INTERNET
                            │
                            ▼
                     Security Group
                    (22 from your IP,
                      80, 443 open)
                            │
                            ▼
                    ┌───────────────┐
                    │  EC2 instance  │   Public subnet, dedicated VPC
                    │  (t3.micro)    │
                    │                │
                    │  ┌──────────┐  │
        80 ────────▶│  │  Nginx    │  │  ← only container publishing a host port
                    │  └────┬─────┘  │
                    │       │ /       (serves React static build)
                    │       │ /api (reverse-proxied)      
                    │       ▼          │
                    │  ┌──────────┐   │
                    │  │  Node/     │  │  internal Docker network only
                    │  │  Express   │  │  (127.0.0.1-equivalent — not
                    │  └───┬────┬──┘  │   reachable from outside the host)
                    │      │    │      │
                    │      ▼    ▼      │
                    │  ┌──────┐┌─────┐ │
                    │  │Postgres││ML  │ │  internal only
                    │  │(volume)││FastAPI│
                    │  └──────┘└─────┘ │
                    └───────────────┘
                            │
                            ▼
                  CloudWatch Logs (Docker
                  container logs via agent)
                            │
                  optional: S3 (resume storage,
                  only if enable_s3 = true)

                  IAM role (attached to the EC2
                  instance — no static AWS keys
                  anywhere in this project)
```

## Components and why each exists

| Component | Purpose | Terraform-managed? |
|---|---|---|
| **VPC + 1 public subnet** | Network isolation; the EC2 instance needs a subnet with a route to the internet | Yes (`network.tf`) |
| **Internet Gateway + route table** | Gives the public subnet (and the EC2 instance in it) a path to/from the internet | Yes (`network.tf`) |
| **Security group** | Only port 22 (from your IP), 80, 443 are open — everything else (4000, 8000, 5432) is unreachable from outside the instance | Yes (`security.tf`) |
| **EC2 instance (t3.micro, Ubuntu 22.04)** | Runs the entire application via Docker Compose | Yes (`ec2.tf`) |
| **IAM role + instance profile** | Grants the instance CloudWatch Logs write access (and S3 access if enabled) with no static credentials | Yes (`iam.tf`) |
| **CloudWatch Logs group** | Destination for Docker container logs, shipped by the CloudWatch agent installed via `user_data` | Yes (`cloudwatch.tf`) |
| **CloudWatch alarm (optional)** | Basic CPU-utilization alarm — free-tier eligible, on by default, toggle with `enable_cpu_alarm` | Yes (`cloudwatch.tf`) |
| **S3 bucket (optional)** | Resume/file storage surviving instance replacement — off by default, toggle with `enable_s3` | Yes (`s3.tf`) |
| **Nginx** | The application's only public entry point: serves the React build and reverse-proxies `/api` to the backend (there is no `/files` proxy — resumes are served only via the authenticated `/api/resume/download` route) | No — it's a Docker Compose service (`docker-compose.prod.yml`), not an AWS resource |
| **Docker Compose stack** | Runs `postgres`, `ml-service`, `backend`, `nginx` on the instance | No — deployed manually over SSH, deliberately kept separate from Terraform (see below) |

## Why application deployment is separate from Terraform

Terraform provisions the EC2 instance, its network, and its IAM
permissions. It does **not** clone the repository or run `docker
compose up` — that's done manually over SSH
([docs/AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md)). This is a
deliberate boundary:

- `terraform destroy` and re-`apply` becomes safe to reason about
  without wondering what application state might get wiped or
  re-deployed as a side effect.
- Redeploying a new version of the app (`git pull && docker compose up
  -d --build`) never requires touching Terraform or waiting for
  `user_data` to re-run (which only happens on instance replacement).
- It mirrors a real-world separation of concerns: infrastructure
  provisioning vs. application deployment are different jobs, even
  when (as here) the same person does both by hand.

## Data flow

**A user loads the app:**
```
Browser → http://<ec2-ip>/ → Nginx (serves React build)
```

**The app calls the API** (every `fetch('/api/...')` in the frontend):
```
Browser → http://<ec2-ip>/api/... → Nginx → backend:4000 (Docker network) → Postgres / ml-service
```

**A recommendation request specifically:**
```
Browser → Nginx → backend → ml-service:8000 (Docker network, never public) → trained model → backend → Postgres (recommendation_history) → Nginx → Browser
```

**A resume PDF download:**
```
Browser (with Bearer token) → Nginx → backend GET /api/resume/download
→ storage driver → backend streams the PDF back.
```
The same authenticated path applies under both storage drivers — only
where the bytes are read from differs:

- `STORAGE_DRIVER=local` (default): read from the backend container's
  `/app/storage` volume mount.
- `STORAGE_DRIVER=s3` (optional): read from the private S3 bucket (no
  public-read policy).

There is deliberately **no** unauthenticated `/files/...` route and no
presigned URL handed to the browser today. The storage key is derived
from the authenticated user id, so a user can only ever fetch their own
file. `S3Storage.resolveUrl()` remains available as the hook for a
future direct-to-S3 download (which would also need a bucket CORS rule,
and the URL must only be minted after ownership is verified) — see
docs/SECURITY.md.

## What's deliberately NOT included, and why

| Not included | Why |
|---|---|
| ECS/Fargate, ALB, ECR | One EC2 instance running Docker Compose does the same job at a fraction of the moving parts and cost, for this project's scale |
| RDS | PostgreSQL runs as a Docker container on the same instance, with a named volume for persistence. Genuinely fine for a single-instance portfolio deployment — see the tradeoff note below |
| NAT Gateway | Nothing runs in a private subnet, so there's nothing that needs outbound-only internet access through a NAT — the one subnet is public and the instance has a public IP directly |
| CloudFront, Route 53 | No custom domain or CDN caching need for a portfolio deployment; add later if the project grows |
| Redis, SQS, SNS, OpenSearch | No feature in this application currently needs a queue, cache, notification fan-out, or search cluster. The CPU alarm has no notification target — see it in the CloudWatch console directly, or add SNS yourself later if you want email/SMS alerts. |

### The RDS tradeoff, explicitly

> PostgreSQL-in-Docker is used here to keep this portfolio deployment
> inexpensive and simple — everything (app + database) runs on one
> Free-Tier-eligible instance. In a larger production SaaS system,
> Amazon RDS would be the stronger choice: automated backups, Multi-AZ
> failover, point-in-time recovery, and no risk of the database
> disappearing if the EC2 instance is replaced. The tradeoff here is
> explicit and deliberate, not an oversight.

## How this was verified (and what wasn't)

- Every `.tf` file was parsed with `terraform-config-inspect` (no
  syntax errors, all resource/variable references resolve to something
  defined) — this is **not** the same as `terraform validate` or
  `terraform plan`, which need the real Terraform CLI and AWS
  credentials, neither of which were available in this environment.
- The `user_data.sh.tftpl` bootstrap script was rendered with sample
  values and syntax-checked with `bash -n` — confirmed no shell syntax
  errors.
- `docker-compose.prod.yml` was validated as syntactically correct YAML.
- **Not verified:** an actual `terraform apply`, the CloudWatch agent
  actually installing and shipping logs, the Docker Compose stack
  actually building/running on a real EC2 instance, or any live HTTP
  request through Nginx. Run through
  [docs/AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md) end-to-end and treat
  that as the real first test.
