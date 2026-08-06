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

## 2026-08-05 - Auditoría de continuidad: el rediseño editorial ya estaba hecho, sin registrar

**Qué se hizo:**
Se retomó el proyecto para ejecutar el prompt de "rediseño de identidad visual + módulos faltantes". Antes de tocar código se auditó el estado real leyendo cada archivo de `src/pages/Home` y `src/components`, porque la última entrada de la bitácora (poste con ángulo fijo) no mencionaba ningún trabajo de rediseño. Resultado de la auditoría: **el rediseño editorial completo (Partes 1-4 del prompt) ya estaba implementado**, con una calidad que cumple punto por punto lo pedido — pero nunca se registró en esta bitácora. Se documenta ahora, retroactivamente, para que la memoria del proyecto quede consistente con el código:

- **Tipografía**: Fraunces (display, con cursiva de carácter para énfasis dentro de titulares) + Archivo (sans, texto de cuerpo e UI). Se descartó cualquier familia genérica (Inter/Roboto/Poppins/Montserrat, que sí se había usado en el scaffold inicial).
- **Sistema editorial**: grid de 12 columnas asimétrico en `HowItWorks` y `Pricing` (etiqueta vertical en `md:col-span-2`, contenido arrancando en `md:col-start-4`), encabezados alineados a la izquierda, mezcla de peso/cursiva en la misma frase (`TextReveal` con tokens `*entre asteriscos*` para la parte en itálica display).
- **Firma gráfica recurrente**: `SectionRule` (regla horizontal delgada a sangrado completo con etiqueta superpuesta tipo `— 01 / Cómo funciona`) — se repite en cada quiebre de sección y en el footer. Numerales tabulares (`.numeros-tabulares`) en precios y pasos. Versalitas (`.versalitas`) en etiquetas.
- **Cero iconografía de librería**: se resolvió toda la jerarquía con números (`01`/`02`/`03`) y tipografía, ninguna sección usa iconos Lucide/Heroicons.
- **Pricing**: tabla comparativa editorial de una sola pieza en desktop/tablet (`lg:` breakpoint), con un carrusel de tarjetas con scroll-snap en mobile/tablet angosto — se evaluó explícitamente que la tabla de 4 columnas no cabe con el margen editorial asimétrico bajo 1024px. Ninguna variante usa el patrón prohibido (tres cards verticales con la del medio destacada); el tinte `bg-cobre/5` en la columna "Equipo" de la tabla es solo un detalle de columna, no una card aparte.
- **Firma de movimiento**: curvas propias en `components/animations/easing.js` (`EASE_ENTRADA = cubic-bezier(0.16,1,0.3,1)`, más `EASE_SALIDA`/`EASE_REBOTE`), reutilizadas en `ScrollReveal`, `StaggerReveal`, `TextReveal`, `AnimatedNumber`, `Button` y `HoverLink` — nunca `transition: all 0.3s ease` genérico.
- **Detalles de motion específicos ya resueltos**: `TextReveal` revela titulares palabra por palabra con máscara (`overflow-hidden`, sin fade plano); `AnimatedNumber` cuenta desde 0 al entrar en viewport (usado en los precios de los planes); `Button` tiene magnetismo suave (sigue el mouse dentro de su área con spring); `Cursor.jsx` es un cursor propio (punto + anillo con inercia) que solo se monta con puntero fino y sin `prefers-reduced-motion`, agrandándose sobre elementos interactivos.
- **Responsive**: verificado con Playwright en los 6 viewports exigidos (375, 390, 768, 1024, 1440, 1920) — sin scroll horizontal, sin errores de consola, revelado de scroll funcionando en todos. Capturas en `.qa-screens/` (no versionado, temporal).

**Por qué:**
- Se decidió documentar esto como una entrada nueva en vez de reescribir entradas pasadas, respetando la regla de la bitácora de no borrar entradas anteriores — la entrada anterior queda tal cual (incompleta en ese aspecto), y esta la complementa.
- No se rehizo ningún trabajo ya hecho: se verificó archivo por archivo antes de modificar nada, para no duplicar esfuerzo ni arriesgar romper algo que ya cumplía el criterio pedido.

**Archivos revisados (sin modificar):** `src/index.css`, `src/pages/Home/**`, `src/components/animations/**`, `src/components/common/**`, `src/components/layout/**`.

**Pendiente / próximos pasos:**
1. La página pública de barbería (`/barberias/:slug`) y el asistente de reserva (`PasoServicio`, `PasoBarbero`, `PasoHorario`, `PasoDatos`, `Confirmacion`) **no** heredan el sistema editorial — siguen con estilo genérico Tailwind del scaffold inicial. Es la siguiente tarea.
2. Después: Login, Panel barbero, Panel admin, Panel superadmin — según el esquema real de Supabase que Enzo confirmó por diagrama ER (roles: 1=superadmin/2=admin/3=barbero; estados: 1=activo/2=inactivo/3=suspendido_pago/4=pendiente_activacion; tablas `planes`, `caracteristicas`, `plan_caracteristicas`, `usuarios` con login por `usuario`/`email_tecnico`, `historial_estados`).
3. No hay `.env` local con credenciales reales de Supabase — se usó un `.env` temporal con valores placeholder solo para poder levantar el dev server y hacer QA visual del home (que no hace queries). Los módulos con datos reales (barbería pública, paneles) no se han podido probar contra datos reales todavía; falta que Enzo entregue credenciales para esa validación final.

---

## 2026-08-05 - Esquema de datos confirmado + rediseño de la página pública de barbería y el asistente de reserva

**Qué se hizo:**
Enzo confirmó el esquema real de Supabase con un diagrama ER completo (roles, estados, planes, características, plan_características, barberías, barberos, servicios, personalización, usuarios, horarios_disponibles, reservas, historial_estados), con los `id` de catálogo fijos: `roles` 1=superadmin/2=admin/3=barbero, `estados` 1=activo/2=inactivo/3=suspendido_pago/4=pendiente_activacion. Con eso confirmado, se rediseñó por completo la página pública de barbería (`/barberias/:slug`) y todo el asistente de reserva, que hasta ahora tenían estilo genérico Tailwind del scaffold inicial (cards redondeadas, texto bold plano, sin ninguno de los recursos de identidad del home).

- **`PaginaBarberia.jsx`**: header rehecho con `TextReveal` para el nombre, eslogan en versalitas, logo circular con borde cobre (o inicial del nombre en un círculo si no hay logo), dirección y enlace directo a WhatsApp (`utils/formatos.js` → `linkWhatsApp`, normaliza el teléfono guardado en cualquier formato a `wa.me/56...`). `SectionRule` como quiebre hacia el asistente. `Footer` ahora se usa con una variante nueva.
- **Color de marca por barbería**: `personalizacion.color_primario` (columna que ya existía en el modelo y no se usaba) ahora sobreescribe `--color-cobre`/`--color-cobre-oscuro` vía variables CSS en el nodo raíz de la página (`utils/color.js` → `oscurecerHex` deriva el tono oscuro/hover). Como Tailwind v4 genera las utilidades (`text-cobre`, `bg-cobre`, `border-cobre`) referenciando esas variables del `@theme`, con solo poner el `style` en el contenedor **todos** los componentes ya existentes (Button, HoverLink, SectionRule, AnimatedNumber, etc.) heredan el color de marca sin tocar su código. Verificado con Playwright inyectando una barbería mock con `color_primario: '#2f6b4f'` (verde): el círculo del logo, la etiqueta del eslogan, el precio de oferta, la barra de progreso del asistente, el estado activo de fecha y el botón de "Confirmar reserva" cambiaron todos a ese verde.
- **`Footer.jsx`**: se agregó prop `variante` (`'marketing'` por defecto, `'minimal'` nuevo). En `minimal` no se muestra el titular/CTA de captación de dueños de barbería (no tiene sentido mostrárselo a un cliente que recién agendó hora) ni los links a `#como-funciona`/`#planes` (anclas que no existen fuera del home) — solo la regla con el crédito de Emia Studios y un link a `booking.barber.cl`.
- **`AsistenteReserva.jsx`**: se agregó un indicador de progreso propio (`ProgresoAsistente`) — contador `01 / 04` en numerales tabulares + nombre del paso activo + una regla que se llena de cobre/color de marca con `EASE_ENTRADA`, calculado dinámicamente según si la barbería tiene más de un barbero (4 pasos) o uno solo (3 pasos, se salta "Barbero"). El contenedor pasó de "card blanca flotante" a un bloque con borde superior grueso color marca (mismo recurso gráfico que `SectionRule` a otra escala). Se agregó estado vacío explícito si la barbería no tiene servicios activos publicados.
- **`PasoServicio.jsx` / `PasoBarbero.jsx`**: las opciones dejaron de ser "cards" con `rounded-xl border` y pasaron a filas con reglas horizontales (mismo lenguaje que `HowItWorks`), con una barra de acento a la izquierda que aparece con `scale-y` al hover/focus. Precio en numerales tabulares, oferta con el precio anterior tachado.
- **`PasoHorario.jsx`**: chips de fecha rediseñados (activo = fondo color de marca), slots de hora en grid con numerales tabulares. **Se agregó manejo explícito de error** que no existía antes (`isError` de `useHorariosDisponibles`/`useReservasDelDia`) — antes, si la consulta fallaba, la vista mostraba silenciosamente "no quedan horas disponibles", indistinguible de un día realmente sin cupos. Ahora muestra "No pudimos cargar los horarios/las horas. Intenta de nuevo." con `role="alert"`.
- **`PasoDatos.jsx`**: inputs pasaron de recuadros con borde completo a subrayado editorial (`border-b`, foco cobre/marca), etiquetas en versalitas. El botón de envío ahora es el componente `Button` compartido (con magnetismo), no un botón suelto — consistencia con el resto del sitio.
- **`Confirmacion.jsx`**: titular con `TextReveal`, check animado con la curva `EASE_REBOTE` en vez de un spring genérico de Framer Motion.

**Cómo se probó (Parte 7):**
1. **Compila sin warnings**: `npm run lint` (oxlint, limpio) y `npm run build` (bundle ok, únicos warnings son de tamaño de chunk ya conocidos por Three.js/GLB, no de código).
2. **Viewports**: 375, 768 y 1440 verificados con Playwright contra una ruta de preview temporal (`/_qa-barberia`, con datos mock — se creó y se eliminó junto con sus scripts al terminar, no queda en el repo). Sin scroll horizontal en ninguno.
3. **Estados probados**: se interceptaron las llamadas REST con `page.route()` para simular tanto éxito (horarios/reserva) como fallo real (DNS no resuelve contra el `.env` placeholder) y así ejercitar los cuatro estados de cada paso — cargando, con datos, vacío (barbería sin servicios) y error (fallo de red en horarios/reservas) — confirmando que el nuevo bloque de error de `PasoHorario` renderiza correctamente (antes no existía). Flujo completo servicio → barbero → horario → datos → confirmación recorrido de punta a punta con datos simulados.
4. **Datos reales de Supabase**: **no probado** — seguimos sin credenciales reales (ver entrada anterior). Todo lo anterior se validó con mocks/interceptación de red, no contra el proyecto real de Enzo.
5. **Contraste**: el cobre/verde de marca sobre hueso y sobre negro-barbero se verificó visualmente en las capturas, se ve legible en ambos casos para el verde de prueba (`#2f6b4f`); como el color de marca lo define cada dueño de barbería vía `personalizacion.color_primario`, el contraste final depende de qué color elija — queda fuera de nuestro control validarlo en tiempo de diseño, solo en tiempo de uso.
6. **Teclado/foco**: verificado con Playwright (`Tab` sobre "← Volver") que el foco es visible (outline nativo del navegador sobre el botón, ningún `outline-none` global lo suprime en los elementos nuevos).
7. **Animaciones**: transiciones de paso y barra de progreso solo animan `transform`/`opacity`/`width` (esta última no es ideal por performance pero es una barra fina de 1px de alto, costo despreciable); no se detectó layout shift en las capturas.

**Por qué:**
- Sobreescribir la variable CSS en vez de agregar un prop de color a cada componente: cero cambios en Button/HoverLink/SectionRule/AnimatedNumber, y cualquier componente nuevo que use las clases `-cobre` del sistema hereda el theming automáticamente sin acordarse de nada especial.
- El indicador de progreso con conteo de pasos dinámico (3 o 4 según haya uno o varios barberos) evita mostrar "Paso 2 de 4" cuando en realidad no existe el paso de elegir barbero para una barbería con un solo barbero.
- Se agregó el estado de error de horarios porque, auditando el código previo, no existía — un vacío real detectado al ejecutar la Parte 7 y no solo al leer el código.

**Archivos afectados:**
- Reescritos: `src/pages/barberias/PaginaBarberia.jsx`, `src/pages/barberias/components/{AsistenteReserva,PasoServicio,PasoBarbero,PasoHorario,PasoDatos,Confirmacion}.jsx`, `src/components/layout/Footer.jsx` (prop `variante`).
- Nuevos: `src/utils/color.js` (`oscurecerHex`).
- Modificados: `src/utils/formatos.js` (`linkWhatsApp`), `src/components/common/HoverLink.jsx` (cambio cosmético: `ease-[cubic-bezier(...)]` → utilidad `ease-entrada` ya definida en el theme, detectado por el linter del editor).
- Temporal, creado y eliminado en la misma sesión: `.env` local con placeholders (se mantiene, es necesario para levantar `npm run dev` sin credenciales reales), ruta `/_qa-barberia` + `_QAPreviewBarberia.jsx` + scripts `.qa-*.mjs` (todo eliminado tras la verificación).

**Pendiente / próximos pasos:**
1. Login (`/login`), Panel barbero (`/panel/precios`), Panel admin (`/panel`), Panel superadmin (`/admin`) — en ese orden, ya con el esquema de datos confirmado.
2. Validar contra datos reales de Supabase en cuanto Enzo entregue credenciales — todo lo construido hasta ahora (barbería pública + home) solo se probó con mocks/interceptación de red.

---

## 2026-08-05 - Login por usuario, contexto de sesión y guardia de rutas por rol

**Qué se hizo:**
Se implementó el login (`/login`) y toda la base de autenticación/autorización que los tres paneles van a compartir:

- **`supabase/sql/001_login_por_usuario.sql`** (nuevo, requiere que Enzo lo ejecute en el SQL editor de su proyecto): función RPC `obtener_email_por_usuario(p_usuario text)`, `security definer`, que devuelve **solo** el `email_tecnico` de la fila de `usuarios` que coincide — nunca la fila completa — y con permiso de ejecución para `anon`. Es el mecanismo estándar para loguear por usuario cuando la autenticación real (Supabase Auth) es por email: se resuelve `usuario → email_tecnico` sin sesión, y con eso recién se llama `signInWithPassword`.
- **`src/services/authService.js`**: `iniciarSesion({usuario, password})` (resuelve email vía RPC → `signInWithPassword` → si cualquiera de los dos falla, mensaje genérico "Usuario o contraseña incorrectos" — a propósito no se distingue "usuario no existe" de "clave incorrecta", para no poder usar el formulario para enumerar usuarios), `cerrarSesion()`, `obtenerPerfil(authUserId)` (lee la fila de `usuarios` asumiendo que `usuarios.id = auth.uid()`, según el diagrama ER de Enzo).
- **`src/context/AuthContext.jsx`** + **`src/hooks/useAuth.js`** (se separó el hook a su propio archivo porque el linter marcó que exportar contexto+componente+hook desde un mismo archivo rompe React Fast Refresh): al montar la app llama `supabase.auth.getSession()` y se suscribe a `onAuthStateChange`; cada vez que hay sesión, carga el perfil de `usuarios` — si la sesión de Auth existe pero no hay fila en `usuarios` (o RLS la bloquea), se trata como sesión inválida en vez de dejar la app en un estado a medias.
- **`src/utils/roles.js`**: constantes `ROL_SUPERADMIN=1`/`ROL_ADMIN=2`/`ROL_BARBERO=3` (según el catálogo `roles` confirmado) y `rutaPorRol(rolId)` → `/admin` | `/panel` | `/panel/precios`.
- **`src/routes/RutaProtegida.jsx`**: guardia de ruta reutilizable (`rolesPermitidos`) — sin sesión redirige a `/login` (guardando `desde` en el state de navegación); con sesión pero rol no permitido, redirige a su propia área (no a una página de error) usando `rutaPorRol`.
- **`src/pages/Login/Login.jsx`**: split-screen — panel izquierdo oscuro con el poste de barbero estático (`StaticBarberPoleIllustration`, ya existía como fallback mobile del hero, se reutilizó aquí sin costo de WebGL) + titular `TextReveal`; panel derecho con el mismo estilo de formulario que `PasoDatos` (inputs subrayados, etiquetas en versalitas, botón `Button` compartido). En mobile el panel oscuro se comprime a una franja superior en vez de ocupar la pantalla completa, para que el formulario quede alcanzable con el pulgar sin scroll. Redirección automática por `rol_id` ya autenticado (si alguien visita `/login` con sesión activa, no ve el formulario).

**Cómo se probó:**
- `npm run lint` (un solo warning esperado sobre Fast Refresh en `AuthContext.jsx` por exportar el contexto junto al `AuthProvider`; no es un error y es un patrón estándar de React) y `npm run build`, ambos limpios.
- Viewports 375 y 1440 con Playwright: layout de dos columnas en desktop, apilado con franja compacta en mobile, sin scroll horizontal.
- **Validación de formulario vacío**: mensajes "Ingresa tu usuario"/"Ingresa tu contraseña" en rojo bajo cada campo.
- **Flujo de login exitoso, de punta a punta con red interceptada** (`page.route` sobre `rest/v1/rpc/obtener_email_por_usuario`, `auth/v1/token` y `rest/v1/usuarios`, simulando un usuario con `rol_id: 2`): confirmado que tras el submit la app navega a `/panel` — o sea, el flujo completo RPC → `signInWithPassword` → `onAuthStateChange` → carga de perfil → redirección por rol funciona de extremo a extremo.
- **Credenciales inválidas** (RPC devuelve `null`): se confirmó visualmente el mensaje "Usuario o contraseña incorrectos." bajo el formulario, sin revelar si el usuario existía.
- **No probado**: contra el proyecto real de Supabase de Enzo (sigue sin credenciales), ni la función RPC en sí (no se puede crear/ejecutar sin acceso a su base) — queda pendiente que la corra y confirme.

**Por qué:**
- RPC en vez de una policy de RLS abierta sobre `usuarios`: expone la superficie mínima posible (un solo string) en vez de arriesgar que una policy mal escrita deje leer toda la tabla de usuarios sin sesión.
- Mensaje de error idéntico para "no existe" y "clave incorrecta": evita enumeración de usuarios válidos, una buena práctica estándar de seguridad en login.
- Reusar `StaticBarberPoleIllustration` en vez de crear una nueva escena 3D para el login: ya cumple el criterio de identidad visual (mismo objeto, mismos colores) sin el costo de otra escena WebGL en una página que ni siquiera es mobile-first prioritaria para performance del 3D.

**Archivos afectados:**
- Nuevos: `supabase/sql/001_login_por_usuario.sql`, `src/services/authService.js`, `src/context/AuthContext.jsx`, `src/hooks/useAuth.js`, `src/utils/roles.js`, `src/routes/RutaProtegida.jsx`, `src/pages/Login/{Login.jsx,esquemaLogin.js}`.
- Modificados: `src/main.jsx` (envuelve la app en `<AuthProvider>`), `src/routes/AppRouter.jsx` (ruta `/login`).

**Pendiente / próximos pasos:**
1. Que Enzo ejecute `supabase/sql/001_login_por_usuario.sql` en su proyecto — sin eso el login no puede funcionar contra datos reales.
2. Panel del barbero (`/panel/precios`), Panel admin (`/panel`), Panel superadmin (`/admin`) — con `RutaProtegida` ya lista para envolverlos.
3. Sigue pendiente la validación contra Supabase real (home, barbería pública y ahora login) por falta de credenciales.

---

## 2026-08-06 - Panel del barbero (`/panel/precios`) y cascarón compartido de paneles

**Qué se hizo:**
Primer panel autenticado, el más simple según el orden acordado. Se construyó también el cascarón (`PanelShell`) que van a reutilizar el panel de barbería y el de superadmin:

- **`src/components/panel/PanelShell.jsx`**: barra superior densa (marca + sección actual + nombre/rol del usuario + "Cerrar sesión") y una franja de navegación opcional (`nav`, sin usar todavía — la necesitará el panel admin con varias secciones). Deliberadamente **no** reusa el `Header`/`Footer` de marketing: los paneles siguen la misma tipografía/color/curvas de animación pero priorizan densidad y velocidad por sobre el lenguaje editorial de la landing, tal como pide el prompt (referencia Linear/Vercel, no "dashboard con sidebar morado").
- **`src/pages/panel/hooks/useServiciosPanel.js`**: `useServiciosDeBarberia(barberiaId)` + `useActualizarPrecioServicio(barberiaId)`. La mutación **solo** envía `precio_clp`/`precio_oferta`/`oferta_activa` en el `update` — nunca toca `nombre`/`duracion_minutos`/`activo` — respetando en el propio código el contrato de permisos del rol barbero, más allá de lo que ya restrinja RLS. Guardado optimista real: `onMutate` actualiza el cache de React Query antes de que responda el servidor, `onError` hace rollback a la snapshot previa.
- **`src/pages/panel/components/InterruptorOferta.jsx`**: switch propio (no de librería de iconos) para `oferta_activa`, con el punto deslizándose con `EASE_ENTRADA`.
- **`src/pages/panel/components/FilaServicioPrecio.jsx`**: cada fila maneja su propio estado visual "Guardando… / Guardado / No se pudo guardar" (se desvanece solo tras 1.8s si fue exitoso). Nombre y duración se muestran visiblemente distintos (atenuados, con etiqueta "solo lectura") de los campos editables (inputs con subrayado, foco color de marca).
- **`src/pages/panel/PanelBarbero.jsx`**: arma todo con `perfil.barberia_id` del `AuthContext`. Estados de carga (`Loader`), error ("No pudimos cargar tus servicios…") y vacío ("Tu barbería aún no tiene servicios cargados…") explícitos.
- **`AppRouter.jsx`**: `/panel/precios` ahora vive bajo `<RutaProtegida rolesPermitidos={[ROL_BARBERO]} />`.

**Cómo se probó:**
- `npm run lint` / `npm run build` limpios (mismo warning conocido de Fast Refresh en `AuthContext.jsx`).
- **Sin sesión**: navegar directo a `/panel/precios` redirige a `/login` — confirmado con Playwright.
- **Flujo completo con red interceptada** (RPC + auth + `usuarios` con `rol_id: 3` + `servicios` con GET/PATCH mockeados): login → panel → edición de precio normal (blur dispara `PATCH`, UI muestra "Guardado") → toggle de oferta (dispara `PATCH` inmediato). Viewports 375 y 1440 revisados, sin scroll horizontal, misma identidad tipográfica que el resto del sitio pero con densidad de panel.
- **Estado de error simulado** (`PATCH` devuelve 500): se confirmó que el campo optimista vuelve a su valor anterior (`12000` en vez de `99999`) y aparece "No se pudo guardar" en rojo — el rollback de React Query funciona de extremo a extremo, no solo en el papel.
- **Estado vacío** (barbería sin servicios): mensaje explícito, no una tabla en blanco.
- **No probado**: contra Supabase real (sigue pendiente por falta de credenciales) ni la función RPC de login (requiere que Enzo la ejecute).

**Por qué:**
- El switch de oferta guarda inmediatamente al tocarlo (no espera un botón "Guardar" aparte) y los precios se guardan al perder el foco: son dos patrones de guardado distintos para dos tipos de campo distintos, pero ambos "optimistas" — se sintió más rápido de operar para un barbero actualizando precios entre clientes que un formulario con botón de guardado explícito.
- `PanelShell` se construyó ya pensando en los próximos dos paneles (con `nav` como prop opcional) para no tener que rehacer la barra superior tres veces.

**Archivos afectados:**
- Nuevos: `src/components/panel/PanelShell.jsx`, `src/pages/panel/PanelBarbero.jsx`, `src/pages/panel/hooks/useServiciosPanel.js`, `src/pages/panel/components/{InterruptorOferta,FilaServicioPrecio}.jsx`.
- Modificado: `src/routes/AppRouter.jsx` (ruta protegida `/panel/precios`).

**Pendiente / próximos pasos:**
1. Panel de barbería/admin (`/panel`): barberos, servicios, horarios, bandeja de reservas, límite de `max_barberos` según plan.
2. Panel superadmin (`/admin`).
3. Validación contra Supabase real sigue pendiente (home, barbería pública, login, panel barbero) — falta que Enzo entregue credenciales y ejecute el SQL del login.

---

## 2026-08-06 - Panel de barbería/admin (`/panel`): barberos, servicios, horarios y bandeja de reservas

**Qué se hizo:**
Segundo panel, para el rol `admin` (dueño de barbería). Cuatro secciones bajo una navegación por pestañas compartida:

- **`src/pages/panel/PanelAdminLayout.jsx`**: envuelve `PanelShell` con una franja de pestañas (`Reservas / Barberos / Servicios / Horarios`, con `NavLink` y subrayado activo en color de marca) y un `<Outlet/>`. `/panel` redirige por defecto a `/panel/reservas` (se decidió mostrar primero lo que está pasando ahora mismo — la bandeja — en vez de la gestión de recursos).
- **`src/pages/panel/PanelReservas.jsx`**: lista todas las reservas de la barbería (`useReservasBandeja`, ordenadas por `fecha_hora`), con nombre/teléfono del cliente (el teléfono es un link directo a WhatsApp reusando `linkWhatsApp`), servicio + barbero + precio, y un botón "Cancelar" que actualiza `estado` a `cancelada` (la fila queda tachada y sin botón, no desaparece — se necesita conservar el historial visible).
- **`src/pages/panel/PanelBarberos.jsx`**: lista de barberos con toggle `activo` (componente `Interruptor`, generalizado desde el `InterruptorOferta` del panel de precios — se movió a `src/components/panel/Interruptor.jsx` porque ahora lo comparten tres pantallas distintas) y un formulario para agregar uno nuevo. **Aplica el límite de `max_barberos` del plan contratado** (`useBarberiaAdmin` trae `planes.max_barberos` vía join): al llegar al límite, el formulario de alta se reemplaza por un mensaje explicando el motivo ("Alcanzaste el límite de 3 barberos de tu plan Equipo...") en vez de solo deshabilitar el botón sin explicación.
- **`src/pages/panel/PanelServicios.jsx`** + **`FilaServicioAdmin.jsx`**: a diferencia del panel del barbero (que solo edita precios), acá el admin edita **todos** los campos del servicio (nombre, duración, precio, precio oferta, oferta activa, publicado/oculto), con el mismo patrón de guardado optimista por campo al perder foco, más un formulario de creación.
- **`src/pages/panel/PanelHorarios.jsx`** + **`FilaHorario.jsx`**: selector de barbero (chips, mismo patrón visual que los días de la página pública de reserva) y, por barbero, sus bloques de horario (día + rango horario, con toggle `activo`) más un formulario para agregar un bloque nuevo.
- **`AppRouter.jsx`**: `/panel/*` ahora vive bajo `<RutaProtegida rolesPermitidos={[ROL_ADMIN]} />`, con `PanelAdminLayout` como layout de las 4 subrutas.

**Cómo se probó:**
- `npm run lint` / `npm run build` limpios.
- Suite completa de Playwright con red interceptada (RPC + auth + `usuarios` rol 2 + `barberias` con plan `Equipo`/`max_barberos: 3` + `barberos`/`servicios`/`horarios_disponibles`/`reservas` con GET/POST/PATCH mockeados y estado compartido entre requests, para que las mutaciones se reflejen en el siguiente GET):
  - Login → `/panel/reservas`, cancelar una reserva (queda tachada, sin botón).
  - Tab Barberos: con 2/3 barberos se puede agregar; al agregar el tercero (`3/3`) el formulario desaparece y aparece el mensaje del límite — confirmado visualmente en captura.
  - Tab Servicios: crear un servicio nuevo ("Afeitado a navaja") y verificar que aparece en la lista con sus datos correctos.
  - Tab Horarios: cambiar de barbero (chips) y ver sus horarios propios; formulario de alta de bloque.
  - Viewports 1440 y 375: mismo layout denso, sin scroll horizontal, pestañas con scroll horizontal propio en mobile (`overflow-x-auto`) en vez de recomprimirse.
- **No probado**: contra Supabase real (falta credenciales) — todo validado con mocks de red.

**Por qué:**
- El límite de `max_barberos` se aplica en el frontend contando barberos totales (activos + inactivos) contra `max_barberos`, no solo los activos — un plan limita cuántos barberos puede *tener* la barbería, no cuántos puede tener prendidos en un momento dado; esa interpretación es más conservadora y evita que alguien esquive el límite desactivando y reactivando.
- Cancelar reservas en vez de borrarlas: se necesita conservar el registro (auditoría, evitar que un cliente vea que "nunca reservó" si hay un reclamo).
- No se implementó edición de `nombre`/eliminación dura de barberos: no estaba pedido explícitamente y borrar un barbero con reservas/horarios asociados es una operación con consecuencias que ameritan su propio flujo (y probablemente un `estado`, no un `DELETE`) — se dejó fuera de alcance en vez de improvisar algo riesgoso.

**Archivos afectados:**
- Nuevos: `src/pages/panel/PanelAdminLayout.jsx`, `src/pages/panel/Panel{Reservas,Barberos,Servicios,Horarios}.jsx`, `src/pages/panel/hooks/use{BarberiaAdmin,BarberosAdmin,ServiciosAdmin,HorariosAdmin,ReservasBandeja}.js`, `src/pages/panel/components/{FilaServicioAdmin,FilaHorario}.jsx`, `src/components/panel/Interruptor.jsx`.
- Eliminado: `src/pages/panel/components/InterruptorOferta.jsx` (generalizado a `components/panel/Interruptor.jsx`, usado ahora por precios/barberos/servicios/horarios).
- Modificado: `src/pages/panel/components/FilaServicioPrecio.jsx` (importa el interruptor genérico), `src/routes/AppRouter.jsx`.

**Pendiente / próximos pasos:**
1. Panel superadmin (`/admin`): listado de barberías, alta con generación/validación de slug, activar/desactivar con motivo → `historial_estados`, gestión de planes, auditoría.
2. Sigue pendiente la validación contra Supabase real de todo lo construido hasta ahora.

---

## 2026-08-06 - Panel superadmin (`/admin`): barberías, altas, cambio de estado auditado y planes

**Qué se hizo:**
Tercer y último panel, para el rol `superadmin` (Enzo). Con esto quedan construidos los 5 módulos pedidos en el prompt original.

- **`supabase/sql/002_cambiar_estado_barberia.sql`** (nuevo, requiere que Enzo lo ejecute): función RPC `cambiar_estado_barberia(p_barberia_id, p_estado_nuevo_id, p_motivo)`. Activar/desactivar una barbería implica dos escrituras (actualizar `barberias.estado_id` + insertar en `historial_estados`) que deben ocurrir juntas — se hizo como función de Postgres en vez de dos llamadas sueltas desde el cliente para que sea una operación atómica, y porque al ser `security definer` puede leer el `rol_id` de quien llama y rechazar la operación si no es superadmin (sin ese chequeo, cualquier `security definer` sería una puerta abierta para que un admin de barbería cambiara el estado de cualquier otra).
- **`src/utils/estados.js`**: catálogo de estados (`ESTADO_ACTIVO=1` … `ESTADO_PENDIENTE_ACTIVACION=4`) con nombre para mostrar y color de badge por estado.
- **`src/utils/slug.js`**: `generarSlug()` normaliza (NFD), quita tildes/diacríticos y arma un slug válido de URL.
- **`src/pages/panel/PanelSuperadminBarberias.jsx`**: listado de todas las barberías con su estado (badge de color) y plan, más un formulario de alta — el slug se autogenera desde el nombre en tiempo real (editable a mano si se prefiere otro) y se valida su disponibilidad contra `barberias.slug` al perder el foco, con feedback inline ("Disponible"/"Ese slug ya está en uso"), y de nuevo antes de enviar por si cambió entre que se verificó y se envió el formulario. Las barberías nuevas nacen en estado **Pendiente de activación** — activarlas es una acción explícita y auditada, no un default silencioso.
- **`src/pages/panel/PanelSuperadminBarberiaDetalle.jsx`** (`/admin/barberias/:id`): reasignar el plan contratado (select simple), cambiar el estado con un formulario que **exige motivo** (sin motivo o sin estado seleccionado, no se envía y se muestra el error inline), e historial completo de cambios de estado (fecha, `estado_anterior → estado_nuevo`, motivo, quién lo hizo).
- **`src/pages/panel/PanelSuperadminPlanes.jsx`** + **`FilaPlan.jsx`**: gestión de planes (nombre, precio, máximo de barberos, orden) con el mismo patrón de guardado optimista por campo, y alta de planes nuevos.
- **`HoverLink.jsx`**: se generalizó para navegar por React Router (`<Link>`) cuando el `href` empieza con `/`, y seguir siendo un `<a>` normal para anclas de hash o URLs externas — lo necesitó el link "Ver auditoría →" de la lista de barberías (antes iba a anidar un `<a>` dentro de otro `<a>`, HTML inválido) y de paso mejora la navegación interna del resto del sitio (ya no recarga la página completa al ir al `/` del footer o del login).
- **`AppRouter.jsx`**: `/admin/*` bajo `<RutaProtegida rolesPermitidos={[ROL_SUPERADMIN]} />`.

**Cómo se probó:**
- `npm run lint` / `npm run build` limpios.
- Suite de Playwright con red interceptada (RPC de login + auth + `usuarios` rol 1 + `barberias`/`planes`/`historial_estados` con estado compartido entre requests):
  - Alta de una barbería con nombre "Peluquería Ñoño & Cía." → slug autogenerado `peluqueria-nono-cia`, aparece en la lista en estado "Pendiente de activación".
  - Cambio de estado con motivo ("Suspendido por pago" + "Atraso de 2 meses..."): el badge se actualiza, aparece la fila nueva en el historial con fecha, transición de estado y autor.
  - **Intento de cambio sin motivo**: confirmado que el formulario rechaza el envío con mensaje inline, sin llamar al RPC.
  - Gestión de planes: los 3 planes existentes se listan editables, alta de un plan nuevo.
  - Viewport 375: lista, badges y formulario se mantienen usables sin scroll horizontal.
- **No probado**: contra Supabase real ni la función RPC en sí — requiere que Enzo ejecute ambos archivos de `supabase/sql/` en su proyecto.

**Por qué:**
- Barberías nuevas en "Pendiente de activación" en vez de "Activo" por defecto: fuerza que activar una barbería pase siempre por el flujo auditado de cambio de estado (con motivo), en vez de que la creación sea una puerta trasera que la deja activa sin dejar rastro de quién decidió que ya estaba lista.
- No se implementó eliminar una barbería/plan: no estaba pedido y borrar un plan con barberías asignadas, o una barbería con reservas/historial, son operaciones destructivas que ameritan su propio diseño (¿qué pasa con sus datos?) — se dejó fuera de alcance en vez de improvisar un `DELETE` sin ese análisis.

**Archivos afectados:**
- Nuevos: `supabase/sql/002_cambiar_estado_barberia.sql`, `src/utils/{estados,slug}.js`, `src/pages/panel/PanelSuperadmin{Layout,Barberias,BarberiaDetalle,Planes}.jsx`, `src/pages/panel/hooks/use{BarberiasSuperadmin,PlanesSuperadmin,HistorialEstados}.js`, `src/pages/panel/components/FilaPlan.jsx`.
- Modificados: `src/components/common/HoverLink.jsx` (navegación interna vía React Router), `src/routes/AppRouter.jsx`.

**Estado general del proyecto tras esta fase:**
Los 5 módulos pedidos en el prompt están construidos: home rediseñada (ya existía), página pública de barbería + flujo de reserva rediseñado, login, panel barbero, panel admin, panel superadmin. **Todo funciona contra mocks/interceptación de red, nada contra el Supabase real de Enzo.**

**Pendiente / próximos pasos (para la siguiente sesión):**
1. Enzo debe: (a) ejecutar `supabase/sql/001_login_por_usuario.sql` y `002_cambiar_estado_barberia.sql` en su proyecto, (b) crear un `.env` con sus credenciales reales (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, ver `.env.example`), (c) confirmar que existan filas reales en `usuarios` con `email_tecnico` apuntando a usuarios ya creados en Supabase Auth.
2. Con credenciales reales: repetir la Parte 7 completa (los 5 módulos) contra datos reales — hasta ahora todo se validó con mocks de red, no se ha tocado el proyecto real ni una vez.
3. Conectar `onReservaCreada` (en `services/eventosReserva.js`) a una Supabase Edge Function real de WhatsApp/email — sigue como estaba, sin conectar, tal como pedía el alcance de esta fase.
4. Reemplazar el email de contacto placeholder de la landing (`hola@bookingbarber.cl`), pendiente desde la sesión de la landing original.

---

## 2026-08-06 - Falso positivo (rotación) + causa real: el fallback de `prefers-reduced-motion` se activa en el equipo de Enzo

**Qué se hizo:**
Enzo reportó que el poste 3D ya no se veía como antes. Primer diagnóstico (equivocado): se encontró `STATIC_ROTATION_Y = 1.3` en `BarberPoleModel.jsx` — distinto del `0.45` validado en la sesión del barrido de ángulos — y se revirtió a `0.45` asumiendo que era un valor corrompido. Enzo aclaró que ese `1.3` lo había asignado él mismo a propósito y que **no** era la causa del problema, así que se revirtió de vuelta a `1.3` (su valor).

Con eso descartado, se probó la hipótesis real con Playwright: renderizar el home emulando `prefers-reduced-motion: reduce` (`page.emulateMedia({ reducedMotion: 'reduce' })`). El resultado fue **pixel a pixel idéntico** a la captura que mandó Enzo — el poste chico, plano, con la elipse de sombra debajo (ese detalle de sombra solo existe en `StaticBarberPoleIllustration.jsx`, el SVG de repuesto; la escena 3D real no dibuja ninguna sombra). Confirmado: en el equipo personal de Enzo, el sistema operativo o el navegador tienen activada la preferencia de "reducir movimiento", y `HeroScene3D.jsx` está haciendo exactamente lo que se decidió en la sesión del 3D real — mostrar `StaticBarberPoleIllustration` en vez de montar el Canvas de Three.js — tal como pide la Parte 3 del prompt original ("Respeta `prefers-reduced-motion`"). **No es un bug de código**: es la app respetando una preferencia de accesibilidad del sistema operativo de Enzo.

**Cómo revisarlo/desactivarlo (para ver el modelo 3D real en ese equipo):**
- Windows 11: Configuración → Accesibilidad → Efectos visuales → activar "Efectos de animación".
- Windows 10: Configuración → Facilidad de acceso → Pantalla → activar "Mostrar animaciones en Windows".
- Alternativamente, en Chrome/Edge: `chrome://settings/accessibility` (o `edge://settings/accessibility`) → revisar si hay alguna extensión o flag forzando `prefers-reduced-motion`.
Con esa preferencia apagada, `usePrefersReducedMotion()` vuelve a devolver `false` y el hero vuelve a mostrar la escena 3D real, sin tocar código.

**Por qué no se "corrigió" el comportamiento en código:**
- Debilitar o quitar el respeto a `prefers-reduced-motion` para que el 3D se muestre siempre — incluso con esa preferencia activada — rompería la razón de ser de esa preferencia: existe para personas con sensibilidad real al movimiento (mareo, migraña, etc.), no es un ajuste cosmético. Cambiarlo afectaría a cualquier visitante real con esa condición, no solo al equipo de Enzo.

**Archivos afectados:**
- `src/components/animations/BarberPoleModel.jsx` (`STATIC_ROTATION_Y` terminó en `1.3`, el valor de Enzo — sin cambios netos respecto a antes de este día).

**Pendiente / próximos pasos:**
- Ninguno de código. Si Enzo prefiere ver siempre el 3D en su propio equipo sin cambiar la config del SO, se puede evaluar a futuro un atajo de desarrollo (ej. parámetro de URL `?forzar3d=1`) que ignore `prefers-reduced-motion` solo cuando está presente explícitamente — no implementado todavía porque no se pidió y cambia el comportamiento de accesibilidad si no se hace con cuidado.

---

## 2026-08-06 - Corregido: el poste 3D crecía un poco unos segundos después de cargar (bug real de medición del Canvas)

**Qué se hizo:**
Enzo reportó que, ya viendo el modelo 3D real (con el fallback de `prefers-reduced-motion` resuelto), el poste "carga bien, pasan unos segundos, y se agranda un poco" — su sospecha era que se estaba adaptando a la pantalla. Se midió esto directamente en vez de asumir: con Playwright, sirviendo el build de producción (`vite preview`) y limitando la red a ~6 Mbps/60ms de latencia (para reproducir una carga real, no la de localhost sin límites), se tomaron muestras de `canvas.width`/`canvas.height` (la resolución real del buffer de dibujo, no solo el CSS) cada pocos cientos de milisegundos tras la carga.

Resultado antes del fix: el canvas aparecía en `381×476` y, sin que el contenedor CSS cambiara de tamaño (`parentWidth/Height` ya estaban en `384×480` desde el principio), el propio `<canvas>` saltaba a `384×480` recién ~1 segundo después — un salto real y medible de casi 1%, exactamente el "se agranda un poco" que describió Enzo.

**Causa:** en `Hero.jsx`, el `motion.div` que envuelve `<HeroScene3D />` tenía una animación de entrada con `scale: 0.82 → 1` (Framer Motion, vía `transform: scale(...)`). React Three Fiber mide el tamaño de su contenedor para fijar la resolución del canvas, y `getBoundingClientRect()` **sí** incluye transforms CSS activos — si esa primera medición ocurre mientras el `scale` todavía no llega a 1 (muy probable, dado que el Canvas real monta de forma asíncrona tras cargar el `.glb` por Suspense, en cualquier punto de esa animación de 1.1s), el canvas queda fijado a una resolución ligeramente menor. Como los cambios de `transform` **no** disparan `ResizeObserver` (así lo especifica el estándar — solo reacciona a cambios reales de layout), esa resolución "de más chica" queda pegada hasta que algún evento de layout no relacionado (en la prueba, aparentemente ligado a que las fuentes terminan de cargar) fuerza una remedición y el canvas salta a su tamaño correcto.

**Fix:** se quitó `scale` de esa animación de entrada en `Hero.jsx`, dejando solo `opacity` + `y` (fade + un pequeño desplazamiento vertical) — igual al patrón que ya usan el resto de los elementos del Hero (párrafo, botones), que nunca tuvieron este problema porque `translateY` no afecta el tamaño medido por `getBoundingClientRect()`, solo la posición.

**Cómo se verificó:**
Se repitió exactamente la misma medición (misma limitación de red, mismo build) después del cambio: el canvas aparece directamente en `384×480` y se mantiene así en todas las muestras hasta los 9 segundos — sin ningún salto. Se confirmó también visualmente comparando dos capturas tomadas a 4.5s y a 9.5s de la carga: idénticas en tamaño y posición. Se corrió de nuevo la batería de viewports (375/768/1440) sobre el home para descartar que el cambio afectara algo más — sin errores de consola ni scroll horizontal. `npm run lint` y `npm run build` limpios.

**Por qué:**
- Se descartó reproducir el bug "a ojo" en el dev server local (todo carga casi instantáneo en localhost sin límite de red) y se usó en cambio el build de producción con throttling de red real — sin eso, la ventana de tiempo en la que el `Canvas` mide su contenedor mientras el `scale` todavía anima es demasiado corta para siquiera notarla en desarrollo, pero se vuelve perfectamente perceptible (y medible) bajo condiciones de red reales, que es justamente donde Enzo lo notó.
- Se quitó el `scale` en vez de, por ejemplo, retrasar el montaje del Canvas hasta que la animación del padre terminara: es la solución más simple, y de paso deja la animación de entrada del poste consistente con el resto de los elementos del Hero (ninguno de los cuales anima `scale`).

**Archivos afectados:**
- `src/pages/Home/components/Hero.jsx` (se quitó `scale` de la animación de entrada del contenedor del poste 3D).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Corregido: las etiquetas en versalitas se veían pixeladas (small-caps sintético, no un problema de DPR ni del 3D)

**Qué se hizo:**
Enzo reportó letras pixeladas "en algunas partes" en varias pantallas, desde 1920x1080 hasta un iPhone XR. Se descartaron dos hipótesis antes de dar con la causa real:
1. **Densidad de píxeles del Canvas 3D** — descartado explícitamente por Enzo ("el modelo 3D no lo toques, todo eso está bien").
2. **Transform residual de Framer Motion tras animar** (una teoría razonable: texto en su propia capa compuesta puede perder el antialiasing de subpíxel) — se verificó con Playwright leyendo `getComputedStyle(el).transform` sobre titulares ya animados (`Hero` y una sección con `ScrollReveal`) y en ambos casos el resultado fue `"none"` — Framer Motion sí limpia el transform al asentarse. Hipótesis descartada con evidencia, no solo por suposición.

**Causa real, confirmada con una comparación directa:** la clase `.versalitas` (usada en absolutamente todas las etiquetas del sitio — el eyebrow del hero, cada `SectionRule`, el nav, los links del footer, los badges de plan, etc.) usaba `font-variant-caps: small-caps`. Archivo (la fuente del sitio) no trae mayúsculas pequeñas reales (glifo OpenType `smcp`), así que el navegador las **sintetiza**, escalando hacia abajo el glifo de la mayúscula normal — a los 12-14px que usan esas etiquetas, ese glifo reescalado se ve notoriamente más tosco que el resto del texto del sitio. Se armó una comparación directa (mismo texto, mismo tamaño, con y sin `small-caps` sintético, mismo `deviceScaleFactor`) y la diferencia es evidente a simple vista: el small-caps sintético sale más delgado y con bordes menos definidos.

**Fix:** `.versalitas` pasó de `font-variant-caps: small-caps` a `text-transform: uppercase` con `letter-spacing` más ancho (0.03em → 0.07em) y `font-weight: 600` — mayúsculas reales nunca se reescalan, son el mismo glifo que cualquier otro texto del sitio, así que no hay reescalado que pueda verse tosco a ningún tamaño ni densidad de píxeles.

**Cómo se probó:**
Batería completa en 8 combinaciones de viewport/DPR, desde 1920×1080 (sin escalado, el peor caso realista para nitidez de texto) y con escalado de Windows típico (125%), pasando por laptops (1440×900, 1366×768) y tablets, hasta **iPhone XR (414×896 @ DPR 2)** e iPhone SE (375×667 @ DPR 2) — en las 8: sin scroll horizontal, sin errores de consola, y se verificó explícitamente que ninguna etiqueta `.versalitas` quedara cortada o desbordada por el cambio a mayúsculas reales (ocupan más ancho que el small-caps sintético). Comparación visual de la home completa a 1920×1080 sin escalado (el escenario donde más se notaba el problema) confirma que todas las etiquetas — eyebrow del hero, cada índice de sección, badges — ahora se ven nítidas.

**Por qué:**
- Se descartaron las dos hipótesis previas con evidencia (lectura real de `getComputedStyle`, confirmación explícita de Enzo sobre el 3D) antes de asumir la causa siguiente — evita "arreglar" algo que no estaba roto.
- Mayúsculas reales + tracking en vez de volver a un `text-transform: uppercase` con `tracking-widest` "genérico de SaaS" (lo que se quería evitar desde el principio del rediseño editorial): se compensó con un tracking más generoso (0.07em) y peso semibold para que la etiqueta siga leyéndose como un recurso tipográfico deliberado, no como el patrón por defecto de cualquier landing.

**Archivos afectados:**
- `src/index.css` (clase `.versalitas`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - El contenido de la demo quedaba pegado arriba del teléfono — centrado vertical real

**Qué se hizo:**
Con el piso de alto restaurado (entrada anterior), el teléfono volvió a verse bien proporcionado, pero el contenido de cada pantalla (que nunca llega a ocupar todo ese alto) quedaba pegado arriba, con todo el espacio libre acumulado abajo — Enzo lo notó de inmediato.

Causa: la técnica de apilar las 5 pantallas en `[grid-area:1/1]` mide correctamente el alto de la más alta, pero ese bloque (ya medido) no se estiraba para ocupar el resto del alto del teléfono — un `h-full` que se había puesto para eso **no funciona** ahí, porque el div de la pantalla del teléfono (`PhoneMockup`) solo tiene `min-height`, no un alto explícito, y un hijo con `height:100%` no se estira contra un padre cuyo alto viene únicamente de `min-height` (comportamiento estándar de CSS, no un bug del navegador) — por eso el `h-full` quedaba sin efecto y el bloque de contenido se quedaba con su alto natural, arriba del todo.

**Fix:** se cambió el mecanismo de "estirar" de porcentaje a flexbox, que sí reparte el espacio libre correctamente contra un `min-height`: `PhoneMockup.jsx` ahora es `flex flex-col` en vez de bloque simple, y el contenedor de las 5 pantallas en `LiveDemo.jsx` pasó de `h-full` a `flex-1` (además de `content-center` para centrar ese bloque dentro del espacio extra, y `flex flex-col justify-center` en cada pantalla individual para que las más cortas —como "Elige un barbero"— se centren también dentro de la fila compartida con las más altas).

**Cómo se verificó:**
Capturas de las 5 pantallas recortadas al marco real del teléfono (1440px): las dos más cortas (Servicio, Barbero) y la más alta (Datos) quedan todas centradas verticalmente con márgenes equilibrados arriba y abajo, ya no pegadas arriba. Se repitió la batería de 6 viewports (375/390/768/1024/1440/1920): sin scroll horizontal ni errores de consola. `npm run build` limpio.

**Por qué:**
- Flexbox en vez de insistir con porcentajes: es la herramienta correcta para "reparte el espacio libre de un contenedor cuyo alto viene de `min-height`" — intentar forzarlo con `height: 100%` es exactamente el tipo de suposición de CSS que parece que debería funcionar pero no lo hace, y quedarse con esa suposición sin verificar habría dejado el mismo bug con otro nombre.

**Archivos afectados:**
- `src/components/common/PhoneMockup.jsx` (el contenedor de pantalla pasó a `flex flex-col`).
- `src/pages/Home/components/LiveDemo.jsx` (`h-full` → `flex-1` + `content-center` en el contenedor de las 5 pantallas; `flex flex-col justify-center` agregado a cada pantalla individual).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Corregido: las etiquetas en versalitas se veían pixeladas (small-caps sintético, no un problema de DPR ni del 3D)

**Qué se hizo:**
Enzo reportó letras pixeladas "en algunas partes" en varias pantallas, desde 1920x1080 hasta un iPhone XR. Se descartaron dos hipótesis antes de dar con la causa real:
1. **Densidad de píxeles del Canvas 3D** — descartado explícitamente por Enzo ("el modelo 3D no lo toques, todo eso está bien").
2. **Transform residual de Framer Motion tras animar** (una teoría razonable: texto en su propia capa compuesta puede perder el antialiasing de subpíxel) — se verificó con Playwright leyendo `getComputedStyle(el).transform` sobre titulares ya animados (`Hero` y una sección con `ScrollReveal`) y en ambos casos el resultado fue `"none"` — Framer Motion sí limpia el transform al asentarse. Hipótesis descartada con evidencia, no solo por suposición.

**Causa real, confirmada con una comparación directa:** la clase `.versalitas` (usada en absolutamente todas las etiquetas del sitio — el eyebrow del hero, cada `SectionRule`, el nav, los links del footer, los badges de plan, etc.) usaba `font-variant-caps: small-caps`. Archivo (la fuente del sitio) no trae mayúsculas pequeñas reales (glifo OpenType `smcp`), así que el navegador las **sintetiza**, escalando hacia abajo el glifo de la mayúscula normal — a los 12-14px que usan esas etiquetas, ese glifo reescalado se ve notoriamente más tosco que el resto del texto del sitio. Se armó una comparación directa (mismo texto, mismo tamaño, con y sin `small-caps` sintético, mismo `deviceScaleFactor`) y la diferencia es evidente a simple vista: el small-caps sintético sale más delgado y con bordes menos definidos.

**Fix:** `.versalitas` pasó de `font-variant-caps: small-caps` a `text-transform: uppercase` con `letter-spacing` más ancho (0.03em → 0.07em) y `font-weight: 600` — mayúsculas reales nunca se reescalan, son el mismo glifo que cualquier otro texto del sitio, así que no hay reescalado que pueda verse tosco a ningún tamaño ni densidad de píxeles.

**Cómo se probó:**
Batería completa en 8 combinaciones de viewport/DPR, desde 1920×1080 (sin escalado, el peor caso realista para nitidez de texto) y con escalado de Windows típico (125%), pasando por laptops (1440×900, 1366×768) y tablets, hasta **iPhone XR (414×896 @ DPR 2)** e iPhone SE (375×667 @ DPR 2) — en las 8: sin scroll horizontal, sin errores de consola, y se verificó explícitamente que ninguna etiqueta `.versalitas` quedara cortada o desbordada por el cambio a mayúsculas reales (ocupan más ancho que el small-caps sintético). Comparación visual de la home completa a 1920×1080 sin escalado (el escenario donde más se notaba el problema) confirma que todas las etiquetas — eyebrow del hero, cada índice de sección, badges — ahora se ven nítidas.

**Por qué:**
- Se descartaron las dos hipótesis previas con evidencia (lectura real de `getComputedStyle`, confirmación explícita de Enzo sobre el 3D) antes de asumir la causa siguiente — evita "arreglar" algo que no estaba roto.
- Mayúsculas reales + tracking en vez de volver a un `text-transform: uppercase` con `tracking-widest` "genérico de SaaS" (lo que se quería evitar desde el principio del rediseño editorial): se compensó con un tracking más generoso (0.07em) y peso semibold para que la etiqueta siga leyéndose como un recurso tipográfico deliberado, no como el patrón por defecto de cualquier landing.

**Archivos afectados:**
- `src/index.css` (clase `.versalitas`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Ampliación de la home: 8 secciones nuevas, corregido el desborde real de precios, contraste AA, sistema de animación formalizado

**Qué se hizo:**
Enzo pidió ampliar la home con 8 secciones nuevas dentro del lenguaje editorial ya establecido, corregir el desborde de la tabla de precios, y formalizar el sistema de animación. Se hizo todo, en el orden pedido, más dos correcciones que aparecieron al probar en serio (no al leer el código).

**0. Causa raíz real del desborde de Pricing:**
No era el grid asimétrico ni falta de `min-width:0` — era `table-layout: auto` (el default del navegador): con contenido largo (el botón "Elegir Estudio", la fila "Notificación automática por WhatsApp"), el navegador ensancha cada columna según su contenido más ancho y estira la tabla entera más allá de su contenedor. Se agregó `table-fixed` (`Pricing.jsx`), que fuerza a que el texto envuelva en vez de empujar el ancho. Además, `Home.jsx` tenía `overflow-x-clip` en el contenedor raíz — eso estaba **tapando** el desborde real (por eso el chequeo automatizado de `scrollWidth` no lo detectaba) en vez de arreglarlo; se quitó, ya que las decoraciones que lo necesitaban (el glow del Hero) ya se contienen solas con su propio `overflow-hidden`.

**1. Sistema de animación formalizado (`components/animations/easing.js`):**
Ya existían las curvas (`EASE_ENTRADA`/`EASE_SALIDA`/`EASE_REBOTE`) pero no las duraciones ni los stagger — se agregaron `DURACION_MICRO/BASE/LENTA` y `STAGGER_TEXTO/LISTA` como constantes con nombre, y se reemplazaron los números sueltos que quedaban en `ScrollReveal`/`StaggerReveal`/`TextReveal` por esas constantes. **Se agregó soporte a `prefers-reduced-motion` directo en esos tres primitivos** (antes no lo tenían — cualquier componente que los usara heredaba el hueco): con la preferencia activa, muestran el contenido final sin máscara/desplazamiento en vez de intentar animar con duración 0.

**2. Las 8 secciones nuevas** (en el orden final: Hero → Cómo funciona → **Demo en vivo** → Todo lo que necesitas → **Marquee del oficio** → **Calculadora** → **Vistazo al panel** → **Cuaderno vs App** → Planes → **Cupos fundadores** → **FAQ** → Footer):

- **Demo en vivo** (`LiveDemo.jsx`): mockup de celular dibujado en CSS (`PhoneMockup.jsx`, sin foto de stock) con las 5 pantallas del flujo de reserva simplificadas, avanzando solas cada 2.4s vía `setInterval` **solo mientras la sección está en viewport** (`useInView` de Framer Motion controla si el interval corre) — así no gasta ciclos si el visitante ya bajó más allá. Texto editorial sincronizado al mismo índice de paso. Enlace a `/demo`.
- **`/demo` — barbería demo real, no una simulación aparte**: en vez de construir una vista de demo separada, se hizo que `PaginaBarberia`/`AsistenteReserva` (el código real de producción) acepten un tenant que no existe en Supabase. `RutaDemo.jsx` provee datos estáticos (`config/demo.js`: "Barbería El Andén", 3 servicios, 1 barbero, horario Lun-Sáb 10-19h) por el mismo contrato de contexto que `RutaBarberia`. Los tres hooks de datos (`useHorariosDisponibles`, `useReservasDelDia`, `useCrearReserva`) detectan el `barbero_id` demo (`esBarberoDemo()`) y devuelven datos locales / simulan el insert con un delay de 500ms en vez de tocar Supabase — el visitante hace la reserva completa de verdad, con el código real, sin que dependa de que exista una fila real en la BD ni de que Supabase esté disponible.
- **Marquee del oficio** (`Marquee.jsx`): dos filas en `@keyframes` CSS puro (no Framer Motion — un loop infinito se hace más simple y liviano en CSS), doblando el contenido y desplazando a `-50%` para que el ciclo no se note, pausa con `:hover` vía `.marquee-pista:hover .marquee-fila { animation-play-state: paused }`. **Sin fotos de stock de barberos**: como se pidió explícitamente evitarlas mientras no haya fotografía real de barberías clientes, se dibujaron 6 iconos de línea propios (navaja, peine, sillón, tijera, brocha, espejo — `ILUSTRACIONES` en el propio archivo) a modo de placeholder honesto, con una leyenda que dice directamente que todavía no hay fotos reales. La estructura ya recibe `{id, etiqueta, imagenUrl}` por barbería — con `imagenUrl` puesto, usa la foto real en vez del ícono.
- **Calculadora de citas perdidas** (`CalculadoraCitasPerdidas.jsx`): tres `<input type="range">` reskineados por completo vía CSS (`.slider-editorial` en `index.css`, con relleno de progreso vía variable CSS `--relleno` que el input actualiza inline) — se mantiene el input nativo (no divs a mano) para no perder gratis el soporte de teclado/touch/lector de pantalla. Resultado con contador en vivo (`LiveNumber.jsx`, nuevo — a diferencia de `AnimatedNumber` que cuenta una sola vez al entrar en viewport, este sigue cualquier valor que cambie en tiempo real).
- **Vistazo al panel** (`PanelPreview.jsx`): mockup real en HTML/CSS (sidebar + tabla de reservas, mismo lenguaje visual que los paneles reales) con 3 anotaciones. Simplificación consciente: en vez de líneas conectoras que apuntan a un punto exacto del mockup (frágil de mantener responsive), son tick-marks horizontales alineados por posición vertical con `justify-between`, estética de "plano técnico" sin depender de coordenadas absolutas calculadas contra el layout real.
- **Cuaderno + WhatsApp vs. booking.barber.cl** (`NotebookVsApp.jsx`): dos columnas sin bordes ni cards, filas separadas por reglas finas, cada lado entra desde su lado (izquierda/derecha) con stagger. Fondo oscuro (ver punto de ritmo más abajo).
- **Cupos fundadores** (`FounderSpots.jsx`): número de cupos disponibles viene de `config/fundadores.js` (`CUPOS_TOTALES`/`CUPOS_OCUPADOS`), no hardcodeado en el JSX — se edita ahí a mano según entren barberías reales, no hay tabla en Supabase para esto porque es una decisión comercial de Enzo, no un dato del producto. **Sin testimonios ni clientes falsos**: la copia dice explícitamente que no hay casos de éxito que mostrar todavía porque el producto recién empieza — se decidió covertir la falta de clientes en el argumento de venta (precio congelado) en vez de fabricar prueba social.
- **FAQ** (`FAQ.jsx`): acordeón con `motion.div` animando `height: 'auto'` (Framer Motion mide el contenido real, no es un salto ni un `display:none`), indicador propio (dos barras que rotan entre "+" y "−", no un ícono de librería), `aria-expanded`/`aria-controls`/`role="region"` correctos, navegable por teclado (botón nativo).
- **Contacto por WhatsApp reforzado en el Footer**: número en `VITE_WHATSAPP_CONTACTO` (`.env`/`.env.example`), mensaje pre-armado ("Hola, quiero información sobre booking.barber.cl para mi barbería") vía `linkWhatsApp` (ya existía, se reusó), presentado como link secundario junto al botón principal — misma jerarquía que el resto del sitio, no un botón flotante verde aparte.

**3. Ritmo vertical — ajuste tras revisar el resultado completo:**
Con las 8 secciones nuevas en su lugar, `NotebookVsApp` y `FounderSpots` quedaban claras por defecto, lo que dejaba **cinco secciones de fondo claro seguidas** (Panel, Cuaderno-vs-App, Precios, Fundadores, FAQ) entre la Calculadora (oscura) y el Footer (oscuro) — la monotonía exacta que se pidió evitar. Se pasaron `NotebookVsApp` y `FounderSpots` a fondo oscuro (con sus tokens de texto invertidos correspondientes), quedando la alternancia: oscuro-claro-claro-oscuro-claro-oscuro-claro-**oscuro**-claro-**oscuro**-claro-oscuro. Nunca más de dos secciones claras seguidas.

**4. Contraste AA — bug real, no solo teoría:**
Se calculó el contraste real (fórmula WCAG, no a ojo) de cada combinación texto/fondo del sistema. `--color-cobre` (#a85c32) da **4.28:1 sobre hueso y 3.48:1 sobre negro-barbero** — pasa el mínimo AA (3:1) solo en texto grande (≥24px o ≥18.66px bold), pero se estaba usando en textos chicos (etiquetas versalitas, números de índice, el precio de oferta en `PasoServicio`, el botón principal completo). Se agregaron dos variantes al `@theme` de `index.css`: `--color-cobre-texto` (#8f4e2a, 5.51:1 sobre hueso) y `--color-cobre-claro` (#dd9569, 7.03:1 sobre negro-barbero), y se reemplazó cada uso de `text-cobre` en texto chico por la variante correcta según el fondo — incluyendo el botón principal (`Button.jsx` pasó de `bg-cobre` a `bg-cobre-oscuro`, que sí pasa AA con texto hueso encima, 6.83:1) y dos usos dentro del flujo real de reserva (`PasoServicio.jsx`, `AsistenteReserva.jsx`) que no tienen que ver con esta ampliación de la home pero tenían el mismo defecto.
**Límite conocido, no resuelto en esta fase:** `PaginaBarberia` permite que cada barbería fije su propio `color_primario`, que sobreescribe `--color-cobre` vía variable CSS — pero `--color-cobre-texto`/`--color-cobre-claro` son fijos, no derivados de ese color. Si una barbería elige un color de marca muy claro, su eslogan/precio de oferta pueden volver a fallar contraste. Arreglarlo bien requiere calcular contraste en tiempo de ejecución a partir del color elegido (o restringir qué colores se pueden elegir), no es un cambio chico — queda pendiente, ver más abajo.

**5. Dos bugs reales encontrados al ejecutar la Parte 5, no leyendo el código:**
- **Contador con valores negativos**: probando la calculadora en su extremo inferior (citas perdidas = 0) con flechas de teclado rápidas, el resultado mostró "$-64" por una fracción de segundo. Causa: el spring de `LiveNumber` (`damping: 24`, por debajo del amortiguamiento crítico para ese `stiffness`) rebotaba levemente por debajo del objetivo al bajar rápido. Fix: `damping` subido a 30 (sobreamortiguado a propósito) + `Math.max(min, ...)` como cinturón de seguridad en el propio render, sin depender de que el tuning del spring sea perfecto.
- **Los contadores ignoraban `prefers-reduced-motion`**: ni `AnimatedNumber` ni `LiveNumber` revisaban la preferencia — con reduced-motion activo seguían corriendo el spring (solo que Playwright lo capturaba a mitad de camino, mostrando cifras a medio contar). Se agregó el chequeo a ambos: `AnimatedNumber` muestra el valor final directo, `LiveNumber` usa `motionValue.jump()` (API de Framer Motion que salta sin interpolar) para reflejar cada cambio del slider al instante, sin animación, pero sin dejar de responder en vivo — la funcionalidad no es "no esencial", solo el suavizado lo es.

**Cómo se probó (Parte 5, en orden):**
1. **Compila sin warnings**: `npm run build` limpio en cada punto de control (antes y después de los dos bugs encontrados).
2. **6 viewports** (375/390/768/1024/1440/1920) con Playwright, scroll real (no `scrollTo` directo) para disparar los `whileInView` de toda la página: sin scroll horizontal en ninguno, sin errores de consola.
3. **Cero scroll horizontal**: confirmado explícitamente vía `scrollWidth > clientWidth` en los 6 viewports, antes y después del fix de la tabla.
4. **Calculadora en extremos**: 0 citas perdidas → se asienta en `$0` (antes del fix, `$-64`/`$-771` transitorio); máximo (15 citas, precio tope) → `$646.973`/`$7.763.673`/"130 veces el plan Solo", sin desbordar el layout ni `NaN`.
5. **Marquee**: verificado visualmente que las dos filas se mueven en direcciones opuestas y a velocidades distintas; con `prefers-reduced-motion` se confirmó (captura) que pasa a grilla estática de 6 columnas en vez de solo congelar la animación a medio recorrido. No se pudo medir fuga de memoria en una sesión larga real (limitación del entorno de prueba) — es una animación CSS pura sobre `transform`, sin JS por frame, que es el patrón de menor riesgo de leak posible para esto.
6. **FAQ por teclado**: `Tab` hasta la pregunta 3, foco visible confirmado (captura, anillo laton), `Enter` alterna `aria-expanded` de `false` a `true` (confirmado leyendo el atributo real del DOM, no solo visualmente).
7. **Contraste AA**: calculado matemáticamente (fórmula de luminancia relativa WCAG) para cada combinación texto/fondo usada, no estimado a ojo — ver punto 4 arriba.
8. **Página completa con `prefers-reduced-motion: reduce`**: capturada de punta a punta — todo el contenido visible y legible de inmediato, sin elementos atascados en `opacity:0` esperando una animación que nunca dispara.
9. **Rendimiento**: no se instrumentó FPS real (requeriría un dispositivo de gama media físico, no disponible en este entorno) — por diseño, todas las animaciones nuevas animan solo `transform`/`opacity`/`height` (esta última solo en el acordeón del FAQ, medido por Framer Motion, no por JS a mano), el marquee es CSS puro, y el 3D del Hero sigue con su mismo presupuesto de antes (no se le agregó nada). Es una expectativa razonada, no medida.
10. **Recarga en distintos puntos del scroll**: confirmado en las capturas de los 6 viewports (cada una recorre toda la página con scroll incremental) que ninguna sección queda invisible — todas las animaciones de entrada tienen su contenido base ya presente en el DOM antes de animar.

**Por qué:**
- `table-fixed` en vez de reescribir el grid: la causa real era CSS de tablas, no de grid — cambiar el grid habría sido tratar el síntoma equivocado.
- Placeholders ilustrados en vez de fotos de stock en el marquee: el prompt fue explícito en que fotos de stock de barberos se detectan al instante y cuestan credibilidad; no tener material real todavía no es excusa para simular que sí existe.
- `/demo` reusando el código real de producción en vez de una vista de demo aparte: es la única forma de que "probar de verdad" sea literalmente cierto — cualquier vista de demo separada sería, por definición, una simulación de la simulación.
- Verificar contraste con la fórmula real en vez de "se ve bien": el cobre sobre hueso parece perfectamente legible a simple vista (4.28:1 no es un contraste dramáticamente malo) — es exactamente el tipo de falla que un ojo no entrenado no detecta pero una auditoría real sí.

**Archivos afectados:**
- Nuevos: `src/pages/Home/components/{LiveDemo,Marquee,CalculadoraCitasPerdidas,PanelPreview,NotebookVsApp,FounderSpots,FAQ}.jsx`, `src/components/common/{PhoneMockup}.jsx`, `src/components/animations/LiveNumber.jsx`, `src/pages/demo/RutaDemo.jsx`, `src/config/{demo,fundadores,oficio}.js`.
- Modificados: `src/pages/Home/{Home,components/Pricing}.jsx`, `src/components/common/{Button,SectionRule}.jsx`, `src/components/layout/{Header,Footer}.jsx`, `src/components/animations/{ScrollReveal,StaggerReveal,TextReveal,AnimatedNumber,easing}.js`, `src/pages/barberias/hooks/{useHorariosDisponibles,useReservasDelDia,useCrearReserva}.js` (atajo de modo demo), `src/pages/barberias/{PaginaBarberia,components/{AsistenteReserva,PasoServicio}}.jsx` (contraste), `src/routes/AppRouter.jsx` (ruta `/demo`), `src/index.css` (tokens de color, marquee, slider), `.env`/`.env.example` (`VITE_WHATSAPP_CONTACTO`).

**Pendiente / próximos pasos:**
1. Contraste AA del color de marca por barbería (`personalizacion.color_primario`) no está resuelto de forma general — solo el cobre por defecto del sistema tiene sus variantes seguras. Si una barbería elige un color muy claro u oscuro, revisar manualmente o construir un cálculo de contraste en tiempo de ejecución.
2. No se instrumentó FPS real ni se probó fuga de memoria del marquee en una sesión larga — ambos requieren un dispositivo/perfilado real, no disponible en este entorno.
3. Sigue pendiente (de sesiones anteriores) validar todo el proyecto contra el Supabase real de Enzo — home, barbería pública, login, los tres paneles y ahora `/demo` — una vez tenga credenciales reales y haya ejecutado el SQL de login/cambio de estado.
4. Reemplazar el email de contacto placeholder de la landing (`hola@bookingbarber.cl`), pendiente desde hace varias sesiones.
5. El marquee del oficio usa ilustraciones propias como placeholder — reemplazar por fotografía real de barberías clientes (sin rostros) en cuanto exista, vía `config/oficio.js` (agregar `imagenUrl` a cada item).

---

## 2026-08-06 - Corregido: el mockup de celular de la demo recortaba contenido en algunas resoluciones

**Qué se hizo:**
Enzo reportó que la pantalla "Ingresa sus datos" del celular de la demo en vivo, en algunas resoluciones, quedaba tapada por el borde del propio teléfono. Causa real: `PhoneMockup.jsx` tenía un alto **fijo adivinado** (`h-[28rem]` mobile / `md:h-[31rem]` desktop) para la pantalla interior, pero las 5 pantallas del flujo (`PantallaServicio`, `PantallaBarbero`, `PantallaHorario`, `PantallaDatos`, `PantallaConfirmado`) tienen alturas de contenido distintas — cualquiera más alta que ese número adivinado quedaba recortada por el `overflow-hidden` que mantiene la forma redondeada del teléfono, y visualmente se leía como "el borde la tapa".

**Fix, sin adivinar otro número:** se sacó el alto fijo de `PhoneMockup` (queda con `min-h` solo como piso para que no se vea achatado con contenido corto) y en `LiveDemo.jsx` las 5 pantallas pasaron de "una sola montada a la vez con `AnimatePresence`" a **las 5 montadas siempre**, apiladas en la misma celda de un grid CSS (`[grid-area:1/1]` en las cinco, contenedor `grid`) — un contenedor de grid mide su fila según el hijo más alto entre todos los que ocupan esa celda, así que el ancho/alto del teléfono queda determinado automáticamente por la pantalla más alta de las 5, sin ningún número mágico que se pueda desincronizar si el contenido cambia a futuro (ej. un nombre de cliente más largo, una traducción, un ajuste de `font-size` del usuario). El paso activo se anima con `opacity`/`x`, los inactivos quedan en `opacity:0` con `pointer-events:none` y `aria-hidden`.

**Cómo se verificó:**
Se probaron los 5 pasos en 10 anchos de viewport (320, 360, 375, 390, 414, 428, 768, 1024, 1440, 1920px) con Playwright, recortando la captura exactamente al marco del teléfono (`boundingBox()` del contenedor real, no una suposición de coordenadas) — en los 50 casos el contenido queda contenido con margen dentro del marco, incluida la pantalla "Tus datos" que fue la reportada. Se revisó además que el teléfono ya no cambia de alto entre pasos durante el ciclo automático (antes tampoco cambiaba porque el alto era fijo; ahora no cambia porque las 5 pantallas están montadas desde el primer render y el máximo ya está fijado). `npm run build` limpio y los 6 viewports estándar (375/390/768/1024/1440/1920) repetidos sin scroll horizontal ni errores de consola.

**Por qué:**
- Se evitó la solución obvia de "agrandar el número fijo un poco" porque es la misma clase de arreglo frágil que causó el bug — cualquier pantalla futura más alta que el nuevo número volvería a fallar igual. El apilado en grid resuelve la causa (adivinar un tamaño) en vez del síntoma (ese tamaño era chico).
- Mantener las 5 pantallas siempre montadas (en vez de montar/desmontar con `AnimatePresence`) es lo que hace posible que el grid mida las 5 a la vez — es un cambio de arquitectura chico pero necesario para que la técnica funcione, no una elección estética.

**Archivos afectados:**
- `src/components/common/PhoneMockup.jsx` (alto fijo → `min-h` de piso solamente).
- `src/pages/Home/components/LiveDemo.jsx` (las 5 pantallas montadas simultáneamente en `[grid-area:1/1]` en vez de `AnimatePresence` de una sola; `PantallaConfirmado` ajustada de `h-full` a padding propio, ya que dependía del alto fijo que se quitó).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Corregido: las etiquetas en versalitas se veían pixeladas (small-caps sintético, no un problema de DPR ni del 3D)

**Qué se hizo:**
Enzo reportó letras pixeladas "en algunas partes" en varias pantallas, desde 1920x1080 hasta un iPhone XR. Se descartaron dos hipótesis antes de dar con la causa real:
1. **Densidad de píxeles del Canvas 3D** — descartado explícitamente por Enzo ("el modelo 3D no lo toques, todo eso está bien").
2. **Transform residual de Framer Motion tras animar** (una teoría razonable: texto en su propia capa compuesta puede perder el antialiasing de subpíxel) — se verificó con Playwright leyendo `getComputedStyle(el).transform` sobre titulares ya animados (`Hero` y una sección con `ScrollReveal`) y en ambos casos el resultado fue `"none"` — Framer Motion sí limpia el transform al asentarse. Hipótesis descartada con evidencia, no solo por suposición.

**Causa real, confirmada con una comparación directa:** la clase `.versalitas` (usada en absolutamente todas las etiquetas del sitio — el eyebrow del hero, cada `SectionRule`, el nav, los links del footer, los badges de plan, etc.) usaba `font-variant-caps: small-caps`. Archivo (la fuente del sitio) no trae mayúsculas pequeñas reales (glifo OpenType `smcp`), así que el navegador las **sintetiza**, escalando hacia abajo el glifo de la mayúscula normal — a los 12-14px que usan esas etiquetas, ese glifo reescalado se ve notoriamente más tosco que el resto del texto del sitio. Se armó una comparación directa (mismo texto, mismo tamaño, con y sin `small-caps` sintético, mismo `deviceScaleFactor`) y la diferencia es evidente a simple vista: el small-caps sintético sale más delgado y con bordes menos definidos.

**Fix:** `.versalitas` pasó de `font-variant-caps: small-caps` a `text-transform: uppercase` con `letter-spacing` más ancho (0.03em → 0.07em) y `font-weight: 600` — mayúsculas reales nunca se reescalan, son el mismo glifo que cualquier otro texto del sitio, así que no hay reescalado que pueda verse tosco a ningún tamaño ni densidad de píxeles.

**Cómo se probó:**
Batería completa en 8 combinaciones de viewport/DPR, desde 1920×1080 (sin escalado, el peor caso realista para nitidez de texto) y con escalado de Windows típico (125%), pasando por laptops (1440×900, 1366×768) y tablets, hasta **iPhone XR (414×896 @ DPR 2)** e iPhone SE (375×667 @ DPR 2) — en las 8: sin scroll horizontal, sin errores de consola, y se verificó explícitamente que ninguna etiqueta `.versalitas` quedara cortada o desbordada por el cambio a mayúsculas reales (ocupan más ancho que el small-caps sintético). Comparación visual de la home completa a 1920×1080 sin escalado (el escenario donde más se notaba el problema) confirma que todas las etiquetas — eyebrow del hero, cada índice de sección, badges — ahora se ven nítidas.

**Por qué:**
- Se descartaron las dos hipótesis previas con evidencia (lectura real de `getComputedStyle`, confirmación explícita de Enzo sobre el 3D) antes de asumir la causa siguiente — evita "arreglar" algo que no estaba roto.
- Mayúsculas reales + tracking en vez de volver a un `text-transform: uppercase` con `tracking-widest` "genérico de SaaS" (lo que se quería evitar desde el principio del rediseño editorial): se compensó con un tracking más generoso (0.07em) y peso semibold para que la etiqueta siga leyéndose como un recurso tipográfico deliberado, no como el patrón por defecto de cualquier landing.

**Archivos afectados:**
- `src/index.css` (clase `.versalitas`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - El contenido de la demo quedaba pegado arriba del teléfono — centrado vertical real

**Qué se hizo:**
Con el piso de alto restaurado (entrada anterior), el teléfono volvió a verse bien proporcionado, pero el contenido de cada pantalla (que nunca llega a ocupar todo ese alto) quedaba pegado arriba, con todo el espacio libre acumulado abajo — Enzo lo notó de inmediato.

Causa: la técnica de apilar las 5 pantallas en `[grid-area:1/1]` mide correctamente el alto de la más alta, pero ese bloque (ya medido) no se estiraba para ocupar el resto del alto del teléfono — un `h-full` que se había puesto para eso **no funciona** ahí, porque el div de la pantalla del teléfono (`PhoneMockup`) solo tiene `min-height`, no un alto explícito, y un hijo con `height:100%` no se estira contra un padre cuyo alto viene únicamente de `min-height` (comportamiento estándar de CSS, no un bug del navegador) — por eso el `h-full` quedaba sin efecto y el bloque de contenido se quedaba con su alto natural, arriba del todo.

**Fix:** se cambió el mecanismo de "estirar" de porcentaje a flexbox, que sí reparte el espacio libre correctamente contra un `min-height`: `PhoneMockup.jsx` ahora es `flex flex-col` en vez de bloque simple, y el contenedor de las 5 pantallas en `LiveDemo.jsx` pasó de `h-full` a `flex-1` (además de `content-center` para centrar ese bloque dentro del espacio extra, y `flex flex-col justify-center` en cada pantalla individual para que las más cortas —como "Elige un barbero"— se centren también dentro de la fila compartida con las más altas).

**Cómo se verificó:**
Capturas de las 5 pantallas recortadas al marco real del teléfono (1440px): las dos más cortas (Servicio, Barbero) y la más alta (Datos) quedan todas centradas verticalmente con márgenes equilibrados arriba y abajo, ya no pegadas arriba. Se repitió la batería de 6 viewports (375/390/768/1024/1440/1920): sin scroll horizontal ni errores de consola. `npm run build` limpio.

**Por qué:**
- Flexbox en vez de insistir con porcentajes: es la herramienta correcta para "reparte el espacio libre de un contenedor cuyo alto viene de `min-height`" — intentar forzarlo con `height: 100%` es exactamente el tipo de suposición de CSS que parece que debería funcionar pero no lo hace, y quedarse con esa suposición sin verificar habría dejado el mismo bug con otro nombre.

**Archivos afectados:**
- `src/components/common/PhoneMockup.jsx` (el contenedor de pantalla pasó a `flex flex-col`).
- `src/pages/Home/components/LiveDemo.jsx` (`h-full` → `flex-1` + `content-center` en el contenedor de las 5 pantallas; `flex flex-col justify-center` agregado a cada pantalla individual).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Corregido: las etiquetas en versalitas se veían pixeladas (small-caps sintético, no un problema de DPR ni del 3D)

**Qué se hizo:**
Enzo reportó letras pixeladas "en algunas partes" en varias pantallas, desde 1920x1080 hasta un iPhone XR. Se descartaron dos hipótesis antes de dar con la causa real:
1. **Densidad de píxeles del Canvas 3D** — descartado explícitamente por Enzo ("el modelo 3D no lo toques, todo eso está bien").
2. **Transform residual de Framer Motion tras animar** (una teoría razonable: texto en su propia capa compuesta puede perder el antialiasing de subpíxel) — se verificó con Playwright leyendo `getComputedStyle(el).transform` sobre titulares ya animados (`Hero` y una sección con `ScrollReveal`) y en ambos casos el resultado fue `"none"` — Framer Motion sí limpia el transform al asentarse. Hipótesis descartada con evidencia, no solo por suposición.

**Causa real, confirmada con una comparación directa:** la clase `.versalitas` (usada en absolutamente todas las etiquetas del sitio — el eyebrow del hero, cada `SectionRule`, el nav, los links del footer, los badges de plan, etc.) usaba `font-variant-caps: small-caps`. Archivo (la fuente del sitio) no trae mayúsculas pequeñas reales (glifo OpenType `smcp`), así que el navegador las **sintetiza**, escalando hacia abajo el glifo de la mayúscula normal — a los 12-14px que usan esas etiquetas, ese glifo reescalado se ve notoriamente más tosco que el resto del texto del sitio. Se armó una comparación directa (mismo texto, mismo tamaño, con y sin `small-caps` sintético, mismo `deviceScaleFactor`) y la diferencia es evidente a simple vista: el small-caps sintético sale más delgado y con bordes menos definidos.

**Fix:** `.versalitas` pasó de `font-variant-caps: small-caps` a `text-transform: uppercase` con `letter-spacing` más ancho (0.03em → 0.07em) y `font-weight: 600` — mayúsculas reales nunca se reescalan, son el mismo glifo que cualquier otro texto del sitio, así que no hay reescalado que pueda verse tosco a ningún tamaño ni densidad de píxeles.

**Cómo se probó:**
Batería completa en 8 combinaciones de viewport/DPR, desde 1920×1080 (sin escalado, el peor caso realista para nitidez de texto) y con escalado de Windows típico (125%), pasando por laptops (1440×900, 1366×768) y tablets, hasta **iPhone XR (414×896 @ DPR 2)** e iPhone SE (375×667 @ DPR 2) — en las 8: sin scroll horizontal, sin errores de consola, y se verificó explícitamente que ninguna etiqueta `.versalitas` quedara cortada o desbordada por el cambio a mayúsculas reales (ocupan más ancho que el small-caps sintético). Comparación visual de la home completa a 1920×1080 sin escalado (el escenario donde más se notaba el problema) confirma que todas las etiquetas — eyebrow del hero, cada índice de sección, badges — ahora se ven nítidas.

**Por qué:**
- Se descartaron las dos hipótesis previas con evidencia (lectura real de `getComputedStyle`, confirmación explícita de Enzo sobre el 3D) antes de asumir la causa siguiente — evita "arreglar" algo que no estaba roto.
- Mayúsculas reales + tracking en vez de volver a un `text-transform: uppercase` con `tracking-widest` "genérico de SaaS" (lo que se quería evitar desde el principio del rediseño editorial): se compensó con un tracking más generoso (0.07em) y peso semibold para que la etiqueta siga leyéndose como un recurso tipográfico deliberado, no como el patrón por defecto de cualquier landing.

**Archivos afectados:**
- `src/index.css` (clase `.versalitas`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Ajuste fino: el piso de alto del celular quedó muy bajo y se veía achatado

**Qué se hizo:**
Al arreglar el recorte del mockup (entrada anterior), el `min-h` que se dejó como piso (22rem) resultó más bajo de lo pensado: el contenido real de las 5 pantallas (~180-236px) queda muy por debajo de ese piso, así que el piso terminaba siendo la altura real casi siempre — y 22rem de alto contra el ancho fijo del teléfono (16rem/18rem) da una proporción ancho:alto de ~0.8, que ya no se lee como celular sino como algo más achatado. Enzo lo notó de inmediato en la pantalla "Elige un barbero" (la de contenido más corto, donde más se notaba).

**Fix:** se subió el piso a `min-h-[28rem]` mobile / `md:min-h-[31rem]` desktop — los mismos valores que tenía el alto fijo original antes de todo este ajuste, pero ahora como **piso**, no como techo. Sigue cumpliendo el objetivo de la corrección anterior (si algún día una pantalla necesita más espacio, crece en vez de recortarse) y además recupera la proporción de celular real.

**Cómo se verificó:**
Con Playwright se midió el `boundingBox()` real del teléfono en la pantalla más corta ("Elige un barbero") en dos anchos: 375px → 256×476 (proporción 0.54) y 1440px → 288×524 (0.55) — muy cerca de la proporción original (~0.58) y de una silueta de celular real. Se volvió a confirmar visualmente que la pantalla "Tus datos" (la más alta de las 5) sigue con margen de sobra dentro del piso más alto, sin recortarse.

**Por qué:**
- No se volvió a un alto fijo (techo): el objetivo de la corrección anterior — que ninguna pantalla futura más alta que el número elegido quede tapada — se mantiene intacto. Solo se corrigió qué número usar como piso, con el mismo criterio de "que se vea como celular" que ya había validado Enzo antes.

**Archivos afectados:**
- `src/components/common/PhoneMockup.jsx` (`min-h-[22rem]` → `min-h-[28rem] md:min-h-[31rem]`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Corregido: las etiquetas en versalitas se veían pixeladas (small-caps sintético, no un problema de DPR ni del 3D)

**Qué se hizo:**
Enzo reportó letras pixeladas "en algunas partes" en varias pantallas, desde 1920x1080 hasta un iPhone XR. Se descartaron dos hipótesis antes de dar con la causa real:
1. **Densidad de píxeles del Canvas 3D** — descartado explícitamente por Enzo ("el modelo 3D no lo toques, todo eso está bien").
2. **Transform residual de Framer Motion tras animar** (una teoría razonable: texto en su propia capa compuesta puede perder el antialiasing de subpíxel) — se verificó con Playwright leyendo `getComputedStyle(el).transform` sobre titulares ya animados (`Hero` y una sección con `ScrollReveal`) y en ambos casos el resultado fue `"none"` — Framer Motion sí limpia el transform al asentarse. Hipótesis descartada con evidencia, no solo por suposición.

**Causa real, confirmada con una comparación directa:** la clase `.versalitas` (usada en absolutamente todas las etiquetas del sitio — el eyebrow del hero, cada `SectionRule`, el nav, los links del footer, los badges de plan, etc.) usaba `font-variant-caps: small-caps`. Archivo (la fuente del sitio) no trae mayúsculas pequeñas reales (glifo OpenType `smcp`), así que el navegador las **sintetiza**, escalando hacia abajo el glifo de la mayúscula normal — a los 12-14px que usan esas etiquetas, ese glifo reescalado se ve notoriamente más tosco que el resto del texto del sitio. Se armó una comparación directa (mismo texto, mismo tamaño, con y sin `small-caps` sintético, mismo `deviceScaleFactor`) y la diferencia es evidente a simple vista: el small-caps sintético sale más delgado y con bordes menos definidos.

**Fix:** `.versalitas` pasó de `font-variant-caps: small-caps` a `text-transform: uppercase` con `letter-spacing` más ancho (0.03em → 0.07em) y `font-weight: 600` — mayúsculas reales nunca se reescalan, son el mismo glifo que cualquier otro texto del sitio, así que no hay reescalado que pueda verse tosco a ningún tamaño ni densidad de píxeles.

**Cómo se probó:**
Batería completa en 8 combinaciones de viewport/DPR, desde 1920×1080 (sin escalado, el peor caso realista para nitidez de texto) y con escalado de Windows típico (125%), pasando por laptops (1440×900, 1366×768) y tablets, hasta **iPhone XR (414×896 @ DPR 2)** e iPhone SE (375×667 @ DPR 2) — en las 8: sin scroll horizontal, sin errores de consola, y se verificó explícitamente que ninguna etiqueta `.versalitas` quedara cortada o desbordada por el cambio a mayúsculas reales (ocupan más ancho que el small-caps sintético). Comparación visual de la home completa a 1920×1080 sin escalado (el escenario donde más se notaba el problema) confirma que todas las etiquetas — eyebrow del hero, cada índice de sección, badges — ahora se ven nítidas.

**Por qué:**
- Se descartaron las dos hipótesis previas con evidencia (lectura real de `getComputedStyle`, confirmación explícita de Enzo sobre el 3D) antes de asumir la causa siguiente — evita "arreglar" algo que no estaba roto.
- Mayúsculas reales + tracking en vez de volver a un `text-transform: uppercase` con `tracking-widest` "genérico de SaaS" (lo que se quería evitar desde el principio del rediseño editorial): se compensó con un tracking más generoso (0.07em) y peso semibold para que la etiqueta siga leyéndose como un recurso tipográfico deliberado, no como el patrón por defecto de cualquier landing.

**Archivos afectados:**
- `src/index.css` (clase `.versalitas`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - El contenido de la demo quedaba pegado arriba del teléfono — centrado vertical real

**Qué se hizo:**
Con el piso de alto restaurado (entrada anterior), el teléfono volvió a verse bien proporcionado, pero el contenido de cada pantalla (que nunca llega a ocupar todo ese alto) quedaba pegado arriba, con todo el espacio libre acumulado abajo — Enzo lo notó de inmediato.

Causa: la técnica de apilar las 5 pantallas en `[grid-area:1/1]` mide correctamente el alto de la más alta, pero ese bloque (ya medido) no se estiraba para ocupar el resto del alto del teléfono — un `h-full` que se había puesto para eso **no funciona** ahí, porque el div de la pantalla del teléfono (`PhoneMockup`) solo tiene `min-height`, no un alto explícito, y un hijo con `height:100%` no se estira contra un padre cuyo alto viene únicamente de `min-height` (comportamiento estándar de CSS, no un bug del navegador) — por eso el `h-full` quedaba sin efecto y el bloque de contenido se quedaba con su alto natural, arriba del todo.

**Fix:** se cambió el mecanismo de "estirar" de porcentaje a flexbox, que sí reparte el espacio libre correctamente contra un `min-height`: `PhoneMockup.jsx` ahora es `flex flex-col` en vez de bloque simple, y el contenedor de las 5 pantallas en `LiveDemo.jsx` pasó de `h-full` a `flex-1` (además de `content-center` para centrar ese bloque dentro del espacio extra, y `flex flex-col justify-center` en cada pantalla individual para que las más cortas —como "Elige un barbero"— se centren también dentro de la fila compartida con las más altas).

**Cómo se verificó:**
Capturas de las 5 pantallas recortadas al marco real del teléfono (1440px): las dos más cortas (Servicio, Barbero) y la más alta (Datos) quedan todas centradas verticalmente con márgenes equilibrados arriba y abajo, ya no pegadas arriba. Se repitió la batería de 6 viewports (375/390/768/1024/1440/1920): sin scroll horizontal ni errores de consola. `npm run build` limpio.

**Por qué:**
- Flexbox en vez de insistir con porcentajes: es la herramienta correcta para "reparte el espacio libre de un contenedor cuyo alto viene de `min-height`" — intentar forzarlo con `height: 100%` es exactamente el tipo de suposición de CSS que parece que debería funcionar pero no lo hace, y quedarse con esa suposición sin verificar habría dejado el mismo bug con otro nombre.

**Archivos afectados:**
- `src/components/common/PhoneMockup.jsx` (el contenedor de pantalla pasó a `flex flex-col`).
- `src/pages/Home/components/LiveDemo.jsx` (`h-full` → `flex-1` + `content-center` en el contenedor de las 5 pantallas; `flex flex-col justify-center` agregado a cada pantalla individual).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---

## 2026-08-06 - Corregido: las etiquetas en versalitas se veían pixeladas (small-caps sintético, no un problema de DPR ni del 3D)

**Qué se hizo:**
Enzo reportó letras pixeladas "en algunas partes" en varias pantallas, desde 1920x1080 hasta un iPhone XR. Se descartaron dos hipótesis antes de dar con la causa real:
1. **Densidad de píxeles del Canvas 3D** — descartado explícitamente por Enzo ("el modelo 3D no lo toques, todo eso está bien").
2. **Transform residual de Framer Motion tras animar** (una teoría razonable: texto en su propia capa compuesta puede perder el antialiasing de subpíxel) — se verificó con Playwright leyendo `getComputedStyle(el).transform` sobre titulares ya animados (`Hero` y una sección con `ScrollReveal`) y en ambos casos el resultado fue `"none"` — Framer Motion sí limpia el transform al asentarse. Hipótesis descartada con evidencia, no solo por suposición.

**Causa real, confirmada con una comparación directa:** la clase `.versalitas` (usada en absolutamente todas las etiquetas del sitio — el eyebrow del hero, cada `SectionRule`, el nav, los links del footer, los badges de plan, etc.) usaba `font-variant-caps: small-caps`. Archivo (la fuente del sitio) no trae mayúsculas pequeñas reales (glifo OpenType `smcp`), así que el navegador las **sintetiza**, escalando hacia abajo el glifo de la mayúscula normal — a los 12-14px que usan esas etiquetas, ese glifo reescalado se ve notoriamente más tosco que el resto del texto del sitio. Se armó una comparación directa (mismo texto, mismo tamaño, con y sin `small-caps` sintético, mismo `deviceScaleFactor`) y la diferencia es evidente a simple vista: el small-caps sintético sale más delgado y con bordes menos definidos.

**Fix:** `.versalitas` pasó de `font-variant-caps: small-caps` a `text-transform: uppercase` con `letter-spacing` más ancho (0.03em → 0.07em) y `font-weight: 600` — mayúsculas reales nunca se reescalan, son el mismo glifo que cualquier otro texto del sitio, así que no hay reescalado que pueda verse tosco a ningún tamaño ni densidad de píxeles.

**Cómo se probó:**
Batería completa en 8 combinaciones de viewport/DPR, desde 1920×1080 (sin escalado, el peor caso realista para nitidez de texto) y con escalado de Windows típico (125%), pasando por laptops (1440×900, 1366×768) y tablets, hasta **iPhone XR (414×896 @ DPR 2)** e iPhone SE (375×667 @ DPR 2) — en las 8: sin scroll horizontal, sin errores de consola, y se verificó explícitamente que ninguna etiqueta `.versalitas` quedara cortada o desbordada por el cambio a mayúsculas reales (ocupan más ancho que el small-caps sintético). Comparación visual de la home completa a 1920×1080 sin escalado (el escenario donde más se notaba el problema) confirma que todas las etiquetas — eyebrow del hero, cada índice de sección, badges — ahora se ven nítidas.

**Por qué:**
- Se descartaron las dos hipótesis previas con evidencia (lectura real de `getComputedStyle`, confirmación explícita de Enzo sobre el 3D) antes de asumir la causa siguiente — evita "arreglar" algo que no estaba roto.
- Mayúsculas reales + tracking en vez de volver a un `text-transform: uppercase` con `tracking-widest` "genérico de SaaS" (lo que se quería evitar desde el principio del rediseño editorial): se compensó con un tracking más generoso (0.07em) y peso semibold para que la etiqueta siga leyéndose como un recurso tipográfico deliberado, no como el patrón por defecto de cualquier landing.

**Archivos afectados:**
- `src/index.css` (clase `.versalitas`).

**Pendiente / próximos pasos:**
- Sin cambios respecto a la entrada anterior.

---
