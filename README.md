# booking.barber.cl

Plataforma SaaS multi-tenant de reservas online para barberías chilenas. Un proyecto de Emia Studios.

## Stack

- React 18 + Vite
- React Router v6 (rutas dinámicas por slug de barbería)
- Supabase (Postgres + Auth + Storage) vía `@supabase/supabase-js`
- TanStack Query para data fetching/cache
- React Hook Form + Zod para formularios
- Tailwind CSS v4 (tema propio, ver `src/index.css`)
- Framer Motion, React Three Fiber / Three.js y GSAP para animaciones

## Requisitos

- Node 20+
- Un proyecto Supabase con el esquema del modelo de negocio ya aplicado

## Instalación

```bash
npm install
cp .env.example .env   # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Scripts

- `npm run dev` — servidor de desarrollo (puerto 5173)
- `npm run build` — build de producción
- `npm run preview` — sirve el build de producción localmente
- `npm run lint` — Oxlint

## Estructura del proyecto

Carpetas técnicas en inglés, módulo de negocio (`pages/barberias`) y su vocabulario en español:

```
src/
├── assets/            # imágenes, fuentes, modelos 3d
├── components/
│   ├── common/         # botones, loader, íconos reutilizables
│   ├── layout/         # header, footer
│   └── animations/     # scroll-reveal, escena 3D del hero
├── pages/
│   ├── Home/            # landing pública (capta barberías)
│   ├── barberias/       # módulo central: página pública + flujo de reserva
│   ├── admin-panel/      # (pendiente) panel superadmin
│   ├── barberia-panel/   # (pendiente) panel dueño de barbería
│   └── barbero-panel/    # (pendiente) panel barbero
├── context/            # (pendiente) sesión/rol de usuario
├── hooks/              # hooks compartidos genéricos
├── services/           # cliente Supabase, query client, eventos
├── utils/              # helpers (formatos, cálculo de horarios)
└── routes/             # configuración de React Router
```

Para el detalle de decisiones de arquitectura y el historial de avance, ver **`BITACORA_PROYECTO.md`**.
