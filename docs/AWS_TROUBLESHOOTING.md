# AWS Troubleshooting

Covers only the infrastructure this project actually uses (EC2, Docker
Compose, Nginx, Postgres-in-Docker, the ML service, optional S3, and
Terraform) — see [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md) for what
was deliberately left out.

## EC2 / bootstrap

**`ssh` connection refused or times out**
- Check the instance is `running`: `aws ec2 describe-instances
  --filters "Name=tag:Name,Values=career-guidance-app"`.
- Check your current public IP still matches `allowed_ssh_cidr` in
  `terraform.tfvars` — home/office IPs change. Re-run `curl -s
  https://checkip.amazonaws.com`, update the variable, `terraform
  apply` again if it changed.
- Confirm you're using the right key: `ssh -i career-guidance-key.pem
  ubuntu@<ip>` (user is `ubuntu` for the Ubuntu AMI, not `ec2-user`).

**`~/BOOTSTRAP_DONE` never appears**
```bash
sudo cat /var/log/cloud-init-output.log | tail -100
```
Common causes: a transient package-mirror failure during `apt-get
install` (re-run manually with `sudo bash
/var/lib/cloud/instance/scripts/part-001` to retry the same script), or
the CloudWatch agent `.deb` URL returning a 404 for your region (verify
the URL pattern in `user_data.sh.tftpl` matches AWS's current
[download page](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/download-CloudWatch-Agent-on-EC2-Instance-commandline-first.html)
for your region).

**Instance is unreachable / stuck initializing**
- Check the EC2 console's **Status Checks** tab — two checks
  (system + instance) should both pass within a few minutes of launch.
- If status checks fail repeatedly, it's usually a capacity issue in
  that AZ — `terraform destroy` and `apply` again, or set
  `availability_zone` explicitly to a different AZ in the region.

## Docker / Docker Compose

**A container keeps restarting**
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs <service> --tail=100
```
- `backend` restarting: almost always `DATABASE_URL` unreachable
  (Postgres not healthy yet — `depends_on: condition: service_healthy`
  should prevent this, but check `docker compose logs postgres`) or a
  missing required env var in `backend/.env` (check
  `backend/src/config/env.js` for which vars are required).
- `ml-service` restarting: check `ML_MODEL_PATH` in `ml-service/.env`
  points at a file that actually exists inside the container —
  `docker compose exec ml-service ls app/data/ml_models/`.
- `nginx` restarting or failing to build: usually a frontend build
  error — `docker compose -f docker-compose.prod.yml build nginx`
  directly to see the full Vite build log.

**Port already in use**
- Only `nginx` should bind a host port (80). If you see a bind error
  on 80, check nothing else (a stray Apache/Nginx install, or a leftover
  container from a previous attempt) is already listening:
  `sudo lsof -i :80`.

**`docker compose` command not found**
- You need the Compose *plugin* (`docker compose`, no hyphen), not the
  old standalone `docker-compose` binary. The bootstrap script installs
  `docker-compose-plugin` via apt — confirm with `docker compose
  version`.

## Nginx

**502 Bad Gateway on `/api/...`**
- The backend container isn't up or isn't healthy yet:
  `docker compose -f docker-compose.prod.yml ps backend`.
- Check `nginx.conf`'s `proxy_pass` target matches the Compose service
  name exactly (`backend`, not `localhost` or an IP — Docker's internal
  DNS resolves service names only within the same Compose network).

**Blank page / assets 404 on refresh at a deep route (e.g. `/careers/123`)**
- Confirms the `try_files $uri $uri/ /index.html;` fallback in
  `frontend/nginx.conf` is missing or misconfigured — this is required
  for React Router's client-side routes to work on a hard refresh.

**Changes to `frontend/src/` don't show up**
- The frontend is built into a static bundle at Docker *build* time —
  you must rebuild the image, not just restart the container:
  `docker compose -f docker-compose.prod.yml up -d --build nginx`.

## PostgreSQL

**`backend` can't connect / "password authentication failed"**
- `POSTGRES_USER`/`POSTGRES_PASSWORD` in the root `.env` must match
  what `DATABASE_URL` expects — `docker-compose.prod.yml` builds
  `DATABASE_URL` from those two variables automatically, so don't set a
  conflicting `DATABASE_URL` directly in `backend/.env`.
- If you changed `POSTGRES_PASSWORD` *after* the `postgres` container
  already initialized its data volume once, the change won't take
  effect — Postgres only reads `POSTGRES_PASSWORD` on first
  initialization of an empty data directory. You'd need to reset the
  volume (**destroys all data**): `docker compose -f
  docker-compose.prod.yml down -v` then `up -d --build` again.

**Schema/tables missing**
- `db/schema.sql` is mounted into
  `/docker-entrypoint-initdb.d/schema.sql`, which Postgres's official
  image only runs when the data directory is *empty* (first-ever
  start). If you need to apply it to an already-initialized volume,
  run it manually: `docker compose -f docker-compose.prod.yml exec -T
  postgres psql -U $POSTGRES_USER -d career_guidance < db/schema.sql`.

**Volume/disk full**
- `df -h` on the instance. The default 20GB root volume is comfortable
  for this app, but a runaway log file or too many old Docker images
  (`docker image prune`) can fill it. Increase `root_volume_size_gb` in
  `terraform.tfvars` and `terraform apply` if you need more (this
  resizes the EBS volume; you may still need to grow the filesystem on
  the instance with `sudo growpart` + `sudo resize2fs`).

## ML service

**`/health` reports `model_loaded: false`**
- Check `ML_MODEL_PATH` in `ml-service/.env` and confirm the `.pkl`
  file actually made it into the built image (it should — the
  Dockerfile `COPY`s the whole `ml-service/` directory, and
  `ml-service/.dockerignore` explicitly does not exclude
  `app/data/ml_models/`).

**Backend logs "ML service unreachable"**
- Confirm `ML_SERVICE_URL=http://ml-service:8000` is what
  `docker-compose.prod.yml` sets (it overrides whatever's in
  `backend/.env`) — this must be the Compose service name, never
  `localhost` (that would point at the backend container itself, not
  the ML container).

## S3 (only relevant if `enable_s3 = true`)

**`AccessDenied` on upload**
- Confirm the backend is actually picking up IAM role credentials —
  it should need zero explicit AWS credentials. `docker compose -f
  docker-compose.prod.yml exec backend env | grep AWS` should show no
  `AWS_ACCESS_KEY_ID` (correct — it's not needed; the SDK reads
  instance-metadata credentials automatically). Then confirm the IAM
  policy's bucket ARN in `iam.tf` actually matches your bucket name.
- "Bucket name already exists" during `terraform apply`: S3 bucket
  names are globally unique across *all* AWS accounts — change
  `s3_bucket_name` in `terraform.tfvars` to something more unique.

**Presigned URLs return 403 immediately**
- Check `S3_PRESIGNED_URL_TTL_SECONDS` in `backend/.env` hasn't
  expired between generation and click (default 900s/15min) and that
  the EC2 instance's clock is correct (`timedatectl` — AWS signature
  validation is time-sensitive).

## Terraform

**`Error: creating EC2 Key Pair... already exists`**
- You already created the key pair in a previous attempt — either
  reuse the existing one (just reference it by name in
  `terraform.tfvars`, don't recreate it) or delete it first: `aws ec2
  delete-key-pair --key-name career-guidance-key`.

**`Error: InvalidKeyPair.NotFound`**
- `key_pair_name` in `terraform.tfvars` doesn't match an existing key
  pair in the region you're deploying to. Re-check with `aws ec2
  describe-key-pairs`.

**`terraform plan` shows unexpected changes on a re-run with nothing edited**
- Usually a provider version drift or an out-of-band console change.
  Run `terraform plan` again after `terraform init -upgrade`; if a
  change persists, check whether someone (or you) modified something
  in the AWS console directly — Terraform will try to reconcile it back
  to what's declared in `.tf` files.

**State file conflicts / "state is locked"**
- This project uses local state (no remote backend) for simplicity —
  only run Terraform from one machine/one `terraform apply` at a time.
  If a previous run was killed mid-apply, `.terraform.tfstate.lock.info`
  may be left behind; remove it once you're sure nothing else is
  actually running.

**Lost `terraform.tfstate`**
- Without state, Terraform doesn't know what it created. If this
  happens, the safest recovery is manual: find the resources in the
  AWS console (tagged `Project = career-guidance`), delete them by
  hand, and re-`apply` from scratch. Never try to recreate a `.tfstate`
  file by guessing its contents.
