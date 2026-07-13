FROM node:20-alpine AS build

WORKDIR /app/backend-nest

ARG NPM_REGISTRY=https://registry.npmmirror.com

COPY backend-nest/package.json backend-nest/package-lock.json ./
RUN npm config set registry "${NPM_REGISTRY}" && npm ci

COPY backend-nest/ ./
COPY backend-nest/config/llm-models.json ./config/llm-models.json

RUN npx prisma generate && npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

ARG NPM_REGISTRY=https://registry.npmmirror.com

COPY backend-nest/package.json backend-nest/package-lock.json ./
RUN npm config set registry "${NPM_REGISTRY}" && npm ci --omit=dev

COPY --from=build /app/backend-nest/dist ./dist
COPY --from=build /app/backend-nest/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/backend-nest/node_modules/@prisma ./node_modules/@prisma
COPY backend-nest/prisma ./prisma
COPY backend-nest/scripts ./scripts
COPY backend-nest/config ./config
COPY backend-nest/src/templates/schemas ./src/templates/schemas

RUN mkdir -p uploads logs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node scripts/run-init.cjs && node dist/main.js"]
