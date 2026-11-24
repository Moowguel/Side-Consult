# SideConsult - imagem única (Next.js + SQLite). Para produção real, trocar SQLite por PostgreSQL.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL="file:/data/sideconsult.db" NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

EXPOSE 3000
# Aplica migrações, popula dados de demonstração (idempotente), roda o pipeline de dados e sobe o servidor.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npm run data:pipeline && npm start"]
