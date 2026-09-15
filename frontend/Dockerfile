# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY frontend/. .
# company.json / adminEmail.json sono gitignored; su Linux il case del filename conta.
RUN set -eu; \
    cd src/companyData; \
    if [ ! -f company.json ]; then cp company.json.example company.json; fi; \
    if [ ! -f adminEmail.json ]; then \
    if [ -f adminemail.json ]; then cp adminemail.json adminEmail.json; \
    elif [ -f adminemail.json.example ]; then cp adminemail.json.example adminEmail.json; \
    elif [ -f adminEmail.json.example ]; then cp adminEmail.json.example adminEmail.json; \
    fi; \
    fi
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/templates/default.conf.template

ENV API_UPSTREAM=http://host.docker.internal:3001

EXPOSE 80
