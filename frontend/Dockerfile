# Not build-tested in this sandbox (no Docker daemon available here).
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# The Vite dev server proxies /api to the backend (see vite.config.js),
# but that proxy doesn't exist in a production build served by `serve`.
# VITE_API_BASE_URL must be baked in at BUILD time (Vite inlines
# import.meta.env.* into the bundle) — an ARG here, passed as a
# docker-compose build arg, is the only way to configure this for the
# containerized frontend. Defaults to the backend's host-mapped port so
# a browser on the host machine (not another container) can reach it.
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
