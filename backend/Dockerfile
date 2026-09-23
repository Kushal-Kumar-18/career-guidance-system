# Not build-tested in this sandbox (no Docker daemon available here) —
# see README "Known limitations". Used both for local Docker Compose
# testing (docker-compose.yml) and the EC2 production deployment
# (docker-compose.prod.yml) — same image, no separate prod Dockerfile
# needed since this one already installs production deps only, uses
# env vars, and logs to stdout/stderr.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 4000
# Node's slim image has no curl/wget, so the healthcheck uses Node
# itself to hit the same GET /api/health this service already exposes
# (see src/routes/health.routes.js) — checks DB/ML-service reachability
# too, not just "is the process alive". Compose only health-gates
# postgres today (docker-compose.prod.yml); this lets `docker ps` and
# `docker inspect` show a real ready/unhealthy state for this container
# too, and is a prerequisite for adding `condition: service_healthy`
# here later if desired.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
