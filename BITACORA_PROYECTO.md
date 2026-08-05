# Bitácora del proyecto — booking.barber.cl

Memoria persistente del proyecto. Léela primero al retomar cualquier sesión de trabajo. No se borran entradas anteriores, solo se agregan nuevas al final.

---

## 2026-08-05 - Scaffold inicial, dirección de diseño y flujo público de reserva

**Qué se hizo:**
Se creó el proyecto desde cero con Vite + React 18. Se definió y validó con el cliente (Enzo) una dirección de diseño propia: paleta cobre/negro-barbero/hueso/verde-barbería (sin azul/morado genérico ni cliché de tijeras), tipografía Montserrat. Se configuró Tailwind CSS v4 vía `@theme` con esos tokens. Se implementó:
- Cliente Supabase + variables de entorno (`.env.example`).
- Componente de guardia de ruta que resuelve en cliente si una barbería está activa (`estado_id === 1`) antes de renderizar su página pública, mostrando un loader mientras consulta.
- Flujo completo de reserva del cliente final: seleccionar servicio → barbero (solo si hay más de uno) → día/hora disponible (calculado cruzando `horarios_disponibles` con `reservas` ya tomadas) → datos del cliente (nombre + celular chileno validado con Zod) → confirmación.
- Hook `onReservaCreada` preparado como punto único de integración futura con WhatsApp/email (por ahora solo hace `console.info`, sin conectar servicios externos).

**Por qué:**
- Tailwind v4 (`@theme` en CSS) en vez de v3 porque es el estándar actual y evita un `tailwind.config.js` extra.
- React Router v6 (no v7) porque así lo pide el stack definido, aunque trae 2 CVEs moderados sin parche en la rama 6.x — riesgo bajo porque no se reflejan URLs de usuario en `Link`/`navigate`.
- `@react-three/fiber`/`@react-three/drei` se instalarían más adelante fijados a v8/v9 (no la v9/v10 más nueva) porque esas versiones exigen React 19, y el stack pedido es React 18.

**Archivos afectados:**
- Proyecto completo (scaffold inicial), luego reestructurado — ver entrada del 2026-08-05 "Reestructuración a arquitectura profesional".

**Pendiente / próximos pasos:**
- Ver entradas siguientes.

---

## 2026-08-05 - Home de captación para barberías (landing)

**Qué se hizo:**
Se construyó la landing pública (`/`), dirigida a dueños de barbería (no al cliente final que agenda), con: header simple, hero con propuesta de valor, sección "cómo funciona" (3 pasos numerados en vez de iconografía genérica), beneficios (con íconos propios dibujados a mano, no de librería stock), planes de precio (Solo/Equipo/Estudio a $5.000/$6.000/$7.000, mapeados a las `caracteristicas` reales del modelo: whatsapp_automatico, ofertas_ilimitadas, multiples_barberos, personalizacion_marca) y llamado final.

**Por qué:**
- Los 3 planes y sus features se basaron en las `caracteristicas` que ya existen en el modelo de datos (tabla `caracteristicas`/`plan_caracteristicas`) en vez de inventar features nuevas, para que la landing no prometa algo que la base de datos no puede respaldar.
- No se agregó prueba social falsa (testimonios, "+X barberías confían en nosotros") porque el producto aún no ha lanzado — se agregará cuando existan casos reales.

**Archivos afectados:**
- `src/pages/Home/` y subcarpetas (luego reestructurado, ver entrada siguiente).

**Pendiente / próximos pasos:**
- Reemplazar el email placeholder de contacto (`hola@bookingbarber.cl`) por el canal real de Emia Studios.

---

## 2026-08-05 - Reestructuración a arquitectura profesional + animaciones de producción

**Qué se hizo:**
Reestructuración completa de `src/` bajo el criterio: **carpetas técnicas en inglés** (`components`, `pages`, `hooks`, `utils`, `services`, `context`, `routes`, `assets`), **módulo de negocio en español** (`pages/barberias/` con sus componentes internos — `PasoServicio`, `PasoBarbero`, `PasoHorario`, `PasoDatos`, `Confirmacion`, `AsistenteReserva`, hooks `useBarberiaPorSlug`/`useHorariosDisponibles`/`useReservasDelDia`/`useCrearReserva` — y `utils/formatos.js`, `utils/horarios.js`, `services/eventosReserva.js` con lógica de negocio como `ofertaVigente`, `calcularSlotsDisponibles`, `onReservaCreada`). Los componentes genéricos de UI/marketing (Hero, HowItWorks, Benefits, Pricing, FinalCTA, Header, Footer, Button, Loader, Icons, ScrollReveal) se nombraron en inglés por ser vocabulario universal de cualquier producto, no específico del rubro.

La ruta pública de barbería cambió de `/:slug` a `/barberias/:slug`.

Se agregaron animaciones de producción:
- **Framer Motion**: transiciones de entrada en el hero, scroll-reveal (`components/animations/ScrollReveal.jsx`) en todas las secciones de la home, micro-interacciones (hover/tap) en botones y tarjetas de planes, transición deslizante entre pasos del asistente de reserva (`AnimatePresence` en `AsistenteReserva.jsx`).
- **React Three Fiber + Three.js**: elemento 3D en el hero — una navaja de barbero de baja poligonización (geometría procedural con primitivas + `ExtrudeGeometry`, sin modelo `.glb` externo) que gira suavemente y reacciona sutilmente a la posición del mouse (`components/animations/BarberBladeModel.jsx` + `Scene3DCanvas.jsx`).
- **Loader personalizado**: navaja abriéndose/cerrándose en vez de spinner genérico (`components/common/Loader.jsx`), usado en la guardia de ruta de barbería y en la carga de horarios.
- **Mobile-first en animaciones**: el Canvas 3D se carga con `lazy()` (queda en un chunk aparte, ~800KB con Three.js) y solo se monta si `useIsMobile()` es `false` y el usuario no tiene `prefers-reduced-motion`. En mobile o con movimiento reducido se muestra `StaticBladeIllustration.jsx`, un SVG estático liviano — cero costo de WebGL para el cliente final que agenda desde el celular.
- **GSAP**: instalado y disponible, no usado todavía — Framer Motion cubrió todos los casos de esta fase (scroll-reveal, transiciones de paso, micro-interacciones). Se evalúa usarlo si aparece una secuencia de scroll-storytelling más compleja que whileInView no resuelva bien.

**Por qué:**
- Separar carpeta técnica (inglés) de vocabulario de negocio (español) sigue la convención de proyectos profesionales reales: la arquitectura es universal, el dominio del producto no.
- El razor 3D se construyó con geometría procedural (no un asset `.glb` descargado) para no depender de un archivo externo de origen no verificado y mantener el bundle bajo control.
- `@react-three/fiber@8.18.0` + `@react-three/drei@9.122.0` (no la v9/v10 de fiber) porque son las últimas versiones compatibles con React 18 sin conflictos de peer dependencies — la v9+ de fiber exige React 19.
- Verificación visual: el `fullPage` screenshot de Playwright sin scroll real no dispara los `whileInView` de Framer Motion (Chromium no hace scroll incremental en esa captura) — se confirmó que SÍ funcionan haciendo scroll real antes de capturar. No es un bug del código, es una particularidad de cómo Playwright captura páginas largas.

**Archivos afectados:**
- Carpeta completa `src/` reestructurada (ver README.md para el árbol final).
- Nuevo: `src/components/animations/{ScrollReveal,BarberBladeModel,Scene3DCanvas,HeroScene3D,StaticBladeIllustration}.jsx`, `src/components/common/{Button,BackButton,Icons,Loader}.jsx`, `src/components/layout/{Header,Footer}.jsx`, `src/hooks/{useIsMobile,usePrefersReducedMotion}.js`.
- Eliminado: estructura previa `src/{components,features,hooks,pages,lib}` (archivos duplicados/obsoletos tras la migración).
- `src/routes/AppRouter.jsx`: ruta de barbería ahora en `/barberias/:slug`.
- `README.md`: reescrito con stack, instalación y árbol de carpetas real.

**Pendiente / próximos pasos:**
1. **Login** (`/login`) — por `usuario` (no email), redirección según `rol_id` de la tabla `usuarios`. Requiere crear `src/context/` (contexto de sesión/rol) y probablemente `src/services/authService.js`.
2. **Panel barbero** (`/panel/precios`) — el más simple, solo edita `precio_clp`/`precio_oferta`/`oferta_activa` de sus servicios.
3. **Panel de barbería/admin** (`/panel`) — gestión de barberos, servicios, horarios, listado de reservas.
4. **Panel superadmin** (`/admin`) — listado de barberías, activar/desactivar con motivo (alimenta `historial_estados`), gestión de planes, auditoría.
5. Reemplazar el email placeholder de contacto en la landing.
6. Cuando se aborde WhatsApp/email real: implementar como Supabase Edge Function (nunca llamada directa desde el navegador, por el secreto de API) y conectar ahí `onReservaCreada`.

---

## 2026-08-05 - Modelo 3D real reemplaza la geometría procedural del hero

**Qué se hizo:**
Enzo bajó un modelo real (`barbers_pole.glb`, un poste de barbero clásico con tubo de vidrio, cilindro rayado interior, tapas de metal y bombilla superior) y se integró en el hero de la home, reemplazando la navaja procedural de la sesión anterior:
- `vite.config.js`: se agregó `assetsInclude: ['**/*.glb']` para poder importar el `.glb` como URL de asset (`import modelUrl from '...barbers_pole.glb'`) manteniéndolo en `src/assets/models-3d/`, en vez de moverlo a `public/`.
- `BarberPoleModel.jsx`: carga el modelo con `useGLTF`, reproduce la animación original embebida en el archivo (`Inner|InnerAction` — el cilindro rayado interior girando dentro del vidrio, el efecto clásico de poste de barbero), y le agrega una rotación lenta de conjunto en Y + una leve inclinación reactiva a la posición del mouse (igual que tenía la navaja).
- El modelo se centra y escala automáticamente calculando su `Box3` en tiempo real (`TARGET_HEIGHT` fijo) en vez de hardcodear números de escala/posición — así si mañana se reemplaza el `.glb` por otro asset con proporciones distintas, no hay que recalcular nada a mano.
- Se le subió el brillo a la bombilla superior (`materials.Light_Top.emissiveIntensity = 2.4`, `toneMapped = false`) porque contra el fondo oscuro del hero el valor original del material casi no se notaba.
- `StaticBarberPoleIllustration.jsx` (fallback mobile/`prefers-reduced-motion`) se rehizo para dibujar el mismo objeto — antes era una navaja con colores de marca (cobre/verde), ahora es un poste con los colores clásicos rojo/blanco/azul, iguales a los del modelo 3D real, para que la marca se vea consistente entre mobile y desktop.
- Se eliminaron `BarberBladeModel.jsx` y `StaticBladeIllustration.jsx` (la navaja procedural, ya no se usa).

**Por qué:**
- Se usaron los colores clásicos (rojo/blanco/azul) en vez de la paleta de marca en la ilustración estática porque, al ser literalmente el mismo objeto que ve el usuario de escritorio, usar otra paleta ahí se sentía como un objeto distinto — la consistencia entre breakpoints pesó más que forzar la paleta de marca en un elemento que es, a propósito, un ícono tradicional reconocible.
- Auto-fit por `Box3` en vez de escala hardcodeada: es la práctica correcta al integrar un asset externo cuyas proporciones no se controlan (viene con la escala/orientación del export original de Blender→Sketchfab, con un `scale={100}` interno raro que no vale la pena tocar a mano).
- El modelo pesa ~1.45MB (sin Draco/meshopt, el `gltf-transform inspect` confirmó que el peso es casi todo texturas PNG, no geometría — geometría es liviana, ~16k vértices). No se optimizó más porque igual queda en el chunk lazy de escritorio (nunca se descarga en mobile) y 1.45MB ahí es aceptable.

**Licencia — atribución obligatoria:**
Modelo "Barbers Pole" por Vinny Passmore ([sketchfab.com/HPrendering](https://sketchfab.com/HPrendering)), licencia **CC BY 4.0**. Requiere atribución visible. Se agregó en `components/layout/Footer.jsx` como prop opcional `showModelCredit` (activada solo en `pages/Home/Home.jsx`, ya que el modelo únicamente aparece ahí — la página pública de cada barbería no necesita este crédito). Si el modelo se reemplaza en el futuro por uno propio o de otra licencia, actualizar/quitar este crédito.

**Archivos afectados:**
- Nuevo: `src/components/animations/BarberPoleModel.jsx`, `src/assets/models-3d/barbers_pole.glb`
- Modificado: `src/components/animations/StaticBarberPoleIllustration.jsx` (antes `StaticBladeIllustration.jsx`), `src/components/animations/Scene3DCanvas.jsx`, `src/components/animations/HeroScene3D.jsx`, `src/components/layout/Footer.jsx`, `src/pages/Home/Home.jsx`, `vite.config.js`
- Eliminado: `src/components/animations/BarberBladeModel.jsx`, `src/components/animations/StaticBladeIllustration.jsx`

**Pendiente / próximos pasos:**
- Sigue pendiente el flujo de Login (ver entrada anterior) — es el siguiente paso en el orden acordado.
- Si se agregan más modelos 3D a futuro (ej. para los paneles), revisar licencia de cada uno igual que aquí antes de integrarlos.

---

## 2026-08-05 - Layout del hero a dos columnas + resuelto "scroll pegado" (era la franja decorativa, no un bug)

**Qué se hizo:**
Enzo pidió mover el poste 3D a la izquierda y el texto a la derecha (antes estaba todo centrado, texto arriba y poste abajo). También reportó que el scroll "se quedaba pegado" cerca del inicio de la página, viendo una franja vertical a rayas en el borde derecho de la pantalla que parecía una scrollbar trabada.

Se investigó el reporte de scroll con Playwright simulando eventos de `wheel` reales (no `scrollTo` directo, que no habría reproducido un bloqueo real si lo hubiera). El scroll respondía perfecto (`scrollY` avanzaba igual al hacer wheel sobre el canvas 3D o sobre el header) — no había ningún `overflow: hidden` ni `touch-action` bloqueando nada. Lo que Enzo vio no era una scrollbar: era el `div` decorativo de rayas diagonales (cobre/hueso/verde) que se había agregado en la sesión del razor procedural, como referencia visual al rubro antes de tener el poste 3D real. Ese `div` solo cubre el alto de la sección Hero (no toda la página), así que al hacer scroll desaparece de golpe — de ahí la sensación de "se pegó arriba".

Con el poste 3D real ya integrado, esa franja quedó redundante (el poste ya es la referencia visual al rubro) y confusa, así que se eliminó por completo al rehacer el `Hero.jsx`:
- Grid de 2 columnas en desktop (`md:grid-cols-2`): poste a la izquierda, texto a la derecha, usando `order-1`/`order-2` para lograrlo sin cambiar el orden del DOM (mobile sigue apilado: texto primero, poste después, igual que antes).
- El glow radial de fondo se reposicionó detrás del poste (antes estaba arriba a la derecha, ahora a la izquierda, centrado verticalmente).
- El contenedor del Canvas 3D pasó de ancho completo (`w-full`, pensado para un hero de una sola columna) a un contenedor angosto tipo "retrato" (`max-w-xs`/`max-w-sm`), acorde a que ahora vive en una columna y el poste es un objeto alto y delgado.
- Se quitó el multiplicador `responsiveScale` (`viewport.width / 3.4`) de `BarberPoleModel.jsx`: ya no aplica con el contenedor angosto fijo, y el auto-fit por altura (`TARGET_HEIGHT`) ya garantiza un encuadre vertical consistente sin depender del ancho del canvas.

**Por qué:**
- `order-1`/`order-2` en vez de reordenar el JSX: permite tener columnas invertidas en desktop sin tocar el orden natural en mobile (que ya se había validado y se quería mantener).
- Se verificó el bug de scroll con eventos de `wheel` reales vía Playwright en vez de solo mirar el código, para no arreglar algo que no estaba roto — el problema era de percepción visual (un elemento decorativo mal ubicado), no de lógica.

**Archivos afectados:**
- `src/pages/Home/components/Hero.jsx` (grid de 2 columnas, glow reposicionado, franja de rayas eliminada)
- `src/components/animations/HeroScene3D.jsx` (contenedor del canvas angosto)
- `src/components/animations/BarberPoleModel.jsx` (se quitó `responsiveScale` y el import de `useThree` que quedó sin uso)

**Pendiente / próximos pasos:**
- Sigue pendiente el Login como siguiente paso del orden acordado.

---

## 2026-08-05 - El poste deja de girar: ángulo fijo + animación de flotado

**Qué se hizo:**
Enzo pidió congelar el poste en un ángulo fijo (sin la rotación continua en Y) y en su lugar darle una animación de levitar/flotar. En `BarberPoleModel.jsx`:
- Se quitó por completo la rotación continua (`rotation.y += delta * 0.18`) y el tilt reactivo al mouse (`rotation.x` lerpeado con `state.pointer.y`) — el grupo ahora tiene una rotación fija `rotation={[0, 0.45, 0]}` (un ángulo de 3/4 elegido para mostrar el relieve del poste, similar a como se veía en un frame intermedio de la rotación anterior).
- Se agregó un flotado vertical suave en `position.y` combinando dos senos de distinta frecuencia y amplitud (uno lento y notorio, uno más rápido y sutil superpuesto) en vez de un solo seno — se ve menos "mecánico"/metronómico que una sola onda.
- La animación interna del modelo (las rayas girando dentro del vidrio) sigue intacta — lo que se quitó fue únicamente la rotación del objeto completo, no esa animación propia del asset.

**Por qué:**
- Se combinaron dos senos en vez de uno para que el vaivén se sienta orgánico; con una sola onda sinusoidal el ojo detecta el patrón repetitivo más rápido.
- Se verificó con capturas en 4 instantes espaciados (Playwright) que: (a) el ángulo permanece idéntico en todos los frames — ya no gira — y (b) la posición vertical sí varía frame a frame — el flotado funciona.

**Archivos afectados:**
- `src/components/animations/BarberPoleModel.jsx`

**Pendiente / próximos pasos:**
- Sigue pendiente el Login como siguiente paso del orden acordado.

---

## 2026-08-05 - Verificación rigurosa del ángulo fijo del poste (barrido de pruebas)

**Qué se hizo:**
Enzo pidió confirmar con múltiples pruebas que el ángulo fijo del poste coincidiera exactamente con una imagen de referencia. En vez de solo mirar código, se agregó temporalmente un parámetro de debug (`?anguloTest=`) en `BarberPoleModel.jsx` para poder recargar la página con distintos ángulos de rotación Y sin reconstruir el proyecto en cada prueba. Con Playwright se hizo un barrido de izquierda a derecha (`-1.2` a `1.2` rad) y luego un barrido fino alrededor de `0.45` (`0.38` a `0.52`), comparando visualmente cada captura contra la imagen de referencia (posición del bracket/soporte metálico visible a la izquierda del poste, ángulo de las rayas, posición del brillo de la bombilla).

**Resultado:** `STATIC_ROTATION_Y = 0.45` (el valor ya definido en la sesión anterior) es la coincidencia exacta — se descartó explícitamente después de comparar contra 19 ángulos distintos. Se quitó el parámetro `?anguloTest=` de debug una vez confirmado, dejando el valor fijo hardcodeado como antes.

**Por qué:**
- Se optó por un parámetro de URL temporal en vez de recompilar para cada ángulo probado: permite iterar sobre HMR de Vite en segundos en vez de minutos, dado que se pidió explícitamente "múltiples pruebas".

**Archivos afectados:**
- `src/components/animations/BarberPoleModel.jsx` (sin cambios netos en el valor final — se agregó y luego se quitó el debug de `?anguloTest=`)

**Pendiente / próximos pasos:**
- Sigue pendiente el Login como siguiente paso del orden acordado.

---
