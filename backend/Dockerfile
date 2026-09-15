# syntax=docker/dockerfile:1

FROM node:24-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY backend/ ./

USER node

EXPOSE 3001
CMD ["node", "server.js"]
