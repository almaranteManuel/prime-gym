# Prime Gym — Monorepo desacoplado

```
apps/
  api/        → Node.js + Express + TypeScript + Prisma (PostgreSQL)
  frontend/   → React + Vite + TypeScript + PWA (SPA estática)
packages/
  shared/     → Tipos e interfaces compartidas (@gym/shared)
```

## Requisitos

- Node.js >= 20
- PostgreSQL accesible vía `DATABASE_URL`
- npm >= 10 (workspaces)

## Puesta en marcha

```bash
# 1. Instalar todo desde la raíz
npm install

# 2. Generar cliente Prisma (apps/api)
npm run prisma:generate
# o: npx prisma generate --schema apps/api/prisma/schema.prisma

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env
# Edita DATABASE_URL, PORT, FRONTEND_URL, JWT_SECRET,
# DEFAULT_ADMIN_PASSWORD y VITE_API_URL

# En una base existente, aplicar el schema de autenticación:
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# 4. Dev simultáneo (API + Frontend)
npm run dev
# API:        http://localhost:3001
# Frontend:   http://localhost:5173
# Health API: http://localhost:3001/api/health
```

## Scripts raíz

| Script | Descripción |
|---|---|
| `npm run dev` | Levanta API + Frontend con `concurrently` |
| `npm run dev:api` | Solo API |
| `npm run dev:web` | Solo Frontend |
| `npm run build` | Build de todos los workspaces |
| `npm run prisma:generate` | Genera Prisma Client |

## Tipos compartidos

`packages/shared/src/index.ts` exporta p.ej. `ApiHealthResponse`.
Uso:

```ts
// Backend (apps/api)
import type { ApiHealthResponse } from '@gym/shared';

// Frontend (apps/frontend)
import type { ApiHealthResponse } from '@gym/shared';
```

El workspace `@gym/shared` expone directamente `./src/index.ts` en dev,
por lo que no necesitas compilarlo para desarrollar.
Para producción puedes correr `npm run build -w @gym/shared`.
