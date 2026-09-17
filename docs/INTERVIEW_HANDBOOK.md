# Interview Handbook — AWS Deployment

Everything in this document describes what's actually in this
repository's `infrastructure/terraform/` and `docker-compose.prod.yml`
— nothing here should describe a service that wasn't implemented.
Pair this with [HANDBOOK.md](../HANDBOOK.md) at the repo root for the
application side of the interview story.

## The one-paragraph explanation

> I containerized my Node.js backend, Python ML service, and a
> Postgres database using Docker Compose, fronted by an Nginx
> container that serves the React build and reverse-proxies API
> requests to the backend. I run the whole stack on a single Amazon
> EC2 instance, provisioned with Terraform, inside a small dedicated
> VPC. An IAM role gives the instance CloudWatch Logs access — and S3
> access for resume storage, if I enable that — without any static AWS
> credentials anywhere in the project. Security groups restrict SSH to
> my own IP and only expose HTTP/HTTPS publicly; the database and ML
> service are never reachable from outside the instance. I chose a
> single EC2 instance over ECS/Fargate and RDS specifically to keep
> cost near the free tier and to get hands-on experience with the
> Linux/networking/Docker layer that a managed orchestrator would
> otherwise hide from me.

## Service-by-service justification

### Terraform
Infrastructure as code — the entire AWS footprint (VPC, subnet,
security group, IAM role, EC2 instance, CloudWatch log group/alarm,
optional S3 bucket) is defined in version-controlled `.tf` files, not
clicked together in the console. Reproducible: `terraform destroy` +
`terraform apply` rebuilds the exact same infrastructure.

### Docker (+ Docker Compose)
Consistent packaging for three different runtimes (Node, Python,
Postgres) so "works on my machine" isn't a concern moving to EC2 — the
same `docker-compose.prod.yml` pattern that would work on any Docker
host. Compose specifically (over raw `docker run` commands) gives
service discovery by name (`backend`, `ml-service`, `postgres` resolve
to each other automatically) and a declarative restart policy.

### EC2 (instead of ECS/Fargate)
**Why EC2:** at this project's scale, one small instance is
meaningfully cheaper than ECS Fargate's per-vCPU/memory-second billing
across multiple tasks, and it teaches me the layer ECS abstracts away —
the actual Linux host, its networking, and how containers share it.
For a portfolio project, that hands-on layer is more valuable than the
production auto-scaling/rolling-deployment features ECS provides,
which this project's traffic doesn't need.

### Nginx (instead of an Application Load Balancer)
**Why Nginx, no ALB:** an ALB bills hourly plus per-LCU regardless of
traffic, and exists to load-balance across *multiple* targets — this
project has exactly one instance, so there's nothing to balance across.
Nginx running as a container gets the same practical outcome (a single
public entry point, internal services hidden) at zero additional AWS
cost, and I configure the reverse-proxy rules myself rather than
through ALB listener rules — again, more of the underlying mechanism is
visible to me.

### PostgreSQL in Docker (instead of RDS)
**Why not RDS:** RDS's smallest instances still cost meaningfully more
than free-tier EC2 compute, and for a single-instance portfolio
deployment there's no separate database tier to manage — Postgres runs
as one more container with a persistent Docker volume. The explicit
tradeoff: no automated backups, no Multi-AZ failover, no point-in-time
recovery, and the database disappears if the EC2 instance is destroyed
rather than just stopped. I'd choose RDS without hesitation for a real
production system with actual users and uptime requirements — see
[AWS_COST_AND_TEARDOWN.md](./AWS_COST_AND_TEARDOWN.md) for how I
mitigate the backup gap manually (a `pg_dump` before any teardown).

### IAM
Grants the EC2 instance exactly two things via an attached role: write
access to its own CloudWatch log group, and (only if S3 is enabled)
put/get/delete on its own S3 bucket. No AWS access keys exist anywhere
in the repository, `.env` files, or Docker images — the instance gets
temporary, auto-rotating credentials from the EC2 metadata service via
the instance profile.

### VPC
A dedicated VPC with one public subnet — network isolation from the
AWS account's default VPC, without the complexity of private
subnets/NAT gateways this single-instance architecture doesn't need.

### Security Groups
The only network-level access control in this architecture (there's no
ALB or NACL doing additional filtering): port 22 restricted to my own
IP, ports 80/443 open publicly, and — critically — no rule at all for
4000 (backend), 8000 (ML service), or 5432 (Postgres). Those services
are only reachable through Docker's internal network, which the
security group can't even see; Nginx is the sole bridge to the outside.

### CloudWatch
Log group receiving Docker container logs via the CloudWatch agent
(installed by the EC2 `user_data` script), plus one CPU-utilization
alarm. Kept deliberately minimal — no custom dashboards, no dozens of
alarms — because a small portfolio deployment doesn't need
enterprise-grade observability, just enough to see what happened if
something breaks.

### S3 — optional, off by default
Only relevant if `enable_s3 = true`. Stores generated resume PDFs so
they survive EC2 instance replacement (local storage on the instance's
own EBS volume does not). Private bucket, all public access blocked,
AES-256 encryption at rest, accessed only via short-lived presigned
URLs the backend generates per request — never a public bucket policy,
never AWS credentials handed to the browser.

## Anticipated interview questions

**"Why not ECS/Fargate?"**
Cost and learning value, at this scale. Fargate bills per task
continuously; one EC2 instance running Docker Compose does the same job
for this traffic level at a fraction of the cost, and forced me to
actually understand Docker networking, Linux server bootstrapping, and
reverse-proxy configuration rather than letting a managed orchestrator
handle it. I'd revisit this decision if the project needed to scale
horizontally or tolerate instance failure automatically — ECS is the
right tool for that, this project doesn't need it yet.

**"Why not RDS?"**
Purely cost/scale — see the RDS tradeoff section above. I know exactly
what I'm giving up (automated backups, Multi-AZ, PITR) and have a
manual mitigation (pre-teardown `pg_dump`) documented.

**"Why no ALB?"**
An ALB load-balances across multiple targets; this project has one.
Nginx gets the same "single public entry point, internal services
hidden" outcome without ALB's hourly + per-LCU cost, and I get direct
control over the proxy config instead of ALB listener rules.

**"Why no Redis/SQS/OpenSearch/etc.?"**
None of them solve a problem this application actually has right now.
I didn't want to add AWS services just because a job posting might
mention them — every resource in this Terraform config has a specific
job in this specific architecture, and I can point to exactly what it
does.

**"How do secrets get into the containers without being in Git?"**
`backend/.env`, `ml-service/.env`, and the root `.env` (Postgres
credentials) are created directly on the EC2 instance over SSH, never
committed (all match `.gitignore` patterns), and referenced by
`docker-compose.prod.yml` via `env_file:`. AWS-level access (S3,
CloudWatch) uses the IAM instance role instead of any credential file
at all.

**"What would you change for a real production deployment?"**
RDS instead of Postgres-in-Docker (managed backups/failover), an ALB +
multiple EC2 instances or ECS tasks behind it (no single point of
failure, rolling deploys), a proper TLS certificate (ACM + a real
domain, currently HTTP-only), and a CI/CD pipeline building/pushing
images automatically instead of manual `git pull && docker compose up`
over SSH.

## What I can draw on a whiteboard from memory

```
Internet → Security Group → EC2 instance
                               └── Nginx (only public port: 80)
                                     ├── / → React static build
                                     └── /api → Node/Express
                                                   ├── PostgreSQL (Docker volume)
                                                   └── Python/FastAPI ML service
IAM role → EC2 (CloudWatch Logs write, + S3 if enabled)
VPC → 1 public subnet → EC2
Terraform → provisions all of the above
```
