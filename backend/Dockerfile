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
CMD ["node", "server.js"]
