FROM node:20-alpine AS build

WORKDIR /app/frontend-web

ARG NPM_REGISTRY=https://registry.npmmirror.com

COPY frontend-web/package.json frontend-web/package-lock.json ./
RUN npm config set registry "${NPM_REGISTRY}" && npm ci

COPY frontend-web/ ./
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000

COPY --from=build /app/frontend-web/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
