# ---------- Build stage ----------
FROM node:18-bullseye AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build


# ---------- Production stage ----------
FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN useradd -m nest
USER nest

EXPOSE 3001
CMD ["node", "dist/main.js"]
