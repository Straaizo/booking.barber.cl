# booking.barber.cl — Estado actual (2026-09-03)

SaaS de reservas online para barberías chilenas: cada barbería tiene su propia página pública con su marca, servicios, horarios y barberos, donde el cliente reserva sin apps ni WhatsApp a mano.

## Módulos (rutas)

| Ruta | Qué es |
|---|---|
| `/` | Home marketing (hero, beneficios, precios, cupos fundadores, FAQ) |
| `/:slug` | Página pública de una barbería (catálogo + asistente de reserva) |
| `/demo` | Barbería de ejemplo, sin datos reales |
| `/login` | Acceso único para los 3 roles |
| `/panel/barbero/*` | Panel del barbero: sus reservas, horario, servicios propios |
| `/panel/*` | Panel del dueño: reservas, barberos, servicios, horarios, personalización de su página |
| `/admin/*` | Panel superadmin: barberías, precios de planes, novedades |

## Tecnologías

- **Frontend**: React 18 + Vite (con Rolldown) + React Router v6 + Tailwind v4
- **Datos/estado**: TanStack Query (cache de lo que viene de Supabase)
- **Formularios**: react-hook-form + zod
- **Animación**: framer-motion (transiciones/reveals), three.js + @react-three/fiber-drei (modelo 3D del hero, solo desktop, con fallback a ilustración estática si el equipo rinde poco o el usuario prefiere menos movimiento)
- **Backend**: Supabase — Postgres con RLS, Auth, Storage (fotos de barberos/servicios), y 1 Edge Function (`gestionar-usuario`)
- **Hosting**: Vercel — build estático + funciones serverless en `/api`

## Base de datos (Postgres/Supabase)

`roles`, `estados_barberia`, `planes`, `barberias`, `barberos`, `usuarios`, `personalizacion`, `servicios`, `horarios_disponibles`, `excepciones_horario`, `reservas`, `historial_estados`, `pagos`.

Todo el acceso desde el navegador pasa por RLS: un barbero solo ve su propia barbería, un dueño la suya, el superadmin todas.

## Cómo se comunica todo

- El cliente React habla **directo con Supabase** (PostgREST) para leer/escribir datos — no hay un backend propio intermedio. La sesión es un JWT de Supabase Auth; RLS decide qué fila puede tocar cada rol.
- Crear cuenta, resetear contraseña o borrar cuenta de un barbero/dueño **siempre** pasa por la Edge Function `gestionar-usuario` (Deno, corre en el servidor de Supabase) porque necesita la `SERVICE_ROLE_KEY`, que nunca puede vivir en el navegador. Verifica el rol de quien llama antes de ejecutar cualquier acción.
- Vercel sirve el build estático y 3 funciones serverless bajo `/api`: `meta.js` (meta tags dinámicos por barbería para bots/redes sociales), `og.js` (imagen Open Graph generada al vuelo con `@vercel/og`), `sitemap.js`.
- Contacto/ventas: **no hay WhatsApp Business API ni nada automatizado** — son links `wa.me` armados a mano (helper `linkWhatsApp`) con mensaje prellenado; el "Elegir plan" y el CTA final del footer usan ese mismo mecanismo.
- Deploy: manual vía `vercel --prod --yes` después de build local. El repo está conectado a GitHub, pero el push no dispara el deploy — se hace aparte con la CLI.

## Identidad visual

- **Colores**: `negro-barbero` #1c1b19, `hueso` #f3eee3, `cobre` #a85c32 (con variantes `cobre-texto`/`cobre-claro` para cumplir contraste AA en texto chico sobre fondo claro/oscuro), `verde-barberia` #2f4538, `laton` #b08d57, escala `gris-calido` (100/200/400/500/700) para textos secundarios.
- **Tipografías**: Fraunces (serif, títulos/display) + Archivo (sans, texto de cuerpo).
- Cada barbería puede personalizar su propia página pública (tema claro/oscuro, color de header, eslogan) desde `personalizacion`, independiente de la identidad de marketing de booking.barber.cl.

## Rendimiento (optimizado 2026-09-02)

- Code-splitting por ruta: los paneles (barbero/dueño/superadmin), login y demo cargan con `lazy()` — antes viajaba todo junto en un bundle de ~980kB aunque el visitante solo mirara la home.
- Chunks de vendor separados (React, Supabase, TanStack Query) para que el navegador los cachee entre despliegues.
- Fuentes cargadas con `<link>` en el `<head>` en vez de `@import` en el CSS, para pedirlas en paralelo desde el arranque.
