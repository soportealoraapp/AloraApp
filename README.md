# Alora

Dating app con IA integrada — conexiones reales con inteligencia artificial.

## Stack

| Frontend | Backend | BD | Mobile |
|----------|---------|-----|--------|
| Next.js 15.3 (App Router) | Supabase Auth + REST | PostgreSQL (via Prisma) | Capacitor (Android) |
| React 18, TypeScript | Next.js Server Actions | Supabase (Pooler) | PWA (next-pwa) |
| Tailwind CSS + shadcn/ui | API Routes (Edge + Node) | Prisma ORM v5 | |

## Características

- **Auth** — Email, Google, Apple via Supabase SSR
- **Discover** — Feed con filtros, Daily Picks algorítmicos
- **Matches** — Like/SuperLike/Pass, match en tiempo real
- **Chat** — Mensajería con moderación IA (Genkit + Google AI)
- **Perfiles** — Edición con fotos (UploadThing), voz, intereses
- **AI Coach** — Sesiones con IA para mejorar conexiones
- **IA Wingman** — Sugerencias de respuesta en chat
- **Stories** — Historias efímeras de 24h
- **Admin** — Panel con analíticas, go/no-go, moderación
- **Economía** — Sistema de boost, super likes, streaks
- **Seguridad** — CSP, rate limiting, bloqueo/reporte, shadowban
- **Pagos** — LemonSqueezy integrado

## Empezar

```bash
# Clonar
git clone https://github.com/soportealoraapp/AloraApp.git
cd AloraApp

# Variables de entorno
cp .env.example .env.local
# Llenar DATABASE_URL, SUPABASE_*, UPLOADTHING_*, etc.

# Instalar
npm install

# BD
npx prisma generate
npx prisma migrate deploy

# Dev
npm run dev
# → http://localhost:3000
```

## Scripts

```bash
npm run dev          # Dev con Turbopack
npm run build        # Build producción
npm run typecheck    # TypeScript check
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run lint         # ESLint
```

## Estructura

```
src/
├── app/            # App Router (pages, API routes, layouts)
│   ├── (app)/      #  Rutas protegidas (discover, chat, profile…)
│   ├── (auth)/     #  Auth (login, signup)
│   └── api/        #  API endpoints
├── components/     # UI components (shadcn + custom)
├── hooks/          # Custom hooks
├── server/         # Server actions, servicios, AI
│   ├── actions/    # Server Actions
│   └── services/   # Lógica de negocio
├── lib/            # Config (prisma, supabase, lemonsqueezy, etc.)
├── ai/             # Genkit flows (coach, wingman, moderación)
├── contexts/       # React context providers
├── types/          # TypeScript types
└── middleware.ts   # Edge middleware (auth, seguridad)
```

## BD (PostgreSQL + Prisma)

```bash
npx prisma studio          # UI para ver datos
npx prisma migrate dev     # Nueva migración (dev)
npx prisma migrate deploy  # Aplicar migraciones (prod)
npx prisma generate        # Regenerar cliente
```

## Despliegue

### Vercel (recommendado)

Conecta el repo de GitHub a Vercel. Variables requeridas:

- `DATABASE_URL` — Supabase Pooler connection string
- `DIRECT_URL` — Supabase direct connection
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPLOADTHING_TOKEN` / `UPLOADTHING_APP_ID`
- `GOOGLE_GENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `LEMONSQUEEZY_API_KEY`

Construir: `npm run build`

## Equipo

| Rol | Nombre |
|-----|--------|
| CEO y Fundador | Alejandro Pérez Vázquez |
| Desarrollo | Caleb Zacarías García |
| Desarrollo | Juan Carlos Moreno López |
| Desarrollo | Erik Barrera Barrera |

**Soporte**: soporte.alora.app@gmail.com

© 2026 Alora Team. Todos los derechos reservados.

## Licencia

Privada — Alora App
