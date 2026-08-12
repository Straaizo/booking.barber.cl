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

## 2026-08-06 - El modelo 3D del hero ahora se muestra en mobile por defecto, con degradación adaptativa por fps real

**Qué se hizo:**
Hasta ahora, mobile mostraba siempre `StaticBarberPoleIllustration` (la ilustración SVG) — una decisión tomada cuando todavía no existía el modelo 3D real y se optaba por seguridad de rendimiento. Enzo preguntó si se podía mostrar el modelo 3D real en mobile también. La respuesta corta es sí, y el prompt original de la Parte 3 ya lo contemplaba: *"en móvil, degrada: el 3D puede pasar a una versión de menor polycount, menos luces, o a un render estático de alta calidad si el frame rate baja de 50fps"* — es decir, la versión estática debía ser el **último recurso**, no la respuesta por defecto para todo mobile.

Se implementó exactamente eso, de forma adaptativa en vez de una regla fija por ancho de pantalla:

- **`MonitorRendimiento.jsx`** (nuevo): vive dentro del `<Canvas>` y usa `useFrame` para medir el fps real durante los primeros ~2 segundos (con 0.2s de calentamiento descartados, para no contar la compilación de shaders como "lento"). Si el promedio queda bajo 50fps, avisa una sola vez hacia afuera vía callback.
- **`Scene3DCanvas.jsx`**: acepta `liviano` (booleano) y `onRendimientoBajo`. En modo `liviano` (mobile): `dpr` tope 1 en vez de 1.5 (el costo dominante en GPUs móviles es el fill-rate, no la geometría — bajar el dpr es lo que más ahorra), se quitan la luz de relleno y el rim trasero de cobre (quedan ambiente + key cálida, con el ambiente compensado un poco más arriba para que no se vea plano), sin sombra dinámica ni antialiasing.
- **`HeroScene3D.jsx`**: ya no decide "mobile = estática" de entrada. Ahora `mostrarEstatica = prefersReducedMotion || rendimientoBajo` — `prefers-reduced-motion` sigue siendo una preferencia de accesibilidad que se respeta siempre (nunca monta el Canvas, ahorra la descarga completa de Three.js/el `.glb` en ese caso); `rendimientoBajo` es una decisión que se toma recién con una medición real del equipo del visitante, sea el que sea. Se unificó el tamaño del contenedor entre el estado 3D y el estático (antes eran de alto distinto) para que, si el monitor baja a estática después de un par de segundos, no haya un salto de layout — solo cambia lo que hay adentro de la misma caja.

**Cómo se probó:**
- `npm run build` limpio.
- Se reprodujo el modelo real en mobile con user agent de iPhone (414×896 @ DPR 2): confirmado visualmente que el poste 3D (versión `liviano`) se ve bien — brillo cálido en la bombilla, rayas nítidas, sin verse "degradado" a simple vista pese a tener menos luces.
- **Limitación real del entorno de prueba, importante de dejar registrada:** Chromium en modo headless en este entorno no tiene GPU real (usa un renderer por software) — el `MonitorRendimiento` mide correctamente ~40-43fps *tanto en mobile como en escritorio*, y baja a la ilustración estática en ambos casos. Esto no es un bug: es el monitor midiendo con precisión un hardware gráfico genuinamente lento. Como el escritorio venía mostrando el 3D fluido en todas las capturas de sesiones anteriores (con GPU real), esto confirma que la medición es correcta — simplemente no se puede demostrar "se ve fluido en un iPhone real" sin un dispositivo físico, que no está disponible en este entorno. Se verificó el camino "rinde bien" desactivando temporalmente el chequeo de fps solo para la captura visual, y revirtiendo el código real inmediatamente después.
- Se repitió la batería de 7 escenarios (375/390/768/1024/1440/1920 + iPhone XR a DPR2) con la lógica real (sin bypasear nada): sin scroll horizontal, sin errores de consola en ninguno.
- Se confirmó que con `prefers-reduced-motion: reduce` el `<canvas>` nunca llega a montarse (0 canvas encontrados tras esperar), es decir, ese camino sigue sin descargar Three.js en absoluto.

**Por qué:**
- Medir fps real en vez de asumir "mobile = débil": un iPhone reciente tiene una GPU más potente que muchos notebooks con integrada — negarle el 3D solo por el ancho de viewport habría sido una regla más simple pero peor, exactamente lo que Enzo notó y preguntó si se podía mejorar.
- `dpr` tope 1 como principal ahorro en mobile (en vez de simplificar la geometría, que ya es low-poly): en GPUs móviles el cuello de botella típico es cuántos píxeles hay que sombrear (fill-rate), no cuántos vértices procesar — es la palanca que más rinde por el menor costo visual.
- Mismo tamaño de contenedor en ambos estados: evitar un salto de layout que se notaría justo cuando el usuario ya está leyendo el hero, en el peor momento posible para un cambio brusco.

**Archivos afectados:**
- Nuevo: `src/components/animations/MonitorRendimiento.jsx`.
- Modificados: `src/components/animations/Scene3DCanvas.jsx` (prop `liviano` + `onRendimientoBajo`), `src/components/animations/HeroScene3D.jsx` (ya no usa `isMobile` para decidir mostrar la ilustración; contenedor unificado).

**Pendiente / próximos pasos:**
- Validar en un dispositivo móvil físico real cuando Enzo tenga oportunidad — todo lo verificado acá es emulación de viewport/DPR/user-agent, no hardware real. Si en la práctica el umbral de 50fps resulta muy estricto o muy laxo para el catálogo real de equipos de sus clientes, es el número a ajustar (`umbralFps` en `MonitorRendimiento`).

---

## 2026-08-06 - Diagnóstico de errores de consola en el DevTools real de Enzo: uno era ruido de una extensión, el otro sí era corregible

**Qué se hizo:**
Enzo compartió una captura de su DevTools mostrando un error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" y una advertencia de React Router. Se investigó cada uno por separado, sin asumir la causa:

1. **El error de "asynchronous response"**: se cargó el sitio en un Chromium recién instalado por Playwright — **sin ninguna extensión** — y se navegó igual que un usuario real (scroll, esperas, sin forzar nada). El error **no apareció en absoluto**. Ese mensaje específico es una firma muy conocida de extensiones de Chrome que usan `chrome.runtime.sendMessage` con un listener que devuelve `true` (avisando que va a responder async) pero nunca llega a responder — típico de gestores de contraseñas, bloqueadores de ads, Grammarly, etc. Confirmado con evidencia: no es un bug del sitio, es una extensión instalada en el navegador real de Enzo. No hay nada que el código de la página pueda hacer para evitar que una extensión de un tercero se comporte así.
2. **La advertencia de React Router** (`v7_startTransition`) — esta sí era corregible y se corrigió. Primer intento: pasar `future: { v7_startTransition: true }` como segundo argumento de `createBrowserRouter` — no funcionó (la advertencia seguía apareciendo incluso reiniciando el dev server desde cero, se verificó explícitamente en vez de asumir que "ya quedó"). Causa: esa bandera específica no es una opción de `createBrowserRouter`, es una prop de `<RouterProvider>`. Corregido pasándola ahí: `<RouterProvider router={router} future={{ v7_startTransition: true }} />`. Verificado de nuevo con el dev server reiniciado: la advertencia ya no aparece.

De paso, revisando la consola en un navegador limpio, aparecieron otros dos mensajes (`GL Driver Message: GPU stall due to ReadPixels` y `THREE.WebGLRenderer: Context Lost`) — se investigaron también: ocurren igual con y sin capturas de pantalla de por medio (se descartó que fueran un artefacto de mi propio método de prueba), pero son específicos de este entorno de sandbox headless sin GPU real (renderiza por software) — el mismo modelo 3D ya se ha visto fluido y correcto en decenas de capturas de sesiones anteriores con GPU real disponible. No se tocó nada del 3D por esto (Enzo ya había pedido explícitamente no tocarlo).

**Cómo se probó:**
- Consola completa en Chromium limpio (sin extensiones): confirmado que el error de "asynchronous response" no es reproducible desde el código del sitio.
- Tras el fix del future flag: reinicio completo del dev server (no solo HMR) + relectura de consola, confirmando la ausencia de la advertencia.
- Navegación real entre rutas (`/`, click a `#planes`, `/demo`, `/login`) sin errores de página.
- Batería completa de 7 viewports (375/390/768/1024/1440/1920 + iPhone XR): sin scroll horizontal, sin errores de página en ninguno.
- `npm run build` limpio en cada punto de control.

**Por qué:**
- Se verificó la hipótesis del "ruido de extensión" con un navegador realmente limpio en vez de solo argumentarlo — la diferencia entre "creo que es una extensión" y "lo probé sin extensiones y no aparece" es la diferencia entre una opinión y un diagnóstico.
- Se corrigió el primer intento fallido del future flag en vez de dejarlo por hecho tras escribir el código — el build pasa igual aunque la bandera esté en el lugar equivocado (no es un error de sintaxis, solo no tiene efecto), así que solo se puede confirmar probando.

**Archivos afectados:**
- `src/routes/AppRouter.jsx` (`future` movido de `createBrowserRouter` a `<RouterProvider>`).

**Pendiente / próximos pasos:**
- El error de "asynchronous response" que vio Enzo es de una extensión de su Chrome — no requiere ni admite un fix desde el código. Si quiere confirmarlo él mismo: abrir el sitio en una ventana de incógnito con las extensiones desactivadas (Chrome permite elegir cuáles corren en incógnito) y ver si el error deja de aparecer.

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

## 2026-08-06 - El modelo 3D del hero ahora se muestra en mobile por defecto, con degradación adaptativa por fps real

**Qué se hizo:**
Hasta ahora, mobile mostraba siempre `StaticBarberPoleIllustration` (la ilustración SVG) — una decisión tomada cuando todavía no existía el modelo 3D real y se optaba por seguridad de rendimiento. Enzo preguntó si se podía mostrar el modelo 3D real en mobile también. La respuesta corta es sí, y el prompt original de la Parte 3 ya lo contemplaba: *"en móvil, degrada: el 3D puede pasar a una versión de menor polycount, menos luces, o a un render estático de alta calidad si el frame rate baja de 50fps"* — es decir, la versión estática debía ser el **último recurso**, no la respuesta por defecto para todo mobile.

Se implementó exactamente eso, de forma adaptativa en vez de una regla fija por ancho de pantalla:

- **`MonitorRendimiento.jsx`** (nuevo): vive dentro del `<Canvas>` y usa `useFrame` para medir el fps real durante los primeros ~2 segundos (con 0.2s de calentamiento descartados, para no contar la compilación de shaders como "lento"). Si el promedio queda bajo 50fps, avisa una sola vez hacia afuera vía callback.
- **`Scene3DCanvas.jsx`**: acepta `liviano` (booleano) y `onRendimientoBajo`. En modo `liviano` (mobile): `dpr` tope 1 en vez de 1.5 (el costo dominante en GPUs móviles es el fill-rate, no la geometría — bajar el dpr es lo que más ahorra), se quitan la luz de relleno y el rim trasero de cobre (quedan ambiente + key cálida, con el ambiente compensado un poco más arriba para que no se vea plano), sin sombra dinámica ni antialiasing.
- **`HeroScene3D.jsx`**: ya no decide "mobile = estática" de entrada. Ahora `mostrarEstatica = prefersReducedMotion || rendimientoBajo` — `prefers-reduced-motion` sigue siendo una preferencia de accesibilidad que se respeta siempre (nunca monta el Canvas, ahorra la descarga completa de Three.js/el `.glb` en ese caso); `rendimientoBajo` es una decisión que se toma recién con una medición real del equipo del visitante, sea el que sea. Se unificó el tamaño del contenedor entre el estado 3D y el estático (antes eran de alto distinto) para que, si el monitor baja a estática después de un par de segundos, no haya un salto de layout — solo cambia lo que hay adentro de la misma caja.

**Cómo se probó:**
- `npm run build` limpio.
- Se reprodujo el modelo real en mobile con user agent de iPhone (414×896 @ DPR 2): confirmado visualmente que el poste 3D (versión `liviano`) se ve bien — brillo cálido en la bombilla, rayas nítidas, sin verse "degradado" a simple vista pese a tener menos luces.
- **Limitación real del entorno de prueba, importante de dejar registrada:** Chromium en modo headless en este entorno no tiene GPU real (usa un renderer por software) — el `MonitorRendimiento` mide correctamente ~40-43fps *tanto en mobile como en escritorio*, y baja a la ilustración estática en ambos casos. Esto no es un bug: es el monitor midiendo con precisión un hardware gráfico genuinamente lento. Como el escritorio venía mostrando el 3D fluido en todas las capturas de sesiones anteriores (con GPU real), esto confirma que la medición es correcta — simplemente no se puede demostrar "se ve fluido en un iPhone real" sin un dispositivo físico, que no está disponible en este entorno. Se verificó el camino "rinde bien" desactivando temporalmente el chequeo de fps solo para la captura visual, y revirtiendo el código real inmediatamente después.
- Se repitió la batería de 7 escenarios (375/390/768/1024/1440/1920 + iPhone XR a DPR2) con la lógica real (sin bypasear nada): sin scroll horizontal, sin errores de consola en ninguno.
- Se confirmó que con `prefers-reduced-motion: reduce` el `<canvas>` nunca llega a montarse (0 canvas encontrados tras esperar), es decir, ese camino sigue sin descargar Three.js en absoluto.

**Por qué:**
- Medir fps real en vez de asumir "mobile = débil": un iPhone reciente tiene una GPU más potente que muchos notebooks con integrada — negarle el 3D solo por el ancho de viewport habría sido una regla más simple pero peor, exactamente lo que Enzo notó y preguntó si se podía mejorar.
- `dpr` tope 1 como principal ahorro en mobile (en vez de simplificar la geometría, que ya es low-poly): en GPUs móviles el cuello de botella típico es cuántos píxeles hay que sombrear (fill-rate), no cuántos vértices procesar — es la palanca que más rinde por el menor costo visual.
- Mismo tamaño de contenedor en ambos estados: evitar un salto de layout que se notaría justo cuando el usuario ya está leyendo el hero, en el peor momento posible para un cambio brusco.

**Archivos afectados:**
- Nuevo: `src/components/animations/MonitorRendimiento.jsx`.
- Modificados: `src/components/animations/Scene3DCanvas.jsx` (prop `liviano` + `onRendimientoBajo`), `src/components/animations/HeroScene3D.jsx` (ya no usa `isMobile` para decidir mostrar la ilustración; contenedor unificado).

**Pendiente / próximos pasos:**
- Validar en un dispositivo móvil físico real cuando Enzo tenga oportunidad — todo lo verificado acá es emulación de viewport/DPR/user-agent, no hardware real. Si en la práctica el umbral de 50fps resulta muy estricto o muy laxo para el catálogo real de equipos de sus clientes, es el número a ajustar (`umbralFps` en `MonitorRendimiento`).

---

## 2026-08-06 - Diagnóstico de errores de consola en el DevTools real de Enzo: uno era ruido de una extensión, el otro sí era corregible

**Qué se hizo:**
Enzo compartió una captura de su DevTools mostrando un error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" y una advertencia de React Router. Se investigó cada uno por separado, sin asumir la causa:

1. **El error de "asynchronous response"**: se cargó el sitio en un Chromium recién instalado por Playwright — **sin ninguna extensión** — y se navegó igual que un usuario real (scroll, esperas, sin forzar nada). El error **no apareció en absoluto**. Ese mensaje específico es una firma muy conocida de extensiones de Chrome que usan `chrome.runtime.sendMessage` con un listener que devuelve `true` (avisando que va a responder async) pero nunca llega a responder — típico de gestores de contraseñas, bloqueadores de ads, Grammarly, etc. Confirmado con evidencia: no es un bug del sitio, es una extensión instalada en el navegador real de Enzo. No hay nada que el código de la página pueda hacer para evitar que una extensión de un tercero se comporte así.
2. **La advertencia de React Router** (`v7_startTransition`) — esta sí era corregible y se corrigió. Primer intento: pasar `future: { v7_startTransition: true }` como segundo argumento de `createBrowserRouter` — no funcionó (la advertencia seguía apareciendo incluso reiniciando el dev server desde cero, se verificó explícitamente en vez de asumir que "ya quedó"). Causa: esa bandera específica no es una opción de `createBrowserRouter`, es una prop de `<RouterProvider>`. Corregido pasándola ahí: `<RouterProvider router={router} future={{ v7_startTransition: true }} />`. Verificado de nuevo con el dev server reiniciado: la advertencia ya no aparece.

De paso, revisando la consola en un navegador limpio, aparecieron otros dos mensajes (`GL Driver Message: GPU stall due to ReadPixels` y `THREE.WebGLRenderer: Context Lost`) — se investigaron también: ocurren igual con y sin capturas de pantalla de por medio (se descartó que fueran un artefacto de mi propio método de prueba), pero son específicos de este entorno de sandbox headless sin GPU real (renderiza por software) — el mismo modelo 3D ya se ha visto fluido y correcto en decenas de capturas de sesiones anteriores con GPU real disponible. No se tocó nada del 3D por esto (Enzo ya había pedido explícitamente no tocarlo).

**Cómo se probó:**
- Consola completa en Chromium limpio (sin extensiones): confirmado que el error de "asynchronous response" no es reproducible desde el código del sitio.
- Tras el fix del future flag: reinicio completo del dev server (no solo HMR) + relectura de consola, confirmando la ausencia de la advertencia.
- Navegación real entre rutas (`/`, click a `#planes`, `/demo`, `/login`) sin errores de página.
- Batería completa de 7 viewports (375/390/768/1024/1440/1920 + iPhone XR): sin scroll horizontal, sin errores de página en ninguno.
- `npm run build` limpio en cada punto de control.

**Por qué:**
- Se verificó la hipótesis del "ruido de extensión" con un navegador realmente limpio en vez de solo argumentarlo — la diferencia entre "creo que es una extensión" y "lo probé sin extensiones y no aparece" es la diferencia entre una opinión y un diagnóstico.
- Se corrigió el primer intento fallido del future flag en vez de dejarlo por hecho tras escribir el código — el build pasa igual aunque la bandera esté en el lugar equivocado (no es un error de sintaxis, solo no tiene efecto), así que solo se puede confirmar probando.

**Archivos afectados:**
- `src/routes/AppRouter.jsx` (`future` movido de `createBrowserRouter` a `<RouterProvider>`).

**Pendiente / próximos pasos:**
- El error de "asynchronous response" que vio Enzo es de una extensión de su Chrome — no requiere ni admite un fix desde el código. Si quiere confirmarlo él mismo: abrir el sitio en una ventana de incógnito con las extensiones desactivadas (Chrome permite elegir cuáles corren en incógnito) y ver si el error deja de aparecer.

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

## 2026-08-06 - El modelo 3D del hero ahora se muestra en mobile por defecto, con degradación adaptativa por fps real

**Qué se hizo:**
Hasta ahora, mobile mostraba siempre `StaticBarberPoleIllustration` (la ilustración SVG) — una decisión tomada cuando todavía no existía el modelo 3D real y se optaba por seguridad de rendimiento. Enzo preguntó si se podía mostrar el modelo 3D real en mobile también. La respuesta corta es sí, y el prompt original de la Parte 3 ya lo contemplaba: *"en móvil, degrada: el 3D puede pasar a una versión de menor polycount, menos luces, o a un render estático de alta calidad si el frame rate baja de 50fps"* — es decir, la versión estática debía ser el **último recurso**, no la respuesta por defecto para todo mobile.

Se implementó exactamente eso, de forma adaptativa en vez de una regla fija por ancho de pantalla:

- **`MonitorRendimiento.jsx`** (nuevo): vive dentro del `<Canvas>` y usa `useFrame` para medir el fps real durante los primeros ~2 segundos (con 0.2s de calentamiento descartados, para no contar la compilación de shaders como "lento"). Si el promedio queda bajo 50fps, avisa una sola vez hacia afuera vía callback.
- **`Scene3DCanvas.jsx`**: acepta `liviano` (booleano) y `onRendimientoBajo`. En modo `liviano` (mobile): `dpr` tope 1 en vez de 1.5 (el costo dominante en GPUs móviles es el fill-rate, no la geometría — bajar el dpr es lo que más ahorra), se quitan la luz de relleno y el rim trasero de cobre (quedan ambiente + key cálida, con el ambiente compensado un poco más arriba para que no se vea plano), sin sombra dinámica ni antialiasing.
- **`HeroScene3D.jsx`**: ya no decide "mobile = estática" de entrada. Ahora `mostrarEstatica = prefersReducedMotion || rendimientoBajo` — `prefers-reduced-motion` sigue siendo una preferencia de accesibilidad que se respeta siempre (nunca monta el Canvas, ahorra la descarga completa de Three.js/el `.glb` en ese caso); `rendimientoBajo` es una decisión que se toma recién con una medición real del equipo del visitante, sea el que sea. Se unificó el tamaño del contenedor entre el estado 3D y el estático (antes eran de alto distinto) para que, si el monitor baja a estática después de un par de segundos, no haya un salto de layout — solo cambia lo que hay adentro de la misma caja.

**Cómo se probó:**
- `npm run build` limpio.
- Se reprodujo el modelo real en mobile con user agent de iPhone (414×896 @ DPR 2): confirmado visualmente que el poste 3D (versión `liviano`) se ve bien — brillo cálido en la bombilla, rayas nítidas, sin verse "degradado" a simple vista pese a tener menos luces.
- **Limitación real del entorno de prueba, importante de dejar registrada:** Chromium en modo headless en este entorno no tiene GPU real (usa un renderer por software) — el `MonitorRendimiento` mide correctamente ~40-43fps *tanto en mobile como en escritorio*, y baja a la ilustración estática en ambos casos. Esto no es un bug: es el monitor midiendo con precisión un hardware gráfico genuinamente lento. Como el escritorio venía mostrando el 3D fluido en todas las capturas de sesiones anteriores (con GPU real), esto confirma que la medición es correcta — simplemente no se puede demostrar "se ve fluido en un iPhone real" sin un dispositivo físico, que no está disponible en este entorno. Se verificó el camino "rinde bien" desactivando temporalmente el chequeo de fps solo para la captura visual, y revirtiendo el código real inmediatamente después.
- Se repitió la batería de 7 escenarios (375/390/768/1024/1440/1920 + iPhone XR a DPR2) con la lógica real (sin bypasear nada): sin scroll horizontal, sin errores de consola en ninguno.
- Se confirmó que con `prefers-reduced-motion: reduce` el `<canvas>` nunca llega a montarse (0 canvas encontrados tras esperar), es decir, ese camino sigue sin descargar Three.js en absoluto.

**Por qué:**
- Medir fps real en vez de asumir "mobile = débil": un iPhone reciente tiene una GPU más potente que muchos notebooks con integrada — negarle el 3D solo por el ancho de viewport habría sido una regla más simple pero peor, exactamente lo que Enzo notó y preguntó si se podía mejorar.
- `dpr` tope 1 como principal ahorro en mobile (en vez de simplificar la geometría, que ya es low-poly): en GPUs móviles el cuello de botella típico es cuántos píxeles hay que sombrear (fill-rate), no cuántos vértices procesar — es la palanca que más rinde por el menor costo visual.
- Mismo tamaño de contenedor en ambos estados: evitar un salto de layout que se notaría justo cuando el usuario ya está leyendo el hero, en el peor momento posible para un cambio brusco.

**Archivos afectados:**
- Nuevo: `src/components/animations/MonitorRendimiento.jsx`.
- Modificados: `src/components/animations/Scene3DCanvas.jsx` (prop `liviano` + `onRendimientoBajo`), `src/components/animations/HeroScene3D.jsx` (ya no usa `isMobile` para decidir mostrar la ilustración; contenedor unificado).

**Pendiente / próximos pasos:**
- Validar en un dispositivo móvil físico real cuando Enzo tenga oportunidad — todo lo verificado acá es emulación de viewport/DPR/user-agent, no hardware real. Si en la práctica el umbral de 50fps resulta muy estricto o muy laxo para el catálogo real de equipos de sus clientes, es el número a ajustar (`umbralFps` en `MonitorRendimiento`).

---

## 2026-08-06 - Diagnóstico de errores de consola en el DevTools real de Enzo: uno era ruido de una extensión, el otro sí era corregible

**Qué se hizo:**
Enzo compartió una captura de su DevTools mostrando un error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" y una advertencia de React Router. Se investigó cada uno por separado, sin asumir la causa:

1. **El error de "asynchronous response"**: se cargó el sitio en un Chromium recién instalado por Playwright — **sin ninguna extensión** — y se navegó igual que un usuario real (scroll, esperas, sin forzar nada). El error **no apareció en absoluto**. Ese mensaje específico es una firma muy conocida de extensiones de Chrome que usan `chrome.runtime.sendMessage` con un listener que devuelve `true` (avisando que va a responder async) pero nunca llega a responder — típico de gestores de contraseñas, bloqueadores de ads, Grammarly, etc. Confirmado con evidencia: no es un bug del sitio, es una extensión instalada en el navegador real de Enzo. No hay nada que el código de la página pueda hacer para evitar que una extensión de un tercero se comporte así.
2. **La advertencia de React Router** (`v7_startTransition`) — esta sí era corregible y se corrigió. Primer intento: pasar `future: { v7_startTransition: true }` como segundo argumento de `createBrowserRouter` — no funcionó (la advertencia seguía apareciendo incluso reiniciando el dev server desde cero, se verificó explícitamente en vez de asumir que "ya quedó"). Causa: esa bandera específica no es una opción de `createBrowserRouter`, es una prop de `<RouterProvider>`. Corregido pasándola ahí: `<RouterProvider router={router} future={{ v7_startTransition: true }} />`. Verificado de nuevo con el dev server reiniciado: la advertencia ya no aparece.

De paso, revisando la consola en un navegador limpio, aparecieron otros dos mensajes (`GL Driver Message: GPU stall due to ReadPixels` y `THREE.WebGLRenderer: Context Lost`) — se investigaron también: ocurren igual con y sin capturas de pantalla de por medio (se descartó que fueran un artefacto de mi propio método de prueba), pero son específicos de este entorno de sandbox headless sin GPU real (renderiza por software) — el mismo modelo 3D ya se ha visto fluido y correcto en decenas de capturas de sesiones anteriores con GPU real disponible. No se tocó nada del 3D por esto (Enzo ya había pedido explícitamente no tocarlo).

**Cómo se probó:**
- Consola completa en Chromium limpio (sin extensiones): confirmado que el error de "asynchronous response" no es reproducible desde el código del sitio.
- Tras el fix del future flag: reinicio completo del dev server (no solo HMR) + relectura de consola, confirmando la ausencia de la advertencia.
- Navegación real entre rutas (`/`, click a `#planes`, `/demo`, `/login`) sin errores de página.
- Batería completa de 7 viewports (375/390/768/1024/1440/1920 + iPhone XR): sin scroll horizontal, sin errores de página en ninguno.
- `npm run build` limpio en cada punto de control.

**Por qué:**
- Se verificó la hipótesis del "ruido de extensión" con un navegador realmente limpio en vez de solo argumentarlo — la diferencia entre "creo que es una extensión" y "lo probé sin extensiones y no aparece" es la diferencia entre una opinión y un diagnóstico.
- Se corrigió el primer intento fallido del future flag en vez de dejarlo por hecho tras escribir el código — el build pasa igual aunque la bandera esté en el lugar equivocado (no es un error de sintaxis, solo no tiene efecto), así que solo se puede confirmar probando.

**Archivos afectados:**
- `src/routes/AppRouter.jsx` (`future` movido de `createBrowserRouter` a `<RouterProvider>`).

**Pendiente / próximos pasos:**
- El error de "asynchronous response" que vio Enzo es de una extensión de su Chrome — no requiere ni admite un fix desde el código. Si quiere confirmarlo él mismo: abrir el sitio en una ventana de incógnito con las extensiones desactivadas (Chrome permite elegir cuáles corren en incógnito) y ver si el error deja de aparecer.

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

## 2026-08-06 - El modelo 3D del hero ahora se muestra en mobile por defecto, con degradación adaptativa por fps real

**Qué se hizo:**
Hasta ahora, mobile mostraba siempre `StaticBarberPoleIllustration` (la ilustración SVG) — una decisión tomada cuando todavía no existía el modelo 3D real y se optaba por seguridad de rendimiento. Enzo preguntó si se podía mostrar el modelo 3D real en mobile también. La respuesta corta es sí, y el prompt original de la Parte 3 ya lo contemplaba: *"en móvil, degrada: el 3D puede pasar a una versión de menor polycount, menos luces, o a un render estático de alta calidad si el frame rate baja de 50fps"* — es decir, la versión estática debía ser el **último recurso**, no la respuesta por defecto para todo mobile.

Se implementó exactamente eso, de forma adaptativa en vez de una regla fija por ancho de pantalla:

- **`MonitorRendimiento.jsx`** (nuevo): vive dentro del `<Canvas>` y usa `useFrame` para medir el fps real durante los primeros ~2 segundos (con 0.2s de calentamiento descartados, para no contar la compilación de shaders como "lento"). Si el promedio queda bajo 50fps, avisa una sola vez hacia afuera vía callback.
- **`Scene3DCanvas.jsx`**: acepta `liviano` (booleano) y `onRendimientoBajo`. En modo `liviano` (mobile): `dpr` tope 1 en vez de 1.5 (el costo dominante en GPUs móviles es el fill-rate, no la geometría — bajar el dpr es lo que más ahorra), se quitan la luz de relleno y el rim trasero de cobre (quedan ambiente + key cálida, con el ambiente compensado un poco más arriba para que no se vea plano), sin sombra dinámica ni antialiasing.
- **`HeroScene3D.jsx`**: ya no decide "mobile = estática" de entrada. Ahora `mostrarEstatica = prefersReducedMotion || rendimientoBajo` — `prefers-reduced-motion` sigue siendo una preferencia de accesibilidad que se respeta siempre (nunca monta el Canvas, ahorra la descarga completa de Three.js/el `.glb` en ese caso); `rendimientoBajo` es una decisión que se toma recién con una medición real del equipo del visitante, sea el que sea. Se unificó el tamaño del contenedor entre el estado 3D y el estático (antes eran de alto distinto) para que, si el monitor baja a estática después de un par de segundos, no haya un salto de layout — solo cambia lo que hay adentro de la misma caja.

**Cómo se probó:**
- `npm run build` limpio.
- Se reprodujo el modelo real en mobile con user agent de iPhone (414×896 @ DPR 2): confirmado visualmente que el poste 3D (versión `liviano`) se ve bien — brillo cálido en la bombilla, rayas nítidas, sin verse "degradado" a simple vista pese a tener menos luces.
- **Limitación real del entorno de prueba, importante de dejar registrada:** Chromium en modo headless en este entorno no tiene GPU real (usa un renderer por software) — el `MonitorRendimiento` mide correctamente ~40-43fps *tanto en mobile como en escritorio*, y baja a la ilustración estática en ambos casos. Esto no es un bug: es el monitor midiendo con precisión un hardware gráfico genuinamente lento. Como el escritorio venía mostrando el 3D fluido en todas las capturas de sesiones anteriores (con GPU real), esto confirma que la medición es correcta — simplemente no se puede demostrar "se ve fluido en un iPhone real" sin un dispositivo físico, que no está disponible en este entorno. Se verificó el camino "rinde bien" desactivando temporalmente el chequeo de fps solo para la captura visual, y revirtiendo el código real inmediatamente después.
- Se repitió la batería de 7 escenarios (375/390/768/1024/1440/1920 + iPhone XR a DPR2) con la lógica real (sin bypasear nada): sin scroll horizontal, sin errores de consola en ninguno.
- Se confirmó que con `prefers-reduced-motion: reduce` el `<canvas>` nunca llega a montarse (0 canvas encontrados tras esperar), es decir, ese camino sigue sin descargar Three.js en absoluto.

**Por qué:**
- Medir fps real en vez de asumir "mobile = débil": un iPhone reciente tiene una GPU más potente que muchos notebooks con integrada — negarle el 3D solo por el ancho de viewport habría sido una regla más simple pero peor, exactamente lo que Enzo notó y preguntó si se podía mejorar.
- `dpr` tope 1 como principal ahorro en mobile (en vez de simplificar la geometría, que ya es low-poly): en GPUs móviles el cuello de botella típico es cuántos píxeles hay que sombrear (fill-rate), no cuántos vértices procesar — es la palanca que más rinde por el menor costo visual.
- Mismo tamaño de contenedor en ambos estados: evitar un salto de layout que se notaría justo cuando el usuario ya está leyendo el hero, en el peor momento posible para un cambio brusco.

**Archivos afectados:**
- Nuevo: `src/components/animations/MonitorRendimiento.jsx`.
- Modificados: `src/components/animations/Scene3DCanvas.jsx` (prop `liviano` + `onRendimientoBajo`), `src/components/animations/HeroScene3D.jsx` (ya no usa `isMobile` para decidir mostrar la ilustración; contenedor unificado).

**Pendiente / próximos pasos:**
- Validar en un dispositivo móvil físico real cuando Enzo tenga oportunidad — todo lo verificado acá es emulación de viewport/DPR/user-agent, no hardware real. Si en la práctica el umbral de 50fps resulta muy estricto o muy laxo para el catálogo real de equipos de sus clientes, es el número a ajustar (`umbralFps` en `MonitorRendimiento`).

---

## 2026-08-06 - Diagnóstico de errores de consola en el DevTools real de Enzo: uno era ruido de una extensión, el otro sí era corregible

**Qué se hizo:**
Enzo compartió una captura de su DevTools mostrando un error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" y una advertencia de React Router. Se investigó cada uno por separado, sin asumir la causa:

1. **El error de "asynchronous response"**: se cargó el sitio en un Chromium recién instalado por Playwright — **sin ninguna extensión** — y se navegó igual que un usuario real (scroll, esperas, sin forzar nada). El error **no apareció en absoluto**. Ese mensaje específico es una firma muy conocida de extensiones de Chrome que usan `chrome.runtime.sendMessage` con un listener que devuelve `true` (avisando que va a responder async) pero nunca llega a responder — típico de gestores de contraseñas, bloqueadores de ads, Grammarly, etc. Confirmado con evidencia: no es un bug del sitio, es una extensión instalada en el navegador real de Enzo. No hay nada que el código de la página pueda hacer para evitar que una extensión de un tercero se comporte así.
2. **La advertencia de React Router** (`v7_startTransition`) — esta sí era corregible y se corrigió. Primer intento: pasar `future: { v7_startTransition: true }` como segundo argumento de `createBrowserRouter` — no funcionó (la advertencia seguía apareciendo incluso reiniciando el dev server desde cero, se verificó explícitamente en vez de asumir que "ya quedó"). Causa: esa bandera específica no es una opción de `createBrowserRouter`, es una prop de `<RouterProvider>`. Corregido pasándola ahí: `<RouterProvider router={router} future={{ v7_startTransition: true }} />`. Verificado de nuevo con el dev server reiniciado: la advertencia ya no aparece.

De paso, revisando la consola en un navegador limpio, aparecieron otros dos mensajes (`GL Driver Message: GPU stall due to ReadPixels` y `THREE.WebGLRenderer: Context Lost`) — se investigaron también: ocurren igual con y sin capturas de pantalla de por medio (se descartó que fueran un artefacto de mi propio método de prueba), pero son específicos de este entorno de sandbox headless sin GPU real (renderiza por software) — el mismo modelo 3D ya se ha visto fluido y correcto en decenas de capturas de sesiones anteriores con GPU real disponible. No se tocó nada del 3D por esto (Enzo ya había pedido explícitamente no tocarlo).

**Cómo se probó:**
- Consola completa en Chromium limpio (sin extensiones): confirmado que el error de "asynchronous response" no es reproducible desde el código del sitio.
- Tras el fix del future flag: reinicio completo del dev server (no solo HMR) + relectura de consola, confirmando la ausencia de la advertencia.
- Navegación real entre rutas (`/`, click a `#planes`, `/demo`, `/login`) sin errores de página.
- Batería completa de 7 viewports (375/390/768/1024/1440/1920 + iPhone XR): sin scroll horizontal, sin errores de página en ninguno.
- `npm run build` limpio en cada punto de control.

**Por qué:**
- Se verificó la hipótesis del "ruido de extensión" con un navegador realmente limpio en vez de solo argumentarlo — la diferencia entre "creo que es una extensión" y "lo probé sin extensiones y no aparece" es la diferencia entre una opinión y un diagnóstico.
- Se corrigió el primer intento fallido del future flag en vez de dejarlo por hecho tras escribir el código — el build pasa igual aunque la bandera esté en el lugar equivocado (no es un error de sintaxis, solo no tiene efecto), así que solo se puede confirmar probando.

**Archivos afectados:**
- `src/routes/AppRouter.jsx` (`future` movido de `createBrowserRouter` a `<RouterProvider>`).

**Pendiente / próximos pasos:**
- El error de "asynchronous response" que vio Enzo es de una extensión de su Chrome — no requiere ni admite un fix desde el código. Si quiere confirmarlo él mismo: abrir el sitio en una ventana de incógnito con las extensiones desactivadas (Chrome permite elegir cuáles corren en incógnito) y ver si el error deja de aparecer.

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

## 2026-08-06 - El modelo 3D del hero ahora se muestra en mobile por defecto, con degradación adaptativa por fps real

**Qué se hizo:**
Hasta ahora, mobile mostraba siempre `StaticBarberPoleIllustration` (la ilustración SVG) — una decisión tomada cuando todavía no existía el modelo 3D real y se optaba por seguridad de rendimiento. Enzo preguntó si se podía mostrar el modelo 3D real en mobile también. La respuesta corta es sí, y el prompt original de la Parte 3 ya lo contemplaba: *"en móvil, degrada: el 3D puede pasar a una versión de menor polycount, menos luces, o a un render estático de alta calidad si el frame rate baja de 50fps"* — es decir, la versión estática debía ser el **último recurso**, no la respuesta por defecto para todo mobile.

Se implementó exactamente eso, de forma adaptativa en vez de una regla fija por ancho de pantalla:

- **`MonitorRendimiento.jsx`** (nuevo): vive dentro del `<Canvas>` y usa `useFrame` para medir el fps real durante los primeros ~2 segundos (con 0.2s de calentamiento descartados, para no contar la compilación de shaders como "lento"). Si el promedio queda bajo 50fps, avisa una sola vez hacia afuera vía callback.
- **`Scene3DCanvas.jsx`**: acepta `liviano` (booleano) y `onRendimientoBajo`. En modo `liviano` (mobile): `dpr` tope 1 en vez de 1.5 (el costo dominante en GPUs móviles es el fill-rate, no la geometría — bajar el dpr es lo que más ahorra), se quitan la luz de relleno y el rim trasero de cobre (quedan ambiente + key cálida, con el ambiente compensado un poco más arriba para que no se vea plano), sin sombra dinámica ni antialiasing.
- **`HeroScene3D.jsx`**: ya no decide "mobile = estática" de entrada. Ahora `mostrarEstatica = prefersReducedMotion || rendimientoBajo` — `prefers-reduced-motion` sigue siendo una preferencia de accesibilidad que se respeta siempre (nunca monta el Canvas, ahorra la descarga completa de Three.js/el `.glb` en ese caso); `rendimientoBajo` es una decisión que se toma recién con una medición real del equipo del visitante, sea el que sea. Se unificó el tamaño del contenedor entre el estado 3D y el estático (antes eran de alto distinto) para que, si el monitor baja a estática después de un par de segundos, no haya un salto de layout — solo cambia lo que hay adentro de la misma caja.

**Cómo se probó:**
- `npm run build` limpio.
- Se reprodujo el modelo real en mobile con user agent de iPhone (414×896 @ DPR 2): confirmado visualmente que el poste 3D (versión `liviano`) se ve bien — brillo cálido en la bombilla, rayas nítidas, sin verse "degradado" a simple vista pese a tener menos luces.
- **Limitación real del entorno de prueba, importante de dejar registrada:** Chromium en modo headless en este entorno no tiene GPU real (usa un renderer por software) — el `MonitorRendimiento` mide correctamente ~40-43fps *tanto en mobile como en escritorio*, y baja a la ilustración estática en ambos casos. Esto no es un bug: es el monitor midiendo con precisión un hardware gráfico genuinamente lento. Como el escritorio venía mostrando el 3D fluido en todas las capturas de sesiones anteriores (con GPU real), esto confirma que la medición es correcta — simplemente no se puede demostrar "se ve fluido en un iPhone real" sin un dispositivo físico, que no está disponible en este entorno. Se verificó el camino "rinde bien" desactivando temporalmente el chequeo de fps solo para la captura visual, y revirtiendo el código real inmediatamente después.
- Se repitió la batería de 7 escenarios (375/390/768/1024/1440/1920 + iPhone XR a DPR2) con la lógica real (sin bypasear nada): sin scroll horizontal, sin errores de consola en ninguno.
- Se confirmó que con `prefers-reduced-motion: reduce` el `<canvas>` nunca llega a montarse (0 canvas encontrados tras esperar), es decir, ese camino sigue sin descargar Three.js en absoluto.

**Por qué:**
- Medir fps real en vez de asumir "mobile = débil": un iPhone reciente tiene una GPU más potente que muchos notebooks con integrada — negarle el 3D solo por el ancho de viewport habría sido una regla más simple pero peor, exactamente lo que Enzo notó y preguntó si se podía mejorar.
- `dpr` tope 1 como principal ahorro en mobile (en vez de simplificar la geometría, que ya es low-poly): en GPUs móviles el cuello de botella típico es cuántos píxeles hay que sombrear (fill-rate), no cuántos vértices procesar — es la palanca que más rinde por el menor costo visual.
- Mismo tamaño de contenedor en ambos estados: evitar un salto de layout que se notaría justo cuando el usuario ya está leyendo el hero, en el peor momento posible para un cambio brusco.

**Archivos afectados:**
- Nuevo: `src/components/animations/MonitorRendimiento.jsx`.
- Modificados: `src/components/animations/Scene3DCanvas.jsx` (prop `liviano` + `onRendimientoBajo`), `src/components/animations/HeroScene3D.jsx` (ya no usa `isMobile` para decidir mostrar la ilustración; contenedor unificado).

**Pendiente / próximos pasos:**
- Validar en un dispositivo móvil físico real cuando Enzo tenga oportunidad — todo lo verificado acá es emulación de viewport/DPR/user-agent, no hardware real. Si en la práctica el umbral de 50fps resulta muy estricto o muy laxo para el catálogo real de equipos de sus clientes, es el número a ajustar (`umbralFps` en `MonitorRendimiento`).

---

## 2026-08-06 - Diagnóstico de errores de consola en el DevTools real de Enzo: uno era ruido de una extensión, el otro sí era corregible

**Qué se hizo:**
Enzo compartió una captura de su DevTools mostrando un error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" y una advertencia de React Router. Se investigó cada uno por separado, sin asumir la causa:

1. **El error de "asynchronous response"**: se cargó el sitio en un Chromium recién instalado por Playwright — **sin ninguna extensión** — y se navegó igual que un usuario real (scroll, esperas, sin forzar nada). El error **no apareció en absoluto**. Ese mensaje específico es una firma muy conocida de extensiones de Chrome que usan `chrome.runtime.sendMessage` con un listener que devuelve `true` (avisando que va a responder async) pero nunca llega a responder — típico de gestores de contraseñas, bloqueadores de ads, Grammarly, etc. Confirmado con evidencia: no es un bug del sitio, es una extensión instalada en el navegador real de Enzo. No hay nada que el código de la página pueda hacer para evitar que una extensión de un tercero se comporte así.
2. **La advertencia de React Router** (`v7_startTransition`) — esta sí era corregible y se corrigió. Primer intento: pasar `future: { v7_startTransition: true }` como segundo argumento de `createBrowserRouter` — no funcionó (la advertencia seguía apareciendo incluso reiniciando el dev server desde cero, se verificó explícitamente en vez de asumir que "ya quedó"). Causa: esa bandera específica no es una opción de `createBrowserRouter`, es una prop de `<RouterProvider>`. Corregido pasándola ahí: `<RouterProvider router={router} future={{ v7_startTransition: true }} />`. Verificado de nuevo con el dev server reiniciado: la advertencia ya no aparece.

De paso, revisando la consola en un navegador limpio, aparecieron otros dos mensajes (`GL Driver Message: GPU stall due to ReadPixels` y `THREE.WebGLRenderer: Context Lost`) — se investigaron también: ocurren igual con y sin capturas de pantalla de por medio (se descartó que fueran un artefacto de mi propio método de prueba), pero son específicos de este entorno de sandbox headless sin GPU real (renderiza por software) — el mismo modelo 3D ya se ha visto fluido y correcto en decenas de capturas de sesiones anteriores con GPU real disponible. No se tocó nada del 3D por esto (Enzo ya había pedido explícitamente no tocarlo).

**Cómo se probó:**
- Consola completa en Chromium limpio (sin extensiones): confirmado que el error de "asynchronous response" no es reproducible desde el código del sitio.
- Tras el fix del future flag: reinicio completo del dev server (no solo HMR) + relectura de consola, confirmando la ausencia de la advertencia.
- Navegación real entre rutas (`/`, click a `#planes`, `/demo`, `/login`) sin errores de página.
- Batería completa de 7 viewports (375/390/768/1024/1440/1920 + iPhone XR): sin scroll horizontal, sin errores de página en ninguno.
- `npm run build` limpio en cada punto de control.

**Por qué:**
- Se verificó la hipótesis del "ruido de extensión" con un navegador realmente limpio en vez de solo argumentarlo — la diferencia entre "creo que es una extensión" y "lo probé sin extensiones y no aparece" es la diferencia entre una opinión y un diagnóstico.
- Se corrigió el primer intento fallido del future flag en vez de dejarlo por hecho tras escribir el código — el build pasa igual aunque la bandera esté en el lugar equivocado (no es un error de sintaxis, solo no tiene efecto), así que solo se puede confirmar probando.

**Archivos afectados:**
- `src/routes/AppRouter.jsx` (`future` movido de `createBrowserRouter` a `<RouterProvider>`).

**Pendiente / próximos pasos:**
- El error de "asynchronous response" que vio Enzo es de una extensión de su Chrome — no requiere ni admite un fix desde el código. Si quiere confirmarlo él mismo: abrir el sitio en una ventana de incógnito con las extensiones desactivadas (Chrome permite elegir cuáles corren en incógnito) y ver si el error deja de aparecer.

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

## 2026-08-06 - El modelo 3D del hero ahora se muestra en mobile por defecto, con degradación adaptativa por fps real

**Qué se hizo:**
Hasta ahora, mobile mostraba siempre `StaticBarberPoleIllustration` (la ilustración SVG) — una decisión tomada cuando todavía no existía el modelo 3D real y se optaba por seguridad de rendimiento. Enzo preguntó si se podía mostrar el modelo 3D real en mobile también. La respuesta corta es sí, y el prompt original de la Parte 3 ya lo contemplaba: *"en móvil, degrada: el 3D puede pasar a una versión de menor polycount, menos luces, o a un render estático de alta calidad si el frame rate baja de 50fps"* — es decir, la versión estática debía ser el **último recurso**, no la respuesta por defecto para todo mobile.

Se implementó exactamente eso, de forma adaptativa en vez de una regla fija por ancho de pantalla:

- **`MonitorRendimiento.jsx`** (nuevo): vive dentro del `<Canvas>` y usa `useFrame` para medir el fps real durante los primeros ~2 segundos (con 0.2s de calentamiento descartados, para no contar la compilación de shaders como "lento"). Si el promedio queda bajo 50fps, avisa una sola vez hacia afuera vía callback.
- **`Scene3DCanvas.jsx`**: acepta `liviano` (booleano) y `onRendimientoBajo`. En modo `liviano` (mobile): `dpr` tope 1 en vez de 1.5 (el costo dominante en GPUs móviles es el fill-rate, no la geometría — bajar el dpr es lo que más ahorra), se quitan la luz de relleno y el rim trasero de cobre (quedan ambiente + key cálida, con el ambiente compensado un poco más arriba para que no se vea plano), sin sombra dinámica ni antialiasing.
- **`HeroScene3D.jsx`**: ya no decide "mobile = estática" de entrada. Ahora `mostrarEstatica = prefersReducedMotion || rendimientoBajo` — `prefers-reduced-motion` sigue siendo una preferencia de accesibilidad que se respeta siempre (nunca monta el Canvas, ahorra la descarga completa de Three.js/el `.glb` en ese caso); `rendimientoBajo` es una decisión que se toma recién con una medición real del equipo del visitante, sea el que sea. Se unificó el tamaño del contenedor entre el estado 3D y el estático (antes eran de alto distinto) para que, si el monitor baja a estática después de un par de segundos, no haya un salto de layout — solo cambia lo que hay adentro de la misma caja.

**Cómo se probó:**
- `npm run build` limpio.
- Se reprodujo el modelo real en mobile con user agent de iPhone (414×896 @ DPR 2): confirmado visualmente que el poste 3D (versión `liviano`) se ve bien — brillo cálido en la bombilla, rayas nítidas, sin verse "degradado" a simple vista pese a tener menos luces.
- **Limitación real del entorno de prueba, importante de dejar registrada:** Chromium en modo headless en este entorno no tiene GPU real (usa un renderer por software) — el `MonitorRendimiento` mide correctamente ~40-43fps *tanto en mobile como en escritorio*, y baja a la ilustración estática en ambos casos. Esto no es un bug: es el monitor midiendo con precisión un hardware gráfico genuinamente lento. Como el escritorio venía mostrando el 3D fluido en todas las capturas de sesiones anteriores (con GPU real), esto confirma que la medición es correcta — simplemente no se puede demostrar "se ve fluido en un iPhone real" sin un dispositivo físico, que no está disponible en este entorno. Se verificó el camino "rinde bien" desactivando temporalmente el chequeo de fps solo para la captura visual, y revirtiendo el código real inmediatamente después.
- Se repitió la batería de 7 escenarios (375/390/768/1024/1440/1920 + iPhone XR a DPR2) con la lógica real (sin bypasear nada): sin scroll horizontal, sin errores de consola en ninguno.
- Se confirmó que con `prefers-reduced-motion: reduce` el `<canvas>` nunca llega a montarse (0 canvas encontrados tras esperar), es decir, ese camino sigue sin descargar Three.js en absoluto.

**Por qué:**
- Medir fps real en vez de asumir "mobile = débil": un iPhone reciente tiene una GPU más potente que muchos notebooks con integrada — negarle el 3D solo por el ancho de viewport habría sido una regla más simple pero peor, exactamente lo que Enzo notó y preguntó si se podía mejorar.
- `dpr` tope 1 como principal ahorro en mobile (en vez de simplificar la geometría, que ya es low-poly): en GPUs móviles el cuello de botella típico es cuántos píxeles hay que sombrear (fill-rate), no cuántos vértices procesar — es la palanca que más rinde por el menor costo visual.
- Mismo tamaño de contenedor en ambos estados: evitar un salto de layout que se notaría justo cuando el usuario ya está leyendo el hero, en el peor momento posible para un cambio brusco.

**Archivos afectados:**
- Nuevo: `src/components/animations/MonitorRendimiento.jsx`.
- Modificados: `src/components/animations/Scene3DCanvas.jsx` (prop `liviano` + `onRendimientoBajo`), `src/components/animations/HeroScene3D.jsx` (ya no usa `isMobile` para decidir mostrar la ilustración; contenedor unificado).

**Pendiente / próximos pasos:**
- Validar en un dispositivo móvil físico real cuando Enzo tenga oportunidad — todo lo verificado acá es emulación de viewport/DPR/user-agent, no hardware real. Si en la práctica el umbral de 50fps resulta muy estricto o muy laxo para el catálogo real de equipos de sus clientes, es el número a ajustar (`umbralFps` en `MonitorRendimiento`).

---

## 2026-08-06 - Diagnóstico de errores de consola en el DevTools real de Enzo: uno era ruido de una extensión, el otro sí era corregible

**Qué se hizo:**
Enzo compartió una captura de su DevTools mostrando un error "Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" y una advertencia de React Router. Se investigó cada uno por separado, sin asumir la causa:

1. **El error de "asynchronous response"**: se cargó el sitio en un Chromium recién instalado por Playwright — **sin ninguna extensión** — y se navegó igual que un usuario real (scroll, esperas, sin forzar nada). El error **no apareció en absoluto**. Ese mensaje específico es una firma muy conocida de extensiones de Chrome que usan `chrome.runtime.sendMessage` con un listener que devuelve `true` (avisando que va a responder async) pero nunca llega a responder — típico de gestores de contraseñas, bloqueadores de ads, Grammarly, etc. Confirmado con evidencia: no es un bug del sitio, es una extensión instalada en el navegador real de Enzo. No hay nada que el código de la página pueda hacer para evitar que una extensión de un tercero se comporte así.
2. **La advertencia de React Router** (`v7_startTransition`) — esta sí era corregible y se corrigió. Primer intento: pasar `future: { v7_startTransition: true }` como segundo argumento de `createBrowserRouter` — no funcionó (la advertencia seguía apareciendo incluso reiniciando el dev server desde cero, se verificó explícitamente en vez de asumir que "ya quedó"). Causa: esa bandera específica no es una opción de `createBrowserRouter`, es una prop de `<RouterProvider>`. Corregido pasándola ahí: `<RouterProvider router={router} future={{ v7_startTransition: true }} />`. Verificado de nuevo con el dev server reiniciado: la advertencia ya no aparece.

De paso, revisando la consola en un navegador limpio, aparecieron otros dos mensajes (`GL Driver Message: GPU stall due to ReadPixels` y `THREE.WebGLRenderer: Context Lost`) — se investigaron también: ocurren igual con y sin capturas de pantalla de por medio (se descartó que fueran un artefacto de mi propio método de prueba), pero son específicos de este entorno de sandbox headless sin GPU real (renderiza por software) — el mismo modelo 3D ya se ha visto fluido y correcto en decenas de capturas de sesiones anteriores con GPU real disponible. No se tocó nada del 3D por esto (Enzo ya había pedido explícitamente no tocarlo).

**Cómo se probó:**
- Consola completa en Chromium limpio (sin extensiones): confirmado que el error de "asynchronous response" no es reproducible desde el código del sitio.
- Tras el fix del future flag: reinicio completo del dev server (no solo HMR) + relectura de consola, confirmando la ausencia de la advertencia.
- Navegación real entre rutas (`/`, click a `#planes`, `/demo`, `/login`) sin errores de página.
- Batería completa de 7 viewports (375/390/768/1024/1440/1920 + iPhone XR): sin scroll horizontal, sin errores de página en ninguno.
- `npm run build` limpio en cada punto de control.

**Por qué:**
- Se verificó la hipótesis del "ruido de extensión" con un navegador realmente limpio en vez de solo argumentarlo — la diferencia entre "creo que es una extensión" y "lo probé sin extensiones y no aparece" es la diferencia entre una opinión y un diagnóstico.
- Se corrigió el primer intento fallido del future flag en vez de dejarlo por hecho tras escribir el código — el build pasa igual aunque la bandera esté en el lugar equivocado (no es un error de sintaxis, solo no tiene efecto), así que solo se puede confirmar probando.

**Archivos afectados:**
- `src/routes/AppRouter.jsx` (`future` movido de `createBrowserRouter` a `<RouterProvider>`).

**Pendiente / próximos pasos:**
- El error de "asynchronous response" que vio Enzo es de una extensión de su Chrome — no requiere ni admite un fix desde el código. Si quiere confirmarlo él mismo: abrir el sitio en una ventana de incógnito con las extensiones desactivadas (Chrome permite elegir cuáles corren en incógnito) y ver si el error deja de aparecer.

---

## 2026-08-07 - Rediseño completo del login: carrusel a sangrado en vez del 3D, formulario con todos sus estados, y separación desktop/mobile/shared adoptada como estándar del proyecto

**Qué se hizo:**

**1. Por qué se sacó el 3D de esta pantalla.** El poste de barbería 3D es la pieza de identidad del *hero* del home — tiene sentido ahí porque el visitante llega sin contexto y el 3D vende oficio/artesanía en el primer segundo. En el login el usuario ya es un cliente de la plataforma que solo quiere entrar a trabajar; un modelo 3D girando de fondo compite con el formulario en vez de acompañarlo, y además carga Three.js/el `.glb` en una pantalla que se visita muchas veces al día. Se reemplazó por un carrusel de imágenes a sangrado (crossfade, nunca slide lateral) con un slogan por imagen — mismo mood cobre/negro-barbero de la marca, mucho más liviano.

**2. Los pares imagen/slogan y dónde editarlos.** Viven en `src/pages/Login/data/slides.js`, nunca hardcodeados en el JSX — es el único archivo que hay que tocar para cambiar contenido. Los 4 pares actuales (con placeholders abstractos, ver Pendiente):
  - Silla de barbero vacía, luz lateral → *"Tu sillón te espera."*
  - Tijera/manos, plano cercano → *"Tú al oficio. Nosotros a la agenda."*
  - Herramientas ordenadas en el mesón → *"Todo en su lugar."*
  - Cuaderno de horas cerrado, luz baja → *"El cuaderno quedó atrás."*
  El archivo también expone `DURACION_SLIDE_MS` (7000), `DURACION_TRANSICION_MS` (1200) y `DESFASE_TEXTO_MS` (500, la imagen empieza a desvanecer antes de que el texto salga/entre, a propósito).

**3. Carga progresiva.** Solo la primera imagen carga de inmediato (`fetchPriority="high"`); las otras 3 ni siquiera se montan en el DOM hasta que `useCarruselLogin` marca `secundariasListas` (vía `requestIdleCallback`, con `setTimeout` de respaldo para Safari) — se probó que el formulario es interactivo (`fill()` responde) en ~60-75ms sin esperar ninguna imagen. `ImagenCarrusel.jsx` está listo para pasar de `placeholder` (string, el SVG actual) a `fuentes: { webp, jpg, webpMovil, jpgMovil }` sin tocar ningún componente — ver Pendiente para el formato exacto de las fotos reales.

**4. Estados funcionales del formulario** (`shared/FormularioAcceso.jsx` + `shared/useLogin.js`, toda la lógica de auth en el hook, nunca en la UI):
  - Auto-focus en usuario al cargar; Enter en cualquier campo envía.
  - Botón deshabilitado + loader propio (navaja, no un spinner genérico) mientras envía; guardia sincrónica por `useRef` contra doble-submit (probado: doble click real dispara una sola request de auth, no dos).
  - Error de credenciales: mensaje genérico ("Usuario o contraseña incorrectos") — nunca revela si el usuario existe.
  - Error de conexión, diferenciado: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."
  - Cuenta inactiva: si `barberias.estado_id` no es el activo, se cierra la sesión recién abierta y se muestra un mensaje específico en vez de dejar pasar al panel.
  - Validación cliente (zod) antes de enviar, sin recargar ni perder lo tipeado.
  - Detección de Bloq Mayús en el campo de contraseña (advertencia visible bajo el campo).
  - Mostrar/ocultar contraseña con ícono propio (no el nativo del navegador).
  - "¿Olvidaste tu contraseña?" abre una explicación inline — **placeholder**: por ahora dirige a pedirle la actualización a quien administra la barbería (+ WhatsApp si `VITE_WHATSAPP_CONTACTO` está seteado). No hay flujo de recuperación real todavía.
  - `autocomplete="username"` / `"current-password"` correctos para que el gestor de contraseñas del navegador funcione.
  - Sesión activa visitando `/login` → redirige al panel según rol sin mostrar el formulario.
  - Bug real encontrado y corregido durante las pruebas: `esErrorDeRed()` en `authService.js` solo reconocía fallas de red con la forma que usa el cliente de Auth (`TypeError` / `AuthRetryableFetchError`). La RPC `obtener_email_por_usuario` usa postgrest-js, que en una falla de red devuelve un objeto plano con el fetch original serializado en `.message` (nunca `instanceof TypeError`) — una caída de conexión en ese paso específico se mostraba como "Usuario o contraseña incorrectos" en vez del mensaje de conexión. Se agregó un chequeo por texto (`/failed to fetch|networkerror|load failed/i` sobre `error.message`) como respaldo.

**5. Separación desktop/mobile/shared — adoptada como estándar del proyecto de acá en adelante.**
```
src/pages/Login/
├── Login.jsx              # orquestador: decide desktop o mobile, estados de sesión
├── desktop/LoginDesktop.jsx   # composición DESKTOP (cabecera "=== LOGIN — VERSIÓN DESKTOP ===")
├── mobile/LoginMobile.jsx     # composición MÓVIL (cabecera "=== LOGIN — VERSIÓN MÓVIL ===")
├── shared/                # lógica y piezas de UI que usan ambas composiciones — una sola vez
│   ├── useLogin.js, esquemaLogin.js       (auth + validación)
│   ├── useCarruselLogin.js, ImagenCarrusel.jsx, TextoSlogan.jsx   (carrusel)
│   └── FormularioAcceso.jsx, IconoOjo.jsx (formulario)
└── data/slides.js         # contenido del carrusel
```
La razón de fondo: si mobile y desktop copiaran su propia lógica de auth/validación/carrusel, con el tiempo terminan desincronizados (un fix en uno no llega al otro). Todo lo que es *comportamiento* (qué pasa al enviar, qué dice cada error, cuándo rota el carrusel) vive una sola vez en `shared/`; lo que es *composición visual* (cómo se ve, qué tamaño, qué anima) vive por separado en `desktop/` y `mobile/`, porque ahí sí deben poder diferir a propósito. **Esta convención queda adoptada para el resto de los módulos del proyecto** (home, página de barbería, paneles) de acá en adelante — no implica rehacer lo que ya está en producción, pero todo módulo nuevo con composiciones desktop/mobile suficientemente distintas debería seguir esta misma estructura.

La decisión de cuál composición renderizar usa `useIsMobile()` (ya existente, basado en `matchMedia` con `addEventListener('change', ...)`), que reacciona en vivo tanto a resize como a rotación de pantalla — no fue necesario un hook nuevo.

**6. Composición mobile y el problema del teclado virtual.** Mobile no es el desktop achicado: la imagen es una franja superior (no medio split-screen), con su propia escala tipográfica para 375-428px (no un `clamp()` reutilizado), menos elementos animados a la vez, y sin nada dependiente de `hover`. El problema típico de mobile — que el teclado tape el botón de enviar — se resolvió en dos frentes: (a) la franja de imagen se achica de `~30vh` a `64px` en cuanto cualquier campo recibe foco (vía el mismo callback `onCambioFoco` que ya pausa el carrusel en desktop), liberando espacio vertical; (b) al probar con un viewport muy bajo (375×320, aproximando el teclado abierto en un equipo chico) el botón todavía quedaba fuera de la pantalla — se agregó un modo `compacto` a `FormularioAcceso` (gaps más chicos, sin perder el mínimo de 44px de los campos/botón) que además oculta el título "Ingresar" mientras hay un campo con foco, dejando más aire para el formulario mismo.

**7. Resultado de las 16 pruebas** (Playwright con mocks de red sobre Supabase — no hay backend real conectado en este entorno; instalado como dependencia temporal y desinstalado al terminar), separado por lo que es específico de cada dispositivo:

*Aplican igual en desktop y mobile (verificadas una sola vez, la lógica es compartida):* login correcto por los 3 roles con redirección correcta (1), credenciales incorrectas con mensaje genérico (2), campos vacíos con validación sin perder lo tipeado (3), error de conexión diferenciado — corregido durante la prueba, ver punto 4 (4), doble click sin doble request (5), navegación por teclado Tab/Enter (7), atributos `autocomplete` correctos (8), `prefers-reduced-motion` sin rotación (11), cursor cambia de forma por tipo de elemento y desaparece en contexto táctil (12), formulario interactivo antes de que termine de cargar el carrusel (13), sesión activa en `/login` redirige sin mostrar el formulario (14).

*Específicas de mobile:* sin scroll horizontal en 375/390/768/1024/1440/1920px (9), botón "Ingresar" visible con viewport muy reducido simulando teclado abierto — requirió el ajuste del punto 6 (9b), landscape 667×375 sin scroll y con el botón visible (9c), inputs con `font-size` ≥16px para no disparar zoom automático en iOS (16).

*No automatizables en este entorno — requieren verificación manual, documentado explícitamente en vez de darlas por buenas:*
- **(6) Bloq Mayús:** el protocolo de automatización de Chromium (CDP) no puede alternar el estado real de bloqueo que `getModifierState('CapsLock')` consulta — no hay tecla física que reportar en un navegador headless. El código de detección es el mecanismo estándar del navegador y está implementado; falta que Enzo (u otra persona) lo confirme con un teclado real.
- **(8, autofill) y (9b/virtual keyboard real):** el autocompletado real del gestor de contraseñas del navegador y el comportamiento exacto del teclado virtual de iOS/Android no son reproducibles en Playwright headless — se verificó lo que sí es automatizable (atributos correctos, botón visible con el viewport reducido) pero la confirmación final necesita un dispositivo real.
- **(10) Contraste en cada frame de transición:** verificado estructuralmente (overlay pareja + texto siempre en tono claro), pero el veredicto visual final en el frame medio de cada crossfade es un juicio humano, no solo un cálculo de contraste aislado.
- **(13, 3G real):** se simuló latencia agregada a los assets de imagen en vez de usar el perfil de throttling nativo de Playwright (requiere CDP expuesto de forma distinta según el canal de instalación).
- **(15) Encuadre del sujeto en cada imagen mobile:** no evaluable todavía — las 4 imágenes actuales son placeholders abstractos (gradiente + grano SVG), no fotografías reales con un sujeto que pueda salirse del encuadre.

**Por qué:**
- El 3D es una decisión de *hero*, no de utilidad diaria — en una pantalla que se visita muchas veces al día, la velocidad y la falta de distracción pesan más que el impacto inicial.
- La taxonomía de errores (`ErrorLogin` con `.tipo`) vive solo en `authService.js` para que la UI nunca tenga que inspeccionar texto de Supabase ni decidir qué mensaje mostrar — un solo lugar donde se define qué es "error de red" evita que ese criterio se desincronice entre pantallas futuras que reutilicen el mismo servicio.
- La separación desktop/mobile/shared se adopta como estándar (y no solo para este login) porque el problema que resuelve — lógica duplicada que se desincroniza con el tiempo — no es específico de esta pantalla; es más barato fijar la convención ahora, con un ejemplo concreto ya funcionando, que descubrirla de nuevo en el próximo módulo.
- Reportar las pruebas no automatizables como tales (en vez de omitirlas o darlas por buenas) es más útil que un reporte que diga "16/16" sin que eso sea cierto.

**Archivos afectados:**
- Nuevo: `src/pages/Login/{data,shared,desktop,mobile}/*` (estructura completa descrita en el punto 5), `src/assets/login/*.svg` (4 placeholders).
- Modificado: `src/services/authService.js` (taxonomía de errores + chequeo de barbería activa + fix del bug de detección de red en la RPC), `src/components/common/Cursor.jsx` (reacciona distinto por tipo de elemento: se agranda y rellena sobre botones, se angosta a una barra vertical sobre campos de texto, anillo intermedio sobre links), `src/components/common/Button.jsx` (`data-cursor="boton"` para que el cursor lo detecte sin importar si el botón renderiza como `<a>` o `<button>`).
- Eliminado: `src/pages/Login/esquemaLogin.js` (movido a `shared/esquemaLogin.js`, mismo contenido).

**Pendiente / próximos pasos:**
- **Las 4 imágenes del carrusel son placeholders abstractos** (gradientes + grano SVG, sin rostros ni gente posada a propósito) — están listas para reemplazarse por fotografía real sin tocar componentes: en `data/slides.js`, cambiar `placeholder: 'ruta.svg'` por `fuentes: { webp, jpg, webpMovil, jpgMovil }` en cada slide. Especificación para las fotos reales: orientación vertical o crop vertical bien encuadrado, mínimo ~1400×2000px de origen, formato WebP con fallback JPG (nunca PNG para fotografía), una versión reducida para mobile (`webpMovil`/`jpgMovil`), y contenido de detalle de oficio (herramientas, texturas, manos, luz sobre superficies) — sin rostros identificables ni fotos de stock de gente posada.
- **Recuperación de contraseña real:** el flujo actual es un placeholder que dirige a contactar al administrador de la barbería. Falta decidir e implementar un flujo real (ej. reset por email técnico) cuando se priorice.
- **Verificación manual pendiente** (no automatizable en este entorno, ver punto 7): Bloq Mayús con teclado físico, autofill real del gestor de contraseñas, teclado virtual real en un dispositivo iOS/Android físico, y el juicio visual final de contraste en cada transición del carrusel con las fotos reales puestas.
- **Nota aparte, no relacionada con el login:** al revisar este archivo se encontraron varias entradas anteriores (2026-08-06) duplicadas varias veces de forma consecutiva — parece un artefacto de un guardado anterior, no contenido nuevo. No se tocó nada (esta convención es de solo-agregar), pero vale la pena que Enzo lo revise y decida si quiere deduplicarlas a mano.

---

## 2026-08-10 - Login: fotografía real conectada (4/4), bug del carrusel "pegado" corregido, ajuste fino de encuadre móvil y rediseño del cursor sobre botones

**Qué se hizo:**

**1. Ritmo del carrusel y slogans.** A pedido de Enzo, `DURACION_SLIDE_MS` bajó de 7000 a 2500 y luego se afinó a **4000ms** (todo lo demás — crossfade, desfase de texto, barra de progreso — lee esa misma constante en `data/slides.js`, así que el ritmo se ajustó sin tocar nada más). Los 4 slogans se reescribieron con foco en bienestar del barbero + tono de marketing profesional: *"Tu día, ordenado antes de empezar."*, *"Tú al oficio. Nosotros a la agenda."*, *"Tu mesón en orden. Tu agenda también."*, y más tarde *"Todo listo para el próximo turno."* (ver punto 3).

**2. Fotografía real: 3 de 4 imágenes.** Enzo subió 4 fotos a `public/images/login/` (`login1-4.jpg`, 3-8.7MB cada una, directo de cámara). Se revisó cada una contra el criterio ya definido (sin rostros identificables, orientación vertical, mood cálido/desaturado consistente):
  - `login1.jpg` (manos + máquina en la nuca, cliente de espalda) → slide `tijera`.
  - `login3.jpg` (interior con fila de sillones, lámparas colgantes) → slide `silla`.
  - `login2.jpg` (mesón con máquinas/peines, **horizontal**) → slide `herramientas`, recorte vertical necesario.
  - `login4.jpg` se dejó afuera en la primera pasada: mostraba un barbero y un cliente reales, desenfocados, en el fondo — justo lo que la regla del carrusel pide evitar.

  Instalada `sharp` como dependencia temporal (mismo criterio que Playwright: se usa y se desinstala) para generar los derivados: cada foto se redimensionó a 1400×2000 (desktop) y 750×1072 (móvil), en WebP + JPG. Tamaños finales entre 34KB y 355KB — muy lejos de los 3-8.7MB originales. Los 4 archivos de cámara sin procesar se movieron a `src/assets/login/originales-sin-procesar/` (fuera de `public/`, no se sirven).

**3. La 4ta imagen, recuperada.** Enzo pidió específicamente completar la que faltaba. Revisando `login4.jpg` de nuevo: las personas del fondo ocupan solo el 38% superior del cuadro: se recortó ese margen y quedó una composición de detalle — toalla a rayas sobre el sillón, textura de cuero — sin nadie visible (una pierna borrosa en el extremo del encuadre, sin rostro, se consideró aceptable bajo el mismo criterio que ya se usaba para "manos sin cara"). Reemplazó al placeholder abstracto que hacía de `cuaderno` — con un slogan nuevo acorde a lo que la foto realmente muestra (ya no tenía sentido forzar "el cuaderno quedó atrás" sobre una foto de toalla y sillón): **"Todo listo para el próximo turno."** Con esto, las 4 imágenes del carrusel son fotografía real — no queda ningún placeholder abstracto en el login. Los 3 SVG que quedaron sin uso (`silla.svg`, `tijera.svg`, `herramientas.svg`, `cuaderno.svg`) se eliminaron de `src/assets/login/`.

**4. Bug real: el carrusel no rotaba.** Enzo reportó que las imágenes no cambiaban, se quedaban pegadas. Diagnóstico con Playwright: la barra de progreso del carrusel no existía en el DOM ni 300ms después de cargar la página, sin que nadie tocara nada. Causa: el campo de usuario tiene `autoFocus`, que dispara el evento `focus` del formulario apenas monta — y ese evento estaba conectado directo a la pausa del carrusel (`onCambioFoco` → `pausado`). El carrusel nacía pausado en el segundo cero y solo se liberaba si el usuario abandonaba *todo* el formulario, algo que casi nunca pasa en un login real. La causa de fondo: la pausa estaba atada a "¿hay foco en algún campo?" cuando debía estar atada a "¿el usuario está escribiendo activamente?" — son señales distintas. Se separaron en `FormularioAcceso.jsx`: `onCambioFoco` (por foco, sigue usándola mobile para achicar la franja de imagen cuando se abre el teclado) y una nueva `onEscribiendo` (por tecleo real vía `onInput`, con 1.2s de margen de inactividad antes de avisar que se dejó de escribir) — el carrusel ahora se pausa con esta segunda señal. Verificado con Playwright: rota solo sin interacción, se pausa mientras se escribe, y retoma sola ~1.2s después de la última tecla.

**5. Encuadre en móvil, afinado con pruebas.** Enzo pidió ver cómo quedaba mejor el encuadre de cada foto en la franja móvil (que es una banda corta y ancha — object-fit:cover recorta casi todo el ancho de la foto, así que lo único que importa ajustar es la posición vertical). Se probaron 6 posiciones por imagen (10/25/40/55/70/85%), recortando exactamente la franja tal como se ve en pantalla, y se eligió la más legible/profesional de cada una: `silla` 70% (muestra la fila de sillones, no solo las lámparas del techo), `tijera` 25% (la máquina en la mano queda nítida, no solo piel/tinta abstracta), `herramientas` 40% (el conjunto de peines en diagonal, con variedad de color), `listo` 55% (la textura de la toalla con un borde cálido de piso). Verificado el resultado final (con overlay y logo encima) en 375×667 y 390×844 — consistente en ambos anchos.

**6. Dos correcciones puntuales de pulido:**
  - **Letra cortada en los slogans** (ej. la "g" de "agenda"): el contenedor `overflow-hidden` del revelado por máscara (`TextoSlogan.jsx`) no dejaba margen abajo para las descendentes (g/j/p/q/y) con el `leading` ajustado del texto. Se agregó `pb-[0.2em]` al contenedor — no afecta la animación de entrada/salida (esa se mueve relativa a la altura del propio texto, no a la del contenedor), solo le da aire abajo.
  - **Cursor sobre botones, demasiado opaco**: el anillo al pasar por un botón crecía a 64px con 92% de opacidad — tapaba el texto del botón. Enzo pidió repensarlo, no solo bajarle el número. Se le dio identidad propia usando **laton** (bronce, `#b08d57` — tono de la paleta hasta ahora sin uso en el cursor) en vez de reusar cobre: un anillo de 56px, casi sin relleno (14% de opacidad), que crece sobre botones sin tapar nada — distinto del anillo cobre (más chico, 46px) que sigue usándose sobre links. Es un cambio en `Cursor.jsx`, que es global (se monta una vez en `main.jsx`), así que mejora en todo el sitio, no solo en el login.

**Cómo se probó:**
Playwright instalado y desinstalado como dependencia temporal en cada ronda (mismo patrón ya establecido: nunca queda en `package.json`). Cada punto de este resumen se verificó con capturas o medición directa (ancho de la barra de progreso, `src` real en pantalla con timestamps, bounding box del botón con el cursor encima) antes de darlo por resuelto — en particular el diagnóstico del carrusel pegado y el ajuste de encuadre móvil pasaron por una ronda de prueba fallida (deriva de tiempo en el script de prueba, no del producto) que se corrigió antes de confiar en el resultado. `npm run build` limpio después de cada cambio.

**Por qué:**
- Separar "foco" de "escribiendo" en vez de solo desactivar la pausa: la pausa mientras se escribe sigue siendo la intención correcta (no distraer), el bug era usar la señal equivocada para detectarla.
- Recortar y salvar la 4ta foto en vez de descartarla: ya había una razón de contenido válida (no había ninguna foto de cuaderno), y la imagen sí tenía un recorte limpio disponible una vez fuera las personas del fondo — más barato que pedir una foto nueva.
- Laton en vez de solo bajar la opacidad del cobre: un botón y un link son cosas distintas para el usuario: dar cada uno su propio color, no solo su propio tamaño, es lo que hace que el cursor lea como diseño y no como decoración repetida — el criterio que ya se había definido para esta feature.

**Archivos afectados:**
- `src/pages/Login/data/slides.js` (timing, slogans, las 4 imágenes ahora con `fuentes` reales, sin ningún `placeholder` abstracto).
- `public/images/login/*.{webp,jpg}` (12 archivos: 4 imágenes × desktop/móvil × webp/jpg).
- `src/assets/login/originales-sin-procesar/login{1-4}.jpg` (nuevo, fuera de `public/`).
- Eliminados: `src/assets/login/{silla,tijera,herramientas,cuaderno}.svg` (ya sin uso).
- `src/pages/Login/shared/FormularioAcceso.jsx` (nueva señal `onEscribiendo`, separada de `onCambioFoco`).
- `src/pages/Login/desktop/LoginDesktop.jsx`, `src/pages/Login/mobile/LoginMobile.jsx` (wiring de la nueva señal; mobile mantiene ambas).
- `src/pages/Login/shared/TextoSlogan.jsx` (`pb-[0.2em]` para las descendentes).
- `src/components/common/Cursor.jsx` (anillo de botón rediseñado en laton, sin relleno pesado; el punto central ahora también visible sobre botones).

**Pendiente / próximos pasos:**
- Las 4 imágenes ya son fotografía real — no queda ningún placeholder pendiente de reemplazo en el login.
- El recorte de `herramientas` (desde una foto horizontal) es aceptable pero no ideal — perdió la fila inferior de máquinas doradas del original. Si en algún momento se quiere mejorar, hay que reprocesar desde `src/assets/login/originales-sin-procesar/login2.jpg` con otro punto de recorte, no alcanza con tocar `slides.js`.
- La leve cercanía visual entre cobre y laton (son dos tonos cálidos de la misma familia) hace que la diferencia botón/link del cursor sea sutil más que evidente a primera vista — se optó así a propósito (evitar que el cursor "grite"), pero vale la pena que Enzo lo revise en su pantalla real y avise si prefiere una diferencia más marcada.
- Sigue pendiente todo lo ya anotado como no-automatizable en la entrada anterior (Bloq Mayús con teclado físico, autofill real, teclado virtual en dispositivo real, flujo de recuperación de contraseña real).

---

## 2026-08-10 - Cursor: el anillo sobre botones y links se reemplazó por una mano con el índice extendido

**Qué se hizo:**
Enzo pidió repensar de nuevo el estado del cursor sobre elementos clicables: en vez de un anillo (aunque ya fuera translúcido, ver entrada anterior), quería algo tipo "mano con el dedo índice" — el mismo lenguaje del cursor `pointer` nativo del sistema, pero dibujado a mano con la paleta del sitio en vez de depender del cursor del navegador.

Se creó `src/components/common/CursorManoIndice.jsx`: un ícono SVG propio (tres rectángulos con bordes redondeados — dedo índice, palma, pulgar — con un trazo hueso de contorno para que se lea bien tanto sobre fondos claros como oscuros). No es un ícono de librería ni un emoji: mismo criterio que el resto del sitio ("cero iconografía de stock").

En `Cursor.jsx`: sobre botones y links, el anillo desaparece por completo y aparece este ícono en su lugar, siguiendo el mismo movimiento con inercia (spring) que ya tenía el anillo. Mantiene la diferenciación de color ya establecida — botón en laton (bronce), link en cobre — ahora expresada en el color de la mano en vez de en el color de un anillo. Los estados `default` (anillo simple) y `texto` (barra vertical, sobre campos de formulario) no cambiaron.

Hubo dos rondas de ajuste antes del resultado final:
1. La primera versión del ícono, con una rotación general de -14° sobre todo el grupo, se veía como un blob/paleta en vez de una mano — el pulgar y la palma se fundían visualmente. Se rehizo sin la rotación general (cada pieza dibujada recta, con el pulgar rotado solo él) y ahora se lee con claridad como una mano señalando.
2. El punto de anclaje del ícono (dónde "toca" la posición real del cursor) estaba centrado en el medio del dibujo, no en la punta del dedo — se notaba un desfase entre dónde estaba el mouse real y dónde parecía apuntar la mano. Se recalculó el offset (`translateX: -50%, translateY: -8%`) para que la punta del índice sea el punto exacto que sigue al cursor real, igual que un cursor de sistema tiene su "hotspot" en la punta de la flecha.

**Cómo se probó:**
Playwright instalado y desinstalado como dependencia temporal (mismo patrón de siempre). Se verificó con capturas: la mano se lee con claridad sobre el botón "Ingresar" del login (laton) y sobre "¿Olvidaste tu contraseña?" (cobre); el punto de anclaje coincide con la punta del dedo tras el ajuste; los estados que no debían cambiar siguen iguales (`default`: punto + anillo sobre espacio vacío; `texto`: barra vertical sobre un campo de input); en contexto táctil (`hasTouch` + `isMobile`) el cursor propio no se activa; y se confirmó el mismo comportamiento en un botón real de la Home (`Button.jsx`), ya que `Cursor.jsx` es global.

**Por qué:**
- Ícono propio en vez de un cursor CSS nativo (`cursor: pointer`) o un emoji: mantiene la coherencia de que todo el cursor personalizado (punto, anillo, barra, y ahora la mano) es dibujo propio con la paleta del sitio, no un recurso genérico.
- Ajustar el hotspot a la punta del dedo en vez de dejarlo centrado: un cursor cuyo punto de referencia visual no coincide con dónde realmente se hace click se percibe como impreciso, aunque funcionalmente el click siga funcionando bien (el `pointer-events-none` del ícono no interfiere con la interacción real).

**Archivos afectados:**
- Nuevo: `src/components/common/CursorManoIndice.jsx`.
- Modificado: `src/components/common/Cursor.jsx` (la mano reemplaza al anillo en los estados `boton`/`enlace`; el punto central también queda visible en estos dos estados, ya que la mano no lo tapa).

**Pendiente / próximos pasos:**
- Ninguno nuevo — con este cambio se considera cerrado el pedido de "cursor que reacciona por tipo de elemento" de la Parte 3 original del rediseño de login.

---

## 2026-08-10 - Cursor: la mano se rehizo con la silueta clásica de 4 dedos (la de un dedo solo no se entendía)

**Qué se hizo:**
Enzo compartió una referencia visual: el ícono clásico de cursor "mano" (los 4 dedos juntos apuntando hacia arriba, escalonados en altura, con el pulgar aparte) — el que usan Windows/la mayoría de sistemas para el cursor de link/botón. La versión anterior (un solo dedo índice sobre una palma) no se leía con claridad a tamaño real. Se rehizo `CursorManoIndice.jsx` con esa silueta exacta: 4 rectángulos con puntas redondeadas de distinto largo (índice el más alto, meñique el más corto, como una mano real con el índice extendido y el resto ligeramente escalonado) apoyados sobre la palma, más el pulgar rotado a un costado — recoloreado con la paleta del sitio (laton/cobre) en vez del blanco/negro del ícono de referencia. Se recalculó el punto de anclaje (la punta del índice, ahora el dedo más alto y más a la izquierda) para que siga siendo el punto exacto que sigue al cursor real.

**Cómo se probó:**
Playwright + una utilidad de zoom (`sharp`, redimensionado sin suavizado para ver el trazo tal cual) sobre capturas del botón "Ingresar" y el link "¿Olvidaste tu contraseña?" en el login, ambas a tamaño real y ampliadas 4x. Se confirmó que los 4 dedos se distinguen con claridad (separación visible entre cada uno, largos escalonados) y que los estados que no debían cambiar (`default`, `texto`) siguen intactos.

**Por qué:**
- La silueta de 4 dedos es la que el usuario reconoce instantáneamente como "esto es clicable" (es el cursor pointer de toda la vida) — un solo dedo, aunque la intención fuera la misma, no llegaba a leerse como mano a los ~30px de tamaño real.

**Archivos afectados:**
- `src/components/common/CursorManoIndice.jsx` (silueta rehecha, ahora con 4 dedos).
- `src/components/common/Cursor.jsx` (nuevo punto de anclaje: `translateX: -31%, translateY: -4%`, correspondiente a la punta del dedo índice en el nuevo dibujo).

**Pendiente / próximos pasos:**
- Ninguno — Enzo debería revisarlo en su pantalla real y confirmar que el tamaño/velocidad de seguimiento le acomodan.

---

## 2026-08-10 - Cursor: la mano se rehizo desde la geometría real del ícono clásico de Windows (no más formas propias aproximadas)

**Qué se hizo:**
Enzo rechazó las dos versiones anteriores de la mano (un dedo sobre una palma, luego cuatro rectángulos escalonados): "no parece una mano", y pidió buscar una fuente real y replicar el cursor de mano de Windows exactamente, no una aproximación. Se buscó y encontró **"Hand Cursor.svg"** en Wikimedia Commons — el path SVG real del clásico cursor de mano/pointer, con licencia **CC0 (dominio público)**, sin restricciones de uso: https://commons.wikimedia.org/wiki/File:Hand_Cursor.svg

Se tomó ese path exacto (índice extendido, los otros tres dedos curvados, pulgar, contorno curvo real en vez de rectángulos) y se recoloreó a la paleta del sitio: relleno crema (`#ffe6ca`, muy cercano al hueso), contorno oscuro (`#1c1b19`, el negro-barbero del sitio en vez de negro puro) y una sombra propia (una copia del mismo path, en negro al 22% de opacidad, desplazada) — replicando el mismo lenguaje visual de la referencia que mostró Enzo (relleno claro + contorno oscuro + sombra). Se dejó de diferenciar botón/link por color (la idea de "botón en laton, link en cobre" de la iteración anterior se abandona: cambiarle el color rompía la lectura del dibujo) — ahora se diferencian solo por tamaño (el botón escala 1.15x).

Se recalculó el punto de anclaje del ícono (dónde su punta de índice coincide con la posición real del cursor) para esta nueva geometría: `translateX: -31%, translateY: 0%`.

**Cómo se probó:**
Playwright + captura ampliada 8x sin suavizado (para ver el trazo con nitidez, no una imagen borrosa por escalado) sobre el botón "Ingresar" y el link "¿Olvidaste tu contraseña?" del login. Se ajustó el punto de anclaje con una prueba dirigida (mover el cursor a una esquina conocida del botón y verificar dónde cae la punta del dedo en la captura) hasta que coincidiera. Se reconfirmaron los estados que no debían cambiar: `default` (punto + anillo), `texto` (barra vertical sobre un input, verificada con zoom) y la desactivación completa en contexto táctil.

**Por qué:**
- Partir de una geometría real (curvas de un dibujo hecho por alguien que sabe dibujar una mano) en vez de aproximarla a mano con rectángulos: dos intentos propios ya habían fallado en leerse como mano — el problema no era el color ni el tamaño, era que las curvas de una mano real no se pueden aproximar bien con formas rectangulares simples.
- CC0 (dominio público): se puede usar, modificar y recolorear libremente sin atribución obligatoria — no es un ícono de una librería con licencia restrictiva ni un asset de otro producto.
- Se abandonó la diferenciación de color botón/link: mantener la fidelidad visual al pedido explícito de Enzo pesó más que la diferenciación sutil que se había agregado antes — se puede reintroducir más adelante si hace falta, pero no a costa de que la mano se vea "distinta" del dibujo pedido.

**Archivos afectados:**
- `src/components/common/CursorManoIndice.jsx` (reescrito con el path real de Wikimedia Commons + sombra propia).
- `src/components/common/Cursor.jsx` (color único `#ffe6ca` en vez de laton/cobre; nuevo punto de anclaje).

**Pendiente / próximos pasos:**
- Ninguno — este es el resultado que Enzo pidió explícitamente replicar. Falta su confirmación final en pantalla real.

---

## 2026-08-10 - Cursor: la flecha por defecto también se rehizo desde la geometría real de Windows

**Qué se hizo:**
Mismo criterio que con la mano (ver entrada anterior): Enzo pidió que el cursor por defecto (el que se ve sobre el resto de la página, sin hover de nada) también fuera "igualito al de Windows pero con la paleta de la página" — en vez del punto+anillo abstracto que había desde el inicio de esta feature.

Se buscó y encontró **"Windows 10 Aero arrow 32x32-32.svg"** en Wikimedia Commons — la geometría real de la flecha de cursor de Windows 10, en **dominio público** (una forma geométrica tan simple que no alcanza el umbral de originalidad para tener derechos de autor): https://commons.wikimedia.org/wiki/File:Windows_10_Aero_arrow_32x32-32.svg

Se creó `CursorFlecha.jsx` con ese polígono exacto, recoloreado igual que la mano: relleno hueso (`#f3eee3`), contorno negro-barbero, sombra propia desplazada. Reemplaza por completo al punto+anillo que existía para el estado `default` — ya no queda ningún resto de ese diseño original en `Cursor.jsx` (se simplificó el componente: ya no hay un "punto" separado, cada estado — flecha, mano, barra de texto — es una sola pieza que sigue el cursor con la misma inercia).

**Cómo se probó:**
Playwright + captura ampliada 8x. Se verificó legibilidad sobre fondo claro (hueso) y sobre el panel oscuro del carrusel — el contorno oscuro se sigue viendo bien en ambos porque el relleno claro es lo que aporta el contraste, no el contorno. Se verificó la precisión del punto de anclaje (la punta de la flecha, el "hotspot" tradicional de cualquier cursor de sistema) con una medición directa de `getBoundingClientRect()` contra la posición real del mouse — coincide con menos de 1px de diferencia. Se reconfirmó que los otros dos estados (mano sobre botón/link, barra sobre campo de texto) y la desactivación en táctil sigan funcionando igual que antes.

**Por qué:**
- Misma razón que con la mano: partir de una geometría real en vez de aproximarla — acá el riesgo era menor (una flecha es una forma mucho más simple que una mano), pero la consistencia de criterio importa: si la mano se sacó de una fuente real, la flecha debía seguir el mismo camino.
- Ya no hay un "punto" instantáneo separado del resto: con los tres estados representados por una forma completa (flecha/mano/barra) que sigue el spring, mantener un punto adicional solo para el estado default ya no cumplía ningún propósito y sumaba una capa más a coordinar sin beneficio visual.

**Archivos afectados:**
- Nuevo: `src/components/common/CursorFlecha.jsx`.
- Modificado: `src/components/common/Cursor.jsx` (se quitó el punto+anillo original; la flecha reemplaza al estado `default`).

**Pendiente / próximos pasos:**
- Con esto, los tres estados del cursor (`default`, `boton`/`enlace`, `texto`) están resueltos con geometría real recoloreada. Falta la confirmación final de Enzo en su pantalla.

---

## 2026-08-10 - Cursor: se eliminó el resorte de posición (cero delay) y se unificaron tamaño/color entre la flecha y la mano

**Qué se hizo:**
Enzo reportó que el cursor se sentía con mucho delay, y pidió que la flecha y la mano fueran del mismo tamaño, forma (de dibujo) y color — dos pedidos relacionados, resueltos juntos:

1. **Cero delay posicional.** El cursor usaba un resorte (`useSpring`, con `damping`/`stiffness`/`mass`) para que el anillo/mano/flecha siguiera al mouse con una inercia suave — una decisión explícita de una fase anterior del proyecto ("retraso elástico, nunca 1:1 rígido"). Con las formas ya calcadas de los cursores reales de Windows, ese retraso deja de sentirse como una decisión de diseño y empieza a sentirse como lag. Se sacó el resorte por completo: ahora los tres estados (flecha, mano, barra de texto) siguen la posición real del mouse (`x`/`y`, los motion values que ya traía) sin ningún suavizado — igual de instantáneo que el cursor nativo del sistema, porque literalmente se están replicando esos cursores.
2. **Mismo tamaño y color en flecha y mano.** La mano (`CursorManoIndice.jsx`) tenía un `viewBox` heredado del archivo original de Wikimedia con mucho margen vacío alrededor del dibujo (la mano ocupaba solo ~55% del ancho del cuadro) — a igual tamaño de contenedor que la flecha (que sí ocupa casi el 100% de su propio `viewBox`), la mano se veía notoriamente más chica. Se recortó el `viewBox` de la mano a su contenido real (medido con `getBBox()` sobre el path, no a ojo) para que ambas formas rindan al mismo tamaño visual dentro del mismo contenedor (`w-7` para las dos). Los colores también se unificaron: antes la mano usaba un crema tomado literalmente del archivo de referencia (`#ffe6ca`) y la flecha ya usaba hueso (`#f3eee3`) — ahora ambas usan exactamente `#f3eee3` (hueso) de relleno y `#1c1b19` (negro-barbero) de contorno, los tokens reales de la paleta del sitio, no un color de otro lado.

**Cómo se probó:**
- **Medición de lag real, no solo percepción**: un loop de `requestAnimationFrame` leyó en cada frame la posición renderizada del cursor (parseando su `transform: translate()`) contra la última posición real del mouse, durante un movimiento rápido y continuo (40 puntos en zigzag). Resultado: diferencia máxima de **0.0005px** — ruido de punto flotante, no lag real.
- **Precisión del punto de anclaje de la mano** tras recortar su `viewBox`: se repitió la medición directa contra `getBoundingClientRect()` — la punta del índice quedó a menos de 2px de la posición real del cursor.
- **Comparación visual lado a lado** (capturas ampliadas 6x sin suavizado) de la flecha sobre fondo vacío y la mano sobre el botón "Ingresar": mismo tamaño aparente, mismo relleno, mismo contorno.
- Se reconfirmó que la barra de texto sobre un input y la desactivación completa en contexto táctil sigan funcionando.
- Playwright instalado y desinstalado como dependencia temporal, de nuevo.

**Por qué:**
- El resorte suave fue una decisión correcta cuando el cursor era un punto y un anillo abstractos — ahí un poco de inercia se sentía "diseñado". Con formas que imitan cursores reales del sistema, la comparación mental del usuario cambia: espera que se comporten como cursores reales, y un cursor real no tiene delay. Mantener el resorte ahí ya no aportaba sensación de cuidado, aportaba sensación de lag.
- Medir el recorte del `viewBox` con `getBBox()` en vez de ajustarlo a ojo: la diferencia de tamaño percibida no era un problema de la clase CSS (`w-8` vs `w-7`), era que un dibujo tenía mucho margen interno invisible y el otro no — ajustar solo el contenedor sin corregir eso nunca iba a emparejarlos bien.

**Archivos afectados:**
- `src/components/common/Cursor.jsx` (se quitó `useSpring`; los tres estados ahora comparten `x`/`y` directos; mismo ancho de contenedor `w-7` para flecha y mano; color único `#f3eee3`).
- `src/components/common/CursorManoIndice.jsx` (`viewBox` recortado a `91.37 36.74 279.79 393.05`, el bounding box real del dibujo con margen para el trazo y la sombra).

**Pendiente / próximos pasos:**
- Con esto se consideran resueltos los tres pedidos encadenados sobre el cursor (formas reales, tamaño/color unificado, cero delay). Falta la confirmación de Enzo en su equipo real — la medición de lag se hizo en este entorno, que no tiene el mismo hardware que el suyo, aunque al ser cero-resorte (sin ningún cálculo adicional por frame más allá de aplicar el transform) no debería depender del equipo.

---

## 2026-08-10 - Cursor: corrección de dirección — la flecha se ajustó a la mano, no al revés

**Qué se hizo:**
La entrada anterior había igualado el tamaño/color recortando y recoloreando la **mano** para que se pareciera a la flecha — Enzo aclaró que era al revés: la mano ya estaba bien (era el diseño ya validado), y lo que había que ajustar era la flecha para que tomara sus atributos. Se revirtió por completo el recorte del `viewBox` de la mano (vuelve a `0 0 453.54331 453.54331`, el original de Wikimedia) y su color vuelve a `#ffe6ca`, su contenedor a `w-8`, su punto de anclaje a `translateX: -31%, translateY: 0%`, su escala de hover a 1.15 — exactamente como estaba antes de esa entrada.

Con la mano fija como referencia, se ajustó la flecha: mismo color (`#ffe6ca`, ya no `#f3eee3`), trazo más fino (2.6 → 1.4, para acercarse al peso visual del contorno de la mano) y sombra más discreta (offset de `(2.2,3)` a `(1.3,1.8)`), contenedor reducido de `w-7` a `w-5` — la flecha necesita un contenedor más chico que la mano porque su `viewBox` casi no tiene margen interno (ocupa ~95% del cuadro), mientras que el de la mano sí tiene bastante margen (ocupa ~55-80%) — a igual contenedor, la flecha se veía más grande. Ambos componentes (`CursorFlecha`, `CursorManoIndice`) ahora reciben el color por prop desde la misma constante (`COLOR_CURSOR` en `Cursor.jsx`), para que no puedan volver a desalinearse por accidente.

**Cómo se probó:**
Playwright + capturas ampliadas 6x, incluida una comparación lado a lado (mismo zoom, mismo tamaño de recorte) entre la flecha sobre fondo vacío y la mano sobre el botón "Ingresar" — mismo color, mismo grosor de trazo relativo, tamaño visual comparable. Se remidió la precisión del punto de anclaje de ambas formas contra la posición real del mouse (menos de 3px de diferencia en los dos casos) y se reconfirmó que la barra de texto y la desactivación en táctil sigan funcionando.

**Por qué:**
- La mano era el diseño ya validado por Enzo en una entrada anterior — no había ningún motivo para tocarla; el error fue asumir que había que encontrar un punto medio entre las dos formas en vez de fijar una como referencia y ajustar la otra.

**Archivos afectados:**
- `src/components/common/CursorManoIndice.jsx` (revertido el `viewBox` al original completo).
- `src/components/common/CursorFlecha.jsx` (acepta `color` por prop; trazo y sombra más finos).
- `src/components/common/Cursor.jsx` (color único `#ffe6ca` compartido por ambos; contenedor de la mano de vuelta a `w-8`/`-31%`/`0%`/escala 1.15; contenedor de la flecha a `w-5`).

**Pendiente / próximos pasos:**
- Falta la confirmación de Enzo en pantalla real — esta vez con la mano como punto de partida fijo, no como resultado de un promedio entre ambas formas.

---

## 2026-08-10 - Cursor: ajuste fino de tamaño — flecha y mano midiendo el dibujo real, no el contenedor

**Qué se hizo:**
Enzo notó que la flecha seguía viéndose más grande que la mano tras el ajuste anterior. El cálculo de la entrada previa (basado en estimar a ojo qué porcentaje de cada `viewBox` ocupa el dibujo) resultó impreciso. Se remidió directamente en el navegador con Playwright: `getBoundingClientRect()` sobre el `<polygon>`/`<path>` real ya renderizado (no sobre el contenedor, que incluye margen invisible) — la mano dibujada medía 20.4×29.3px con su contenedor en `w-8` (32px), la flecha medía solo 15.8×24.7px con el suyo en 17px. Se ajustó el contenedor de la flecha a `w-[21px]` (un valor exacto en píxeles, no un paso de Tailwind) hasta que el dibujo real midiera 19.5×30.5px — a menos de un 4% de diferencia con la mano en ambas dimensiones, lo más cerca que se puede llegar sin deformar ninguna de las dos formas (tienen proporciones de alto/ancho ligeramente distintas, así que un tamaño idéntico exacto en las dos dimensiones a la vez no es posible con un escalado uniforme).

**Cómo se probó:**
Medición directa del tamaño dibujado (no del contenedor) de ambas formas, iterando el ancho del contenedor de la flecha hasta minimizar la diferencia. Captura lado a lado al mismo zoom para confirmar visualmente. Se remidió la precisión del punto de anclaje de la flecha tras el cambio de tamaño (los porcentajes de `translateX`/`translateY` son relativos al tamaño del propio elemento, así que en teoría no debían desajustarse — confirmado: menos de 0.1px de diferencia). Se reconfirmó la barra de texto y la desactivación en táctil.

**Por qué:**
- Medir el `viewBox` a ojo (qué porcentaje del cuadro ocupa el dibujo) no es lo mismo que medir el dibujo ya renderizado en pantalla — la única forma confiable de igualar dos íconos con proporciones internas distintas es medir el resultado final, no las proporciones de origen.

**Archivos afectados:**
- `src/components/common/Cursor.jsx` (contenedor de la flecha: `w-[17px]` → `w-[21px]`).

**Pendiente / próximos pasos:**
- Falta la confirmación de Enzo en pantalla real.

---

## 2026-08-10 - Cursor: tamaño ajustado al estándar real de Windows (32x32 de lienzo, ~16px de dibujo visible)

**Qué se hizo:**
Enzo notó que ambos cursores seguían viéndose grandes comparados con el cursor real de Windows, y pidió específicamente usar el estándar de tamaño de Windows para que el salto entre el cursor nativo y el de la página se note solo en el diseño, no en la escala. Se investigó el estándar real: Windows usa un lienzo de 32×32px para sus cursores desde Windows 3.11 (de ahí que "32x32" sea la referencia que todo el mundo cita), pero el dibujo visible de la flecha dentro de ese lienzo — la tinta real, no el cuadro invisible que la contiene — mide aproximadamente 16px. Es el mismo tipo de diferencia que ya se había encontrado antes entre el `viewBox` de cada ícono y su contenido real.

Se redujeron los contenedores hasta que el dibujo real (medido de nuevo con `getBoundingClientRect()` sobre el trazo, no sobre el contenedor) diera ~16-17px de alto en ambos: flecha de `w-[21px]` a `w-[12px]` (dibujo real: 11.2×17.4px), mano de `w-8` a `w-[19px]` (dibujo real: 12.1×17.4px) — mismo alto casi exacto, ancho a menos de 1px de diferencia.

**Cómo se probó:**
Fuente verificada sobre el estándar de Windows (Microsoft Q&A). Medición directa del tamaño dibujado en pantalla (no del contenedor) con Playwright, iterando hasta acercarse al ~16px real. Captura lado a lado a mayor zoom para confirmar visualmente. Se remidió la precisión del punto de anclaje de ambas formas tras la reducción de tamaño (los porcentajes de `translateX`/`translateY` son relativos al propio elemento, así que no debían desajustarse — confirmado, menos de 2px de diferencia en ambos casos). Se reconfirmó la barra de texto y la desactivación en táctil.

**Por qué:**
- El objetivo explícito era que el cambio entre el cursor nativo y el de la página se note "solo en el diseño", no en el tamaño — eso exige igualar el tamaño de la tinta visible, no el tamaño nominal que todo el mundo asocia a "cursor de Windows" (32px), que en realidad es el lienzo, no el dibujo.

**Archivos afectados:**
- `src/components/common/Cursor.jsx` (contenedor de la flecha: `w-[21px]` → `w-[12px]`; contenedor de la mano: `w-8` → `w-[19px]`).

**Pendiente / próximos pasos:**
- Falta la confirmación de Enzo en pantalla real — la comparación contra el cursor nativo de Windows solo se puede juzgar del todo en su propio equipo, no en este entorno.

---

## 2026-08-10 - Panel superadmin sin login + una barbería de prueba con datos provisorios (localStorage), para trabajar sin Supabase real

**Qué se hizo:**
Enzo quería entrar al panel superadmin (`/admin`) para trabajar ahí, pero dos cosas lo bloqueaban: no hay login funcional contra un backend real todavía, y aunque lo hubiera, no hay ninguna barbería cargada para ver cómo se ve la lista/el detalle/la página pública.

**1. Bypass del login solo en `/admin`.** Se sacó el `<RutaProtegida rolesPermitidos={[ROL_SUPERADMIN]}>` que envolvía las rutas de `/admin` en `AppRouter.jsx`, dejando un comentario explícito de que es temporal y cómo revertirlo. `/panel` y `/panel/precios` no se tocaron — siguen protegidos igual que antes.

**2. Una barbería de prueba, con datos provisorios respaldados en `localStorage`.** Se creó `src/mocks/datosProvisoriosSuperadmin.js`: un pequeño "backend falso" en memoria/localStorage con la misma forma exacta que espera cada hook real (columnas, relaciones embebidas `planes`/`personalizacion`/`servicios`/`barberos`, hasta el RPC de cambio de estado con su historial). Trae una barbería semilla ("Barbería Don Manuel", slug `don-manuel`, estado Activo, plan Equipo, con 3 servicios y 2 barberos) y 3 planes (Solo/Equipo/Estudio, los mismos precios que ya se muestran en la landing).

Se conectó en los 4 hooks que hoy dependen de Supabase para esta parte — `useBarberiasSuperadmin.js` (lista, detalle, crear, cambiar plan, cambiar estado, chequeo de slug), `useHistorialEstados.js`, `usePlanesSuperadmin.js` (solo lectura) y `useBarberiaPorSlug.js` (la página pública) — con una sola bandera compartida, `HAY_BACKEND_REAL`, que revisa si `VITE_SUPABASE_URL` sigue siendo el placeholder de `.env`. Ninguna query real se tocó ni se borró: cada hook simplemente elige entre la función real y la provisoria según esa bandera. **Se autodesactiva sola** apenas `.env` tenga una URL de Supabase real — no hay nada que revertir a mano en el código cuando llegue ese momento.

Los cambios que se hagan desde el panel (cambiar plan, cambiar estado, crear una barbería nueva con el formulario que ya existía) quedan guardados en `localStorage` y sobreviven a recargar la página — no es solo una demo que se resetea sola.

**3. Referencia en CSV (el "Excel" pedido).** `datos-provisorios/{barberias,servicios,barberos}.csv` — abre normal en Excel/Sheets, refleja los mismos datos de la barbería semilla, para que Enzo tenga un respaldo legible fuera del navegador. Incluye un `README.md` explicando con claridad que esto **no se lee automáticamente** — es solo referencia/registro manual; la fuente real que ve la app es el archivo de mocks + `localStorage`, y agregar barberías de verdad se hace desde el propio formulario del panel, no editando el CSV.

**Cómo se probó:**
Playwright (instalado y desinstalado como siempre): la barbería semilla aparece en la lista de `/admin`, su detalle carga con el plan y el historial vacío correctos, cambiar el plan a "Estudio" y recargar la página mantiene el cambio (confirma que `localStorage` persiste), y `/barberias/don-manuel` carga la página pública completa — color de marca, eslogan, dirección, link de WhatsApp, los 3 servicios con su oferta activa/inactiva, y el asistente de reserva mostrando "Elige un servicio" — sin ningún error de consola. `npm run build` y `npm run lint` limpios.

**Por qué:**
- Bandera única (`HAY_BACKEND_REAL`) en vez de un flag manual que alguien tiene que acordarse de apagar: el criterio de activación es un hecho verificable (¿la URL sigue siendo la de ejemplo?), no una decisión que dependa de la memoria de nadie.
- No tocar ninguna query real: si se llega a necesitar ajustar algo del comportamiento real más adelante, el código real sigue ahí intacto, no escondido detrás de la lógica provisoria.
- CSV en vez de intentar que la app lea un Excel de verdad: agregar un parser de `.xlsx` y una capa de importación para algo que se describió como "de momento" habría sido mucho más trabajo del que el pedido necesitaba — la necesidad real era tener un respaldo legible, no una fuente de datos autoritativa alternativa.

**Archivos afectados:**
- Nuevo: `src/mocks/datosProvisoriosSuperadmin.js`, `datos-provisorios/{barberias,servicios,barberos}.csv`, `datos-provisorios/README.md`.
- Modificado: `src/routes/AppRouter.jsx` (bypass de `/admin`), `src/pages/panel/hooks/{useBarberiasSuperadmin,useHistorialEstados,usePlanesSuperadmin}.js`, `src/pages/barberias/hooks/useBarberiaPorSlug.js` (todos con la rama provisoria, sin tocar la real).

**Pendiente / próximos pasos:**
- Esto es explícitamente provisorio — en cuanto haya credenciales reales de Supabase, todo se apaga solo (no hace falta revertir código), pero sigue pendiente ejecutar el SQL real (`supabase/sql/*.sql`) contra ese proyecto y crear ahí las tablas/columnas que hoy solo existen en el código y en este mock.
- El bypass de `/admin` sigue siendo temporal — falta re-envolverlo en `<RutaProtegida rolesPermitidos={[ROL_SUPERADMIN]}>` cuando se retome el login (ver comentario en `AppRouter.jsx`).

---

## 2026-08-11 - Personalización de la página pública: identidad propia por barbería, con vista previa en vivo

**Qué se hizo:**
Enzo preguntó por un editor tipo WordPress (arrastrar y soltar componentes). Se conversó el trade-off: un editor de bloques libres es mucho trabajo y le abre la puerta a que cada barbería rompa el sistema de diseño editorial ya construido. Enzo aclaró que su intención de fondo es que **cada barbería tenga identidad propia** (no que todas se vean iguales) — eso es compatible con un enfoque más acotado: personalización rica (fotos, color, textos) + secciones configurables, dentro de la estructura ya diseñada. Se acordó ir por ahí.

**1. `/panel` (rol admin) ya funciona sin login real.** Mismo criterio que ya se usaba para `/admin`: `AuthContext.jsx` ahora entrega una sesión y un perfil falsos (rol admin, apuntando a la barbería provisoria "Don Manuel") cuando `HAY_BACKEND_REAL` es falso — así que en vez de bypasear el `<RutaProtegida>` de `/panel` (como se hizo con `/admin`), esta vez la protección real queda intacta y funciona sola porque el contexto ya reporta una sesión autenticada válida. Se autodesactiva igual que el resto: apenas haya un Supabase real conectado, deja de entregar la sesión falsa y todo vuelve a depender del login real. De paso, `cerrarSesion()` en `authService.js` ahora es un no-op en modo provisorio (antes tiraba un error de red al intentar cerrar una sesión que no existe).

**2. Datos provisorios extendidos**: `personalizacion` ahora incluye `galeria` (array de imágenes) y `secciones_visibles` (qué secciones opcionales se muestran — hoy solo existe "galeria", pensado para crecer). Nuevas funciones: `obtenerBarberiaParaPersonalizacion` / `guardarPersonalizacionProvisoria`.

**3. Nueva pestaña "Personalización" en `/panel`**, junto a Reservas/Barberos/Servicios/Horarios. El admin puede:
- Subir su logo y fotos para una galería (comprimidas del lado del cliente antes de guardarlas — `src/utils/imagenes.js`, un helper con `<canvas>` que redimensiona a un máximo razonable y exporta JPEG; importante porque en modo provisorio esto vive en `localStorage`, que tiene ~5MB de cuota total — una foto de cámara sin comprimir la agotaría con una sola imagen).
- Elegir su color de marca (`<input type="color">`, ya existía la columna `color_primario`, nunca había UI para editarla).
- Editar eslogan y descripción.
- Reordenar (↑/↓) y quitar fotos de la galería, y decidir si la sección de galería se muestra o no en su página pública.
- Ver todo esto en una **vista previa en vivo**, sin guardar todavía.

**4. La vista previa es literalmente la página real, no una aproximación.** Se sacó el JSX de `PaginaBarberia.jsx` a un componente nuevo, `VistaBarberia.jsx`, que recibe el objeto `barberia` directo por prop (antes solo se leía vía `useOutletContext()`, atado a la ruta pública). Tanto la página pública real como la vista previa del panel renderizan exactamente este mismo componente — si mañana cambia el diseño de la página pública, la vista previa cambia sola con él, nunca se puede desincronizar.

**5. La galería se ve en la página pública de verdad.** `VistaBarberia.jsx` agrega una sección "Galería" (con el mismo `SectionRule` que ya usa el resto del sitio) entre el header y "Reserva tu hora", visible solo si `secciones_visibles` incluye `'galeria'` y hay al menos una foto cargada.

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
- Las 5 pestañas de `/panel` cargan sin errores de página con la sesión provisoria (las que no se mockearon — Reservas/Barberos/Servicios/Horarios — muestran su estado de error ya existente contra Supabase, esperado, no es una regresión).
- Cambiar eslogan/descripción se refleja al instante en la vista previa.
- Subir una foto de 2000×2000 la comprimió a 1200×1200 (confirmado con `naturalWidth`/`naturalHeight` reales, no solo el tamaño del archivo).
- Subir 2 fotos, reordenarlas (↑/↓) y quitar una — verificado que el orden cambia y la cuenta baja correctamente, tanto en el formulario como en la vista previa.
- El logo subido aparece en la vista previa.
- Guardar persiste en `localStorage` (confirmado recargando la página) y la página pública real (`/barberias/don-manuel`) refleja los cambios — se verificó específicamente con el eslogan.
- La sección de galería no aparece si `secciones_visibles` no la incluye o si no hay fotos, aunque el check esté activo (probado ambos casos).

**Por qué:**
- Sesión falsa vía `AuthContext` para `/panel`, en vez de bypasear `RutaProtegida` como se hizo con `/admin`: mantiene la lógica de protección real intacta y probada, en vez de tener dos mecanismos distintos de "saltarse el login" en el código.
- Vista previa = el componente real, no una copia aparte: es la única forma de garantizar que "lo que ves es lo que vas a publicar" sin mantenimiento doble.
- Comprimir imágenes del lado del cliente antes de guardar: en modo provisorio (`localStorage`, sin Storage real de Supabase) es la diferencia entre que la función funcione con varias fotos o se quede sin espacio con la primera.

**Archivos afectados:**
- Nuevo: `src/pages/panel/PanelPersonalizacion.jsx`, `src/pages/panel/hooks/usePersonalizacionAdmin.js`, `src/pages/barberias/components/VistaBarberia.jsx`, `src/utils/imagenes.js`.
- Modificado: `src/context/AuthContext.jsx` (sesión provisoria), `src/services/authService.js` (`cerrarSesion` no-op provisorio), `src/mocks/datosProvisoriosSuperadmin.js` (galería, secciones visibles, nuevas funciones), `src/pages/barberias/PaginaBarberia.jsx` (ahora un wrapper delgado sobre `VistaBarberia`), `src/pages/panel/PanelAdminLayout.jsx` (pestaña nueva), `src/routes/AppRouter.jsx` (ruta nueva), `src/components/common/HoverLink.jsx` (ahora reenvía props extra como `target`/`rel`, necesario para el link "Ver página pública →" que abre en pestaña nueva).

**Pendiente / próximos pasos:**
- Esto es la base de "personalización rica + secciones configurables" — hoy la única sección opcional es la galería. Si se quiere seguir sumando (testimonios, mapa, horarios visibles en la página pública, etc.), el patrón ya está armado: agregar la clave a `SECCIONES_DISPONIBLES`, sumar el campo a `personalizacion`, y agregar el bloque condicional correspondiente en `VistaBarberia.jsx`.
- El reordenamiento de fotos es con flechas ↑/↓, no arrastrar-y-soltar — se decidió así a propósito para evitar sumar una librería de drag-and-drop para una lista corta; si en algún momento se quiere ese gesto, es un cambio acotado a `PanelPersonalizacion.jsx`.
- Cuando haya Supabase real: falta crear la migración para las columnas nuevas de `personalizacion` (`galeria`, `secciones_visibles`) y el bucket de Storage real para las imágenes — hoy son data URLs en `localStorage`, que no es donde deberían vivir en producción.
- Las pestañas Reservas/Barberos/Servicios/Horarios de `/panel` siguen sin datos provisorios (solo se mockeó lo de `/admin` y ahora Personalización) — si se quiere seguir trabajando ahí sin backend real, se puede extender el mismo patrón.

---

## 2026-08-11 - Personalización, ronda 2: tipografía elegible, color de header con contraste automático, y secciones tipadas (no solo galería)

**Qué se hizo:**
Sobre la base de la entrada anterior, Enzo pidió sumar tres cosas: elegir tipografía entre algunas ya evaluadas, cambiar el color del header (no solo el color de marca general), y poder agregar secciones con imágenes "o cosas así" y ordenarlas como quiera cada barbería.

**1. Tipografía de títulos, curada (no cualquier Google Font).** `src/utils/fuentes.js`: 4 opciones (Fraunces —la de siempre—, Playfair Display, Libre Baskerville, Bricolage Grotesque), cada una ya evaluada por calzar con la identidad editorial del sitio. Fraunces se sigue cargando siempre (como hasta ahora); las otras tres se inyectan como un `<link>` de Google Fonts recién cuando alguien las elige — así ninguna barbería que se queda con la fuente por defecto paga el peso de fuentes que no usa. `VistaBarberia.jsx` sobreescribe `--font-display` (la variable de Tailwind que ya usa todo el sitio) en el contenedor de la página, así que todos los títulos de esa barbería cambian de fuente sin tocar ningún componente.

**2. Color del header, con contraste automático.** Antes solo existía "color de marca" (afecta cobre/acentos en toda la página). Ahora también se puede elegir el color de fondo del header en sí. Como el header viene pensado para texto claro sobre fondo oscuro, elegir un color claro (ej. blanco, hueso) rompería la legibilidad — se agregó `luminanciaRelativa()`/`esColorClaro()` a `utils/color.js` (fórmula de contraste WCAG, mismo criterio que ya se había usado para auditar contraste en sesiones anteriores) y `VistaBarberia.jsx` decide solo si el texto del header va en tono claro u oscuro según el color elegido — probado explícitamente con un header casi blanco: el texto pasó a negro-barbero automáticamente, sin que la barbería tenga que pensar en esto.

**3. Secciones tipadas, no solo un interruptor de galería.** Se generalizó `personalizacion.secciones_visibles` (un booleano suelto para "galería sí/no") a `personalizacion.secciones`: un array ordenado de bloques, cada uno con su tipo. Hoy hay dos tipos:
- **Galería**: la fila de fotos horizontal que ya existía.
- **Imagen y texto**: una foto + título + texto — sirve para "Nuestro ambiente", "Nuestro equipo", o lo que cada barbería quiera contar con una imagen.

Desde el panel se puede agregar cualquier cantidad de secciones (de cualquiera de los dos tipos, repetidas las veces que se quiera), editarlas, eliminarlas, y reordenarlas con ↑/↓ — el orden en la lista del panel es el orden real en la página pública. Se migran solas las barberías que ya tenían el shape viejo (`galeria` + `secciones_visibles` sueltos): `normalizarPersonalizacion()`, movida a `src/utils/personalizacion.js` (no vive en el mock — el código real, cuando haya Supabase, también la va a necesitar) reconstruye una sección de galería a partir de esos datos viejos si no encuentra el array nuevo, así nadie pierde lo que ya había guardado.

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
- Elegir "Playfair Display" cambió el `font-family` computado del `<h1>` en la vista previa, y tras guardar, también en la página pública real — confirmado leyendo el CSS computado real, no solo mirando la captura.
- Poner el color del header en un tono casi blanco (`#f5f0e6`) cambió el color del texto a `rgb(28, 27, 25)` (negro-barbero) automáticamente — confirmado leyendo el `color` computado del `<h1>`, no asumido.
- Agregar una sección "Imagen y texto" con título y texto, y una sección "Galería" con una foto, aparecieron ambas en la vista previa con sus reglas de sección (`— Nuestro ambiente`, `— Galería`).
- Reordenar con ↓ cambió el orden real de las secciones en la vista previa (confirmado leyendo el DOM antes/después, no solo la captura).
- Guardado, recarga y visita a la página pública real: la sección nueva y la tipografía nueva aparecen ahí también — el ciclo completo panel → guardar → página pública funciona de punta a punta.

**Por qué:**
- Tipografías curadas y carga diferida: dar la opción sin pagar el costo de performance de cargar 4 familias tipográficas completas en cada visita, cuando la inmensa mayoría se va a quedar con la de siempre.
- Contraste automático en vez de dejarlo a criterio de cada dueño de barbería: es exactamente el tipo de detalle que alguien sin ojo de diseñador puede pasar por alto y terminar con una página ilegible — resolverlo en el código es más confiable que una advertencia de texto.
- `secciones` como array tipado en vez de más booleanos sueltos (uno por sección): escala mejor — agregar un tercer tipo de sección el día de mañana es agregar un `case` en `VistaBarberia.jsx`, no rediseñar el shape de datos otra vez.

**Archivos afectados:**
- Nuevo: `src/utils/fuentes.js`, `src/utils/personalizacion.js`.
- Modificado: `src/utils/color.js` (`luminanciaRelativa`, `esColorClaro`), `src/mocks/datosProvisoriosSuperadmin.js` (secciones tipadas + migración), `src/pages/panel/hooks/usePersonalizacionAdmin.js` y `src/pages/barberias/hooks/useBarberiaPorSlug.js` (columnas nuevas en la query real + normalización), `src/pages/barberias/components/VistaBarberia.jsx` (fuente, contraste de header, render de secciones tipadas), `src/pages/panel/PanelPersonalizacion.jsx` (editor completo de secciones, selector de tipografía, color de header).

**Pendiente / próximos pasos:**
- El patrón para sumar un tercer tipo de sección (testimonios, mapa, horarios visibles, lo que sea) ya está armado: una clave nueva + su bloque de render en `VistaBarberia.jsx` + su editor en el panel.
- Cuando haya Supabase real: la tabla `personalizacion` necesita las columnas `color_header`, `fuente_display` y `secciones` (jsonb) — hoy solo existen en el shape que maneja el código, no hay migración SQL todavía.
- Reordenar sigue siendo con flechas, no arrastrar — se mantiene la misma decisión de la ronda anterior (evitar sumar una librería de drag-and-drop).

---

## 2026-08-11 - Galería: grilla editorial con fotos destacadas, leyendas y lightbox — no más fila plana de miniaturas

**Qué se hizo:**
Enzo probó la pantalla de personalización y reportó no poder ordenar/agrandar las fotos de la galería a gusto — junto con eso, compartió una captura que en realidad mostraba una **versión vieja cacheada** (sin los campos de Tipografía/Color de header de la entrada anterior): se le indicó hacer un refresh forzado, porque el síntoma real no era un bug sino el navegador sirviendo JS viejo tras un reinicio del servidor de desarrollo.

Sobre el pedido real ("que se vea lo mejor posible para el cliente, lo más interactivo posible"), la fila horizontal de miniaturas del mismo tamaño se reemplazó por una **grilla editorial** con tres mejoras:

**1. Fotos que se pueden destacar.** Cada foto de una sección de galería ahora es un objeto (`{ url, tamaño, leyenda }`, no un string suelto) — desde el panel, un checkbox "Destacar (más grande)" por foto la hace ocupar el doble de espacio en la grilla (2 columnas × 2 filas) en vez de una celda simple. Con esto una barbería puede armar una composición real (una foto grande de portada + varias chicas alrededor) en vez de que todas compitan por el mismo tamaño.

**2. Leyenda opcional por foto** — aparece como un texto superpuesto al pasar el mouse (y siempre visible en el lightbox), útil para "Antes / Después", "Nuestro sillón clásico", etc.

**3. Lightbox al hacer click — la pieza de interactividad.** Cualquier foto de la grilla, en el panel o en la página pública real, se puede hacer click y abre en grande sobre un fondo oscuro, con flechas para pasar a la foto siguiente/anterior, navegación por teclado (`←`/`→` cambian de foto, `Esc` cierra) y click afuera de la imagen para cerrar. Nuevo componente `LightboxGaleria.jsx`.

**4. Título editable de la sección** — antes decía "Galería" fijo; ahora cada sección de galería tiene su propio título (ej. "Nuestro trabajo", "Antes y después").

**Migración de datos:** las fotos que ya estaban guardadas como string plano (de antes de este cambio) se migran solas a `{url, tamaño:'normal', leyenda:''}` al leerlas — nadie pierde lo que ya había subido.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Se inyectó a mano en `localStorage` una barbería con el shape **más viejo** (`galeria` de strings sueltos, de antes de la entrada anterior) y se confirmó que se migra sola y se ve en la vista previa, sin perder el eslogan ni la foto.
- Subir 3 fotos, marcar la primera como "Destacar" y confirmar que su elemento en el DOM efectivamente tiene `col-span-2` (no solo a ojo en una captura).
- Agregar una leyenda a una foto, y un título a la sección — ambos aparecen en la vista previa.
- Reordenar con ↑ y confirmar que cambia el orden real en el DOM.
- Abrir el lightbox con click, navegar con `ArrowRight` (sigue abierto, cambió de foto) y cerrar con `Escape` (confirmado que el botón de cerrar deja de existir en el DOM).
- Guardar y repetir la apertura del lightbox directo en la página pública real (`/barberias/don-manuel`) — funciona igual ahí, porque es el mismo componente.

**Por qué:**
- Fotos como objetos (no strings) desde el principio, aunque hoy solo se use `tamaño`/`leyenda`: agregar un atributo más por foto en el futuro (por ejemplo, un recorte específico) es un campo nuevo en el objeto, no otra migración de shape.
- Lightbox con teclado y click-afuera-para-cerrar en vez de solo un botón de cerrar: es el gesto que cualquier visitante ya conoce de otros sitios — no inventar una interacción nueva que alguien tenga que aprender.
- Verificar la migración inyectando el shape viejo de verdad en `localStorage`, no solo confiando en la lógica: es la única forma de probar honestamente que nadie pierde datos con este cambio.

**Archivos afectados:**
- Nuevo: `src/pages/barberias/components/LightboxGaleria.jsx`.
- Modificado: `src/utils/personalizacion.js` (migración de fotos string→objeto, título por defecto), `src/pages/barberias/components/VistaBarberia.jsx` (grilla con `col-span`/`row-span`, integración del lightbox), `src/pages/panel/PanelPersonalizacion.jsx` (editor por foto: leyenda, destacar, reordenar; título de sección).

**Pendiente / próximos pasos:**
- Mismo pendiente de siempre en modo provisorio: cuando haya Supabase real, la columna `secciones` (jsonb) necesita guardar este shape más rico por foto.
- Se le aclaró a Enzo que la captura que mandó era una versión vieja cacheada — vale la pena que, de ahora en más, si algo se ve raro, pruebe con un refresh forzado antes de asumir que es un bug del código.

---

## 2026-08-11 - Personalización: pantalla reorganizada en grupos numerados + secciones colapsables (no más formulario largo sin separación)

**Qué se hizo:**
Enzo reportó "no está tomando los cambios" y que la pantalla estaba "todo muy junto" — no se entendía qué se estaba modificando.

**Sobre "no toma los cambios":** se armó un diagnóstico dedicado (Playwright) reproduciendo exactamente el flujo de un usuario real — editar el eslogan, guardar, hacer un **reload duro** (no navegación de SPA) y verificar tanto el formulario como la página pública real. El ciclo completo funcionó correctamente y sin errores de consola. No se pudo reproducir el problema — todo indica que seguía siendo el mismo síntoma de la entrada anterior (una pestaña con el JS viejo cacheado, ya que el servidor de desarrollo se había reiniciado en algún momento de la sesión). Se le pidió a Enzo confirmar con un refresh forzado y, si persiste, probar en una ventana de incógnito nueva (para descartar cualquier resto de estado en esa pestaña puntual).

**Sobre "todo muy junto":** esto sí era un problema real de diseño de la pantalla, independiente del punto anterior — se había ido acumulando contenido (logo, 2 colores, tipografía, eslogan, descripción, y una lista creciente de secciones con sus propios formularios anidados) en un solo formulario largo sin ninguna separación visual fuerte. Se reorganizó en tres grupos numerados, con el mismo lenguaje que ya usa el resto del sitio para marcar quiebres de sección (`— 01 / Cómo funciona`, etc.):
- **01 Identidad** — logo, color de marca, color del header, tipografía.
- **02 Textos principales** — eslogan, descripción.
- **03 Secciones de la página** — la lista dinámica de secciones.

Dentro del grupo 03, cada sección pasó de estar siempre expandida a ser **colapsable** (acordeón: solo una abierta a la vez) — al agregar una sección nueva se abre sola, el resto queda como una fila resumen (tipo + título + cantidad de fotos) hasta que se hace click para editarla. Esto es lo que resuelve directamente "no se entiende qué estoy modificando": con 2-3 secciones cargadas, antes se veían todos los formularios de fotos superpuestos sin separación; ahora solo se ve expandido lo que se está tocando en ese momento, con un borde cobre marcando cuál es.

También se cambió el editor de fotos dentro de una sección de galería: de una lista vertical de filas completas a una **grilla de tarjetas** (imagen + leyenda + destacar + reordenar, cada una en su propia tarjeta de ~160px) — se ve más como "estoy armando una cuadrícula de fotos" que como una lista de formularios, más parecido al resultado final.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Diagnóstico dedicado del guardado: editar → guardar → **reload duro** → el cambio persiste en el formulario y en la página pública real, sin errores de consola.
- Los 3 grupos numerados están presentes y visualmente separados.
- Agregar una sección nueva la abre automáticamente (confirmado que su campo de título es visible sin click adicional).
- Colapsar con click oculta su contenido; volver a abrir lo muestra de nuevo.
- Tras guardar y recargar, la sección queda colapsada mostrando su resumen correctamente.

**Por qué:**
- Diagnosticar con una prueba real del ciclo completo en vez de asumir dónde estaba el bug: permite decir con confianza "esto funciona" en vez de aplicar un arreglo a ciegas sobre un síntoma que resultó ser de otra causa (caché del navegador) las dos veces anteriores.
- Acordeón (una sección abierta a la vez) en vez de dejar todas expandidas: con 1 sección no hace diferencia, pero con 3+ secciones — el caso real que Enzo va a tener — es la diferencia entre desplazarse por una pantalla larga confusa y ver solo lo que se está editando.

**Archivos afectados:**
- Modificado: `src/pages/panel/PanelPersonalizacion.jsx` (grupos numerados, secciones colapsables tipo acordeón, editor de fotos en grilla de tarjetas). Sin cambios de datos ni de la página pública — es puramente una reorganización de la pantalla de edición.

**Pendiente / próximos pasos:**
- Si "no toma los cambios" sigue pasando después del refresh forzado, lo más probable es que sea algo específico del navegador/pestaña de Enzo (extensión, service worker viejo, etc.) — pedirle que lo confirme en una ventana de incógnito ayuda a aislar si es eso.

---

## 2026-08-11 - Personalización: vista previa real PC/Móvil (con iframe), aviso de cambios sin guardar, y layout separado del contenedor angosto del panel

**Qué se hizo:**
Enzo volvió a reportar "no está tomando los cambios" con capturas mostrando la vista previa (dentro del panel) con una galería de 3 fotos que no aparecía en la página pública real. Se armó un tercer diagnóstico, esta vez replicando el escenario exacto: color de header + 3 fotos + guardar + abrir "Ver página pública" como una **pestaña nueva de verdad** (`target="_blank"`, no navegación en la misma pestaña) — funcionó perfecto, sin errores, la galería y las 3 fotos aparecieron. Con tres diagnósticos limpios seguidos sin poder reproducir el problema, se descarta un bug de código — sigue siendo una pestaña vieja cacheada (se le sugirió a Enzo probar en una ventana de incógnito para aislarlo del todo).

Sobre "está todo muy junto" y el pedido de vista previa PC/Móvil, se hicieron tres cambios:

**1. Aviso explícito de cambios sin guardar.** Se guarda una copia de la última versión guardada (`formGuardado`) y se compara contra el formulario actual — si difieren, aparece un aviso destacado ("Tenés cambios sin guardar — la página pública todavía muestra la versión anterior") justo debajo del link a la página pública. Esto ataca directamente la confusión de fondo entre "lo que veo en la vista previa" y "lo que ve un cliente real" — sin importar si el reporte anterior era caché o no, este aviso hace que la distinción sea imposible de pasar por alto en el futuro.

**2. La vista previa se sacó del layout de dos columnas y ahora es de sangrado completo.** Acá se encontró un problema real (no de datos, de diseño): la pantalla vive dentro de `PanelShell`, que limita el contenido a `max-w-4xl` (896px) — compartido con todas las pestañas del panel. Con el formulario y la vista previa lado a lado en ese ancho, la columna de vista previa nunca superaba ~400px de ancho real, sin importar qué tan grande fuera la pantalla de Enzo — es decir, un modo "PC" ahí nunca iba a poder mostrar un layout de escritorio de verdad (los estilos `md:` de Tailwind necesitan ≥768px para activarse). Se resolvió sacando la vista previa de esa grilla angosta con la técnica estándar de "sangrado completo dentro de un contenedor limitado" (margen negativo al 50% del viewport) — ahora vive en su propia franja de ancho completo, debajo del formulario.

**3. Vista previa PC/Móvil real, no una aproximación.** Como la vista previa ahora vive en un `<iframe>` (`/_preview-barberia`, ruta nueva y aislada, sin layout ni datos propios) en vez de renderizarse directo en la página del panel, cambiar su ancho de contenedor (1022px en "PC", 390px centrado con sombra tipo marco de teléfono en "Móvil") hace que los `md:` de Tailwind respondan de verdad al viewport del iframe — algo que **no** se puede lograr solo achicando un `<div>` (los media queries miran el viewport del documento, no el tamaño de un contenedor cualquiera). El iframe recibe los datos del formulario por `postMessage` en cada cambio, así que sigue actualizándose en vivo mientras se escribe, sin necesidad de guardar.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Tercer diagnóstico limpio del guardado con pestaña nueva real — sin poder reproducir "no se reflejan los cambios".
- El iframe muestra el nombre de la barbería apenas carga (postMessage inicial via `onLoad`).
- Editar el eslogan sin guardar lo refleja dentro del iframe al instante.
- El aviso de "cambios sin guardar" aparece al editar y desaparece tras guardar.
- Medición directa (no a ojo): el documento dentro del iframe mide 390px de ancho real en modo Móvil y 1022px en modo PC — confirmado que son layouts genuinamente distintos, no la misma vista achicada.
- Capturas de ambos modos: en PC el header muestra logo y título en fila; en Móvil, apilados y centrados, con el marco de "teléfono" visualmente distinguible del resto de la pantalla.

**Por qué:**
- Un iframe en vez de un `<div>` con ancho fijo: es la única forma correcta de que los media queries de la página respondan al ancho simulado — un detalle técnico fácil de pasar por alto (un div achicado *se ve* más chico, pero el CSS interno no lo sabe).
- Sangrado completo en vez de ensanchar la columna dentro del layout existente: `PanelShell` es compartido por las 5 pestañas del panel — tocar su ancho ahí habría afectado a Reservas/Barberos/Servicios/Horarios sin que lo pidieran.
- Verificar el ancho real del documento del iframe (no solo mirar una captura) antes de dar el toggle por terminado: la primera versión (columnas lado a lado) parecía funcionar a ojo pero medía solo 360px en "PC" — el mismo error que ya se había visto antes en esta sesión de dar algo por bueno sin medirlo.

**Archivos afectados:**
- Nuevo: `src/pages/panel/PreviewBarberia.jsx`.
- Modificado: `src/routes/AppRouter.jsx` (ruta `/_preview-barberia`), `src/pages/panel/PanelPersonalizacion.jsx` (aviso de cambios sin guardar, layout de sangrado completo para la vista previa, iframe + postMessage + toggle PC/Móvil).

**Pendiente / próximos pasos:**
- Si "no toma los cambios" persiste después de probar en incógnito, ya no sería atribuible a este código — valdría la pena revisar configuración específica del navegador de Enzo (extensiones, políticas de caché).
- El iframe tiene una altura fija (1600px en PC, 900px en Móvil) en vez de ajustarse al contenido real — si una página con muchas secciones queda más alta que eso, el iframe mostrará su propio scroll interno además del scroll del contenedor que lo envuelve. Funciona, pero no es perfecto; se podría mejorar más adelante escuchando la altura real del contenido vía postMessage si hace falta.

---

## 2026-08-11 - Personalización: se eliminan los CSV de prueba, botón "Guardar" al final, aviso de dispositivo móvil — versión final de esta pantalla

**Qué se hizo:**
Enzo volvió a reportar "no se ve nada de los cambios" y esta vez señaló como sospechoso a los archivos CSV de `datos-provisorios/` ("hay un problema en la base de los excel seguramente"). Esos CSV nunca fueron leídos ni escritos por la app — se crearon en una ronda anterior solo como referencia visual de los datos de prueba, y la app siempre guardó todo en `localStorage` real. Como ya eran la sospecha más probable del malentendido (y no cumplían ninguna función), se **eliminaron por completo** (`datos-provisorios/README.md`, `barberias.csv`, `barberos.csv`, `servicios.csv`) para sacar esa fuente de confusión de en medio en vez de seguir explicándola.

Sobre los tres pedidos concretos de esta ronda:

**1. Botón "Guardar cambios" movido al final.** Antes estaba arriba, antes de la vista previa — invitaba a guardar sin haber mirado cómo quedaba. Ahora el `<form>` envuelve todo el flujo (formulario → vista previa PC/Móvil → botón), y el botón + mensaje de resultado quedan como lo último de la pantalla, después de revisar la vista previa.

**2. Aviso de dispositivo móvil.** Se reutilizó el hook ya existente `useIsMobile` (breakpoint 768px, basado en `matchMedia`) para mostrar un aviso descartable arriba de la pantalla cuando se entra a Personalización desde un celular, recomendando usar un computador para tener una vista más clara — esta pantalla tiene bastante contenido para editar y comparar contra la vista previa, algo que en una pantalla chica es más difícil. El cierre del aviso es solo de la sesión de esa pestaña (no se guarda en `localStorage`) — si se recarga la página, vuelve a aparecer, a propósito, ya que sigue siendo cierto que se está en un móvil.

**3. Diagnóstico final del guardado.** Se armó un cuarto diagnóstico (Playwright), el más completo de todos: contexto limpio, edición de eslogan + color + tipografía + una sección de galería con foto real, guardado, inspección directa y cruda de `localStorage`, reload duro, y apertura de la página pública real en una pestaña nueva de verdad. Resultado: **cero errores, todo persiste correctamente en cada paso.** Con cuatro diagnósticos limpios seguidos sin poder reproducir el problema en ninguna ronda, se descarta con alta confianza un bug de código — el guardado en sí nunca fue el problema real.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre — ya se desinstalaron al cerrar esta ronda):**
- Build (`npm run build`) y lint (`npm run lint`) limpios, sin errores de compilación.
- Desktop (viewport 1400px): el aviso de móvil NO aparece.
- Orden vertical confirmado por coordenadas reales (`getBoundingClientRect`): el botón "Guardar cambios" queda por debajo de la sección "— Vista previa".
- Ciclo completo: editar eslogan + color + tipografía + agregar sección de galería con foto → aviso "cambios sin guardar" aparece → vista previa (iframe) refleja todo sin guardar → ancho real del iframe medido en 1022px (PC) y 390px (Móvil) → guardar → aviso desaparece → `localStorage` crudo confirma los 4 campos → reload duro conserva todo → página pública real (pestaña nueva) muestra el eslogan y la sección nuevos.
- Móvil (viewport 390px, `isMobile: true`): el aviso aparece, se puede cerrar con el botón ✕, y vuelve a aparecer tras un reload (comportamiento esperado, no es un bug).
- Cero errores de consola ni de página en ningún escenario.

**Por qué:**
- Eliminar los CSV en vez de seguir aclarando que no se usan: después de dos rondas de confusión sobre ellos, la forma más simple y definitiva de resolverlo era que dejaran de existir — no tienen ninguna función en la app real.
- Aviso de móvil no persistente entre reloads: es información sobre el dispositivo actual, no una preferencia — si se guardara "cerrado" en `localStorage` y Enzo volviera a entrar desde el celular en otro momento, el aviso útil no aparecería cuando sí correspondía.
- Botón al final: coherente con cómo se usa la pantalla en la práctica — se edita, se mira la vista previa (incluyendo el modo Móvil) y solo ahí tiene sentido decidir guardar.

**Archivos afectados:**
- Eliminado: `datos-provisorios/` completo (README + 3 CSV).
- Modificado: `src/pages/panel/PanelPersonalizacion.jsx` (alerta de dispositivo móvil, reordenamiento del `<form>` para que el botón de guardar quede al final, después de la vista previa).

**Estado de esta pantalla (Personalización) al cierre de esta ronda:**
Con este cambio se da por completa la funcionalidad pedida a lo largo de toda esta serie de rondas: identidad de marca (logo, color, tipografía, color de header con contraste automático), textos principales (eslogan, descripción), secciones configurables y reordenables (galería con fotos destacadas/leyendas/lightbox, imagen y texto), vista previa en vivo fiel a la página pública real (mismo componente `VistaBarberia`) con toggle PC/Móvil genuino, aviso de cambios sin guardar, aviso de uso desde un dispositivo móvil, y guardado al final del flujo. No quedan pendientes abiertos de esta ronda — cualquier ajuste futuro sería una funcionalidad nueva, no una corrección.

---

## 2026-08-11 - Equipo de barberos con foto y especialidad, Personalización en dos columnas con vista previa "sticky", y notificación de guardado

**Qué se hizo:**
Enzo pidió tres cosas puntuales, con una captura marcando en rojo el formulario y en verde el panel de previsualización, para que ambos convivan a la vista sin tener que scrollear entre uno y otro:

**1. Barberos con foto y especialidad, mostrados en la página pública.** Hasta ahora la pestaña "Barberos" del panel solo permitía nombre y activo/inactivo — no había forma de mostrar quién es cada barbero al cliente final. Se agregaron dos campos por barbero: una foto (subida y comprimida igual que el logo, vía `archivoAImagenComprimida`) y una especialidad de texto libre (ej: "Fade y diseños a mano"). La página pública ahora tiene una sección nueva **"Nuestro equipo"**, ubicada justo después del encabezado — se arma sola a partir de los barberos activos, con su foto (o su inicial, como fallback, si todavía no subió una) y su especialidad debajo del nombre. No es una "sección" configurable de las que ya existían (galería / imagen y texto) porque los barberos ya son una entidad propia del sistema (con su pestaña, su alta/baja, su límite según el plan) — mezclar ambos conceptos hubiera sido confuso.

De paso, se encontró y corrigió un bug preexistente (no relacionado a lo pedido, pero en la misma pantalla): el hook `useBarberiaAdmin` (usado para mostrar "X / Y según tu plan" en Barberos) nunca tuvo la rama provisoria — intentaba consultar el Supabase real inexistente y fallaba en silencio, así que el badge del límite de plan nunca se mostraba en modo demo. Se le agregó la misma rama `HAY_BACKEND_REAL` que ya tienen el resto de los hooks.

**2. Personalización en dos columnas: formulario a la izquierda, vista previa "pegada" (sticky) a la derecha.** Antes la vista previa vivía debajo de todo el formulario — para comparar un cambio había que escribir, scrollear hacia abajo a mirar, volver a scrollear hacia arriba a seguir editando. Ahora, en pantallas grandes (`lg`, ≥1024px), el formulario y la vista previa van lado a lado dentro de la misma franja de sangrado completo ya usada antes; la columna de la vista previa usa `position: sticky` — mientras se scrollea el formulario (que puede ser bastante largo con varias secciones cargadas), la vista previa se queda fija en pantalla en vez de desaparecer hacia arriba. El botón "Guardar cambios" queda al final del formulario (a la izquierda), ya que ahora la vista previa está siempre visible al lado — no hace falta que esté después de ella. En pantallas chicas (por debajo de `lg`), cae de vuelta a una sola columna (formulario, luego vista previa), coherente con el aviso que ya existe recomendando usar un computador.

Para que el modo "PC" de la vista previa siga siendo un layout de escritorio de verdad sin importar cuánto se angoste la columna en una pantalla más chica (un notebook de 1366px, por ejemplo, deja mucho menos que los 1024px que necesita), el iframe ahora tiene un ancho fijo de 1024px (antes era `w-full`, atado al ancho disponible) — si la columna es más angosta que eso, esa caja scrollea horizontalmente en vez de mostrar un layout mobile disfrazado de "PC".

**3. Notificación de guardado con estado de carga y confirmación.** El mensaje de texto suelto junto al botón ("Cambios guardados.") se reemplazó por una tarjeta flotante (`ToastGuardado`, nueva, en `components/common/`) que aparece abajo a la derecha: muestra un spinner con "Guardando cambios…" mientras la mutación está en curso, y al terminar cambia sola a un check verde con "Cambios guardados" (o una X roja con el error, si falla) — se cierra sola después de unos segundos, sin que haya que ir a buscar el mensaje en la pantalla.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Barberos: se edita la especialidad y la foto de un barbero específico (con locators escopeados por fila, no por índice — el listado se ordena alfabéticamente, así que el orden visual no es el orden de guardado) → persiste en `localStorage` → el otro barbero no se ve afectado. El badge "según tu plan" ahora aparece.
- Página pública (mismo contexto/localStorage que la edición, para probar persistencia real): "Nuestro equipo" aparece con ambos barberos, la foto y la especialidad nueva se ven correctamente.
- Sticky: con una sección de galería cargada (formulario ya largo, caso real), se midió la posición de la vista previa en 7 puntos de scroll entre 0 y 1400px — se mueve junto con el formulario hasta cierto punto y después queda fija en un valor constante durante un rango amplio de scroll (450px a 1400px+), confirmando que el `sticky` engancha y se mantiene, no que "pasa de largo" por casualidad.
- Ancho del iframe siguió midiendo 1024px (PC) y 390px (Móvil) tras el rediseño — el cambio de layout no rompió el toggle.
- Toast: aparece "Cambios guardados" con el check tras guardar, y desaparece solo después de ~2.6 segundos. (El estado "Guardando…" no se llegó a capturar en una prueba automatizada porque el guardado provisorio en `localStorage` es prácticamente instantáneo — sí se dispara en el código antes de la mutación, así que se va a ver apenas haya latencia real, por ejemplo con Supabase conectado.)
- Cero errores de consola ni de página en ningún escenario, incluyendo el fix de `useBarberiaAdmin`.
- Build (`npm run build`) y lint limpios.

**Por qué:**
- Equipo como sección fija (no una "sección" configurable más): los barberos ya tienen su propio ciclo de vida (alta, baja, límite de plan) en otra pestaña — tratarlos como contenido libre habría duplicado esa gestión en dos lugares.
- `sticky` en vez de, por ejemplo, un iframe con `position: fixed`: `sticky` respeta el flujo normal del documento (no se superpone a nada, no necesita lógica de show/hide al hacer scroll) y deja de tener efecto automáticamente cuando el formulario termina, sin código extra.
- Ancho fijo de 1024px en el iframe en vez de `w-full`: la columna derecha ahora comparte espacio con el formulario, así que su ancho real varía según el tamaño de pantalla — sin un ancho fijo, "PC" dejaría de ser un layout de escritorio genuino en notebooks más chicos, el mismo problema que ya se había resuelto una vez con el sangrado completo.
- Toast flotante en vez del texto junto al botón: con el botón ahora en la columna izquierda (que puede quedar fuera de la vista si se scrolleó hacia la derecha... en rigor no aplica en desktop porque no hay scroll horizontal, pero sí es más visible una notificación flotante que un texto que aparece y desaparece en un lugar fijo de la pantalla) — y de paso dejarlo más cerca de un patrón de guardado estándar (loading → confirmación) que un mensaje de texto plano.

**Archivos afectados:**
- Nuevo: `src/components/common/ToastGuardado.jsx`.
- Modificado: `src/mocks/datosProvisoriosSuperadmin.js` (barberos con `foto_url`/`especialidad`, CRUD provisorio de barberos), `src/pages/panel/hooks/useBarberosAdmin.js` (rama provisoria + columnas nuevas), `src/pages/panel/hooks/useBarberiaAdmin.js` (fix: le faltaba la rama provisoria), `src/pages/panel/hooks/usePersonalizacionAdmin.js` y `src/pages/barberias/hooks/useBarberiaPorSlug.js` (columnas nuevas en el select real de `barberos`), `src/pages/panel/PanelBarberos.jsx` (UI de foto + especialidad por barbero), `src/pages/barberias/components/VistaBarberia.jsx` (sección "Nuestro equipo"), `src/pages/panel/PanelPersonalizacion.jsx` (grid de dos columnas, vista previa sticky, ancho fijo del iframe en modo PC, toast de guardado).

**Pendiente / próximos pasos:**
- Ninguno abierto de esta ronda. A futuro, si se agregan muchas más secciones de contenido, la columna del formulario podría eventualmente superar la altura visible de la vista previa por un margen muy grande — el `sticky` sigue funcionando bien en ese caso (la vista previa simplemente queda fija más tiempo), así que no hace falta ningún ajuste adicional.

---

## 2026-08-11 - Personalización: el formulario va pegado al borde izquierdo real, la vista previa se estira a todo el ancho que sobra

**Qué se hizo:**
Enzo marcó de nuevo, sobre la misma captura de antes, que el resultado no era lo que pedía: el grid de dos columnas recién armado estaba centrado dentro de un `max-w-7xl` (1280px) — en una pantalla ancha eso deja espacio muerto libre a ambos lados del contenido, con el formulario empezando bastante más a la derecha del borde real de la página. Lo que pedía era más simple y más aprovechado: formulario pegado a la izquierda (con solo el margen estándar del sitio, no un centrado adicional) y la vista previa estirada para ocupar todo lo que sobra hasta el borde derecho.

Se sacó el `mx-auto max-w-7xl` del grid — ahora ocupa el 100% del ancho disponible dentro de la franja de sangrado completo (que ya iba de borde a borde de la ventana). Como consecuencia, la columna derecha (`minmax(0,1fr)`) pasó a estirarse con la ventana en vez de quedar topada en ~945px. El iframe en modo PC pasó de un ancho fijo de 1024px a `w-full` con un piso de `min-w-[768px]` — se estira con el ancho real de la columna (para que el pedido de "estirada" se note de verdad, no solo la caja contenedora) pero nunca baja de 768px, el mínimo que necesita Tailwind para activar sus estilos `md:` y que "PC" siga siendo un layout de escritorio genuino aunque la ventana sea angosta; si la columna termina siendo más angosta que eso, la caja scrollea horizontalmente en vez de mostrar un layout mobile disfrazado de "PC" (mismo criterio ya aplicado antes en esta pantalla).

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
Se midió el layout en 4 anchos de ventana distintos (1920, 1600, 1366 y 1100px):
- El formulario arranca siempre a 40px del borde izquierdo (el padding estándar del sitio) en los 4 anchos — no se corre hacia la derecha en pantallas grandes.
- El borde derecho de la caja de vista previa queda siempre a ~40px del borde derecho de la ventana (1880/1920, 1560/1600, 1326/1366, 1060/1100) — confirma que se estira con la ventana, sin dejar espacio muerto.
- El ancho real del documento dentro del iframe (modo PC) crece con la ventana — 1310px a 1920px de ancho, 990px a 1600px — y se frena en el piso de 768px en 1366px y 1100px, siempre ≥768 (layout de escritorio genuino garantizado en cualquier tamaño).
- Cero errores de consola en los 4 escenarios. Build y lint limpios.

**Por qué:**
- Sin `max-w` central: el pedido explícito era "aprovechar todo el espacio de la página" — un `max-w-7xl` centrado es exactamente lo contrario, reserva espacio sin usarlo en pantallas más anchas que 1280px.
- `w-full` con piso de 768px en el iframe (en vez de mantener el fijo de 1024px de la ronda anterior): con la columna ya sin tope, dejar el iframe fijo en 1024 hubiera dejado espacio en blanco dentro de la caja de preview en pantallas grandes — contradiciendo "estirada". El piso de 768px es lo mínimo indispensable para que sea realmente un layout de PC, no un capricho arbitrario.

**Archivos afectados:**
- Modificado: `src/pages/panel/PanelPersonalizacion.jsx` (grid sin `max-w`/centrado, iframe en modo PC con `w-full min-w-[768px]`).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Fix: cursor duplicado sobre la vista previa, y el título de Personalización desalineado del formulario

**Qué se hizo:**
Enzo mandó una captura señalando dos problemas puntuales del rediseño de Personalización:

**1. Dos cursores a la vez sobre la vista previa.** El sitio tiene un cursor propio dibujado a mano (`Cursor.jsx`, montado una sola vez para toda la app en `main.jsx`) que sigue al mouse escuchando `pointermove` en `window` y oculta el cursor nativo del sistema (`cursor: none` vía una clase en `<body>`). El problema: el `<iframe>` de la vista previa es un documento aparte — cuando el mouse entra ahí, esta ventana deja de recibir `pointermove` (el evento le llega al documento del iframe, no al padre), así que el cursor propio se queda congelado justo en el borde por donde entró, mientras el cursor nativo del sistema vuelve a aparecer y se mueve con total normalidad *dentro* del iframe (ese documento no tiene la clase que lo oculta). De ahí los dos punteros a la vez.

En vez de intentar sincronizar el cursor propio con un documento aparte (frágil y con más casos borde de los que vale la pena resolver), se desactivó por completo en `/panel` y `/admin`: son pantallas de trabajo del dueño de la barbería, no la experiencia pública de marca — no tiene sentido mantenerlo ahí y punto. Sigue funcionando exactamente igual en las páginas públicas (home, `/barberias/:slug`, `/demo`).

**2. Título "Personalización" desalineado con el formulario.** Con el rediseño de la ronda anterior (formulario pegado al borde izquierdo real), el título y el párrafo de intro se quedaron atrás, todavía viviendo dentro del contenedor angosto y centrado que hereda `PanelShell` — se veían corridos hacia el centro respecto al formulario de abajo. Se movieron el `<h1>`, el párrafo, el aviso de móvil y el aviso de cambios sin guardar dentro de la misma franja de sangrado completo que ya usa el formulario, así que ahora arrancan exactamente en el mismo borde izquierdo.

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
- En `/panel/personalizacion`: tras mover el mouse (incluso sobre el área del iframe), el `<body>` ya no tiene la clase que oculta el cursor nativo (`cursor: auto`, no `none`) — confirma que el cursor propio queda completamente desactivado ahí, sin importar dónde esté el mouse.
- En `/barberias/don-manuel` (página pública): tras mover el mouse, el `<body>` sí tiene la clase y `cursor: none` — confirma que el cursor propio sigue intacto donde corresponde.
- Alineación: la posición horizontal (`x`) del título "Personalización" y del campo "Logo" del formulario miden exactamente lo mismo (40px, el padding estándar del sitio) — ya no hay desalineación.
- Build y lint limpios, cero errores de página/consola.

**Por qué:**
- Desactivar en vez de sincronizar: options como inyectar el mismo cursor dentro del documento del iframe, o escuchar eventos cross-frame, agregan complejidad y casos borde (por ejemplo qué pasa en el instante exacto de cruzar el borde) para un beneficio nulo — un panel administrativo no necesita el cursor de marca.
- Sacar el título del contenedor angosto de `PanelShell` en vez de, por ejemplo, agregarle un margen negativo calculado a mano: usar la misma franja de sangrado completo que ya tiene el formulario garantiza que ambos queden alineados por construcción, no por coincidencia de números.

**Archivos afectados:**
- Modificado: `src/components/common/Cursor.jsx` (se desactiva en rutas `/panel` y `/admin`), `src/pages/panel/PanelPersonalizacion.jsx` (título, intro y avisos movidos dentro de la franja de sangrado completo, alineados con el formulario).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Fix real del cursor: se apaga al instante al entrar al panel, sin esperar a que se mueva el mouse

**Qué se hizo:**
El fix de la ronda anterior (desactivar el cursor propio en `/panel` y `/admin`) tenía un defecto: la desactivación pasaba **dentro** del handler de `pointermove` — es decir, dependía de que el mouse se moviera *después* de entrar a esas rutas para recién ahí darse cuenta de que tenía que apagarse. Si Enzo navegaba al panel y el mouse quedaba quieto (por ejemplo, parado justo sobre la pestaña que acababa de clickear), la clase que oculta el cursor nativo (`tiene-cursor-propio`, heredada de la página anterior, sin que nadie la sacara todavía) se quedaba pegada — resultado: ni el cursor propio (congelado, sin recibir más movimiento) ni el nativo (oculto por la clase vieja) se veían, hasta que el mouse se movía lo suficiente. De ahí el reporte de Enzo: "se queda atrapado" y "si no entro con el mouse a la previsualización no aparece el mouse predeterminado" — dentro del iframe sí había un cursor nativo normal (documento aparte, sin la clase), así que ahí sí se veía algo; afuera, nada, hasta el primer movimiento real.

La causa de fondo era estructural: `<Cursor />` se montaba en `main.jsx`, como hermano de `<AppRouter />` — **fuera** del árbol del router, sin acceso a `useLocation()`. Sin esa información reactiva, la única forma de saber "en qué ruta estoy" era leyendo `window.location.pathname` a mano dentro de un evento, lo cual es inherentemente tardío (depende de que el evento vuelva a disparar).

La solución de fondo: mover `<Cursor />` adentro del árbol de rutas. Se agregó una ruta raíz nueva en `AppRouter.jsx` (`RaizConCursor`, que renderiza `<Cursor /><Outlet /></>`) envolviendo todas las rutas existentes como sus `children` — así `<Cursor />` puede usar `useLocation()` de verdad. Con `pathname` ya reactivo, `activo` (si el cursor propio debe mostrarse) pasa a calcularse en el mismo render en que cambia la ruta, y el `useEffect` que agrega/saca la clase de `<body>` reacciona en el instante — no hace falta ningún movimiento de mouse de por medio.

Efecto colateral bueno, no buscado pero correcto: la vista previa (`/_preview-barberia`) vive en un `<iframe>`, que carga esta misma aplicación (mismo `index.html`, mismo bundle) en su **propio** documento/ventana — con este cambio, ese documento también monta su propia instancia de `<Cursor />`, siguiendo el mouse **local a ese documento**. Como cada instancia (la del panel y la del iframe) escucha su propia ventana, ninguna se congela nunca: dentro del iframe aparece el cursor propio de verdad (no el nativo, no uno pegado) siguiendo el mouse con total normalidad — y como la vista previa muestra la página pública real, tiene sentido que también se vea con el cursor que un cliente real vería ahí.

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
- En home (página pública), tras mover el mouse: cursor propio activo (`cursor: none` en el body, clase presente) — sin cambios respecto a antes.
- Al entrar a `/panel/personalizacion` y medir el estado **inmediatamente**, sin mover el mouse todavía: la clase ya está sacada y `cursor: auto` — confirma que ya no depende de un movimiento posterior.
- Con el mouse dentro del área del iframe de vista previa: el documento del iframe tiene su propia clase activa (`cursor: none` ahí adentro) mientras el documento padre (el panel) se mantiene sin la clase — cada uno independiente, sin interferirse.
- Al sacar el mouse del iframe de vuelta al formulario: el panel se mantiene apagado (sin la clase) — no queda ningún resto prendido por haber pasado por el iframe.
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- Mover `<Cursor />` dentro del router en vez de parchear el timing del evento: la causa real era la falta de acceso a la ruta actual de forma reactiva — cualquier arreglo que siguiera viviendo fuera del árbol del router iba a tener que inventar alguna forma indirecta de detectar la navegación (poll de `window.location`, parchear `history.pushState`, etc.), todas más frágiles y más código que simplemente ponerlo donde `useLocation()` funciona de verdad.
- Dejar que el iframe tenga su propia instancia de cursor en vez de suprimirlo ahí también: al ser un documento separado con su propio mouse local, no tiene el problema de congelamiento que motivó todo esto — y muestra fielmente lo que un cliente real vería en la página pública, que es justamente el objetivo de la vista previa.

**Archivos afectados:**
- Modificado: `src/main.jsx` (se saca `<Cursor />` de acá), `src/routes/AppRouter.jsx` (nueva ruta raíz `RaizConCursor` con `<Cursor /><Outlet /></>` envolviendo todas las rutas), `src/components/common/Cursor.jsx` (usa `useLocation()` en vez de leer `window.location` dentro del handler de `pointermove`).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Vuelta atrás parcial: un solo cursor para todo el sitio (sin excepción de panel), y la vista previa móvil deja de romper la página en un celular real

**Qué se hizo:**
La ronda anterior desactivó el cursor propio en `/panel` y `/admin` para resolver el bug del cursor duplicado sobre el iframe. Enzo aclaró que no era lo que quería: *"no solo en esta parte el mouse perdió su estilo... no quedó un mouse para todo [el sitio]"* — quiere el mismo cursor de marca en absolutamente todas las pantallas, panel incluido, sin excepciones.

Con el cambio de la ronda anterior (mover `<Cursor />` adentro del árbol del router) ya se había resuelto, sin darse cuenta, la causa real del bug original: como la vista previa carga esta misma app en un `<iframe>` (documento aparte, con su propia ventana), esa instancia también termina montando su propio `<Cursor />`, que sigue el mouse **local a ese documento** — nunca se congela, porque nunca depende de eventos que le lleguen desde afuera. La excepción de rutas fue entonces un parche de más, resolviendo con una desactivación total algo que ya no hacía falta desactivar.

Se revirtió la exclusión de `/panel`/`/admin` — el cursor propio vuelve a estar activo en todo el sitio — y en su lugar se resolvió el único problema real que queda: cuando el mouse **cruza el borde** hacia el iframe desde afuera, el cursor del documento padre se queda congelado ahí (porque deja de recibir `pointermove`, sea cual sea la ruta). La solución: escuchar `pointerover`/`pointerout` en la ventana — estos sí se disparan con normalidad al entrar/salir de un elemento `<iframe>` (son eventos de borde del elemento, no de movimiento continuo dentro de él) — y ocultar el cursor del padre (`opacity: 0`, sin animación congelada) mientras el mouse esté sobre el iframe, dejando que la instancia propia del iframe se haga cargo ahí adentro. Como ya no hacía falta saber la ruta actual, se deshizo también el cambio de estructura del router de la ronda anterior (innecesario ahora) — `<Cursor />` volvió a `main.jsx`, como estaba en un principio.

Enzo también señaló, en la misma captura, un problema de responsividad real: en un celular real, la vista previa de Personalización seguía mostrando un "marco de teléfono" de ancho fijo (390px) — el mismo que tiene sentido cuando alguien la mira desde una pantalla grande — pero en la pantalla ya angosta de un celular real, ese ancho fijo no entraba en el espacio disponible (que además tiene el padding lateral del sitio restándole ancho) y desbordaba toda la página horizontalmente. Se resolvió: en un celular real (detectado con el mismo `useIsMobile` que ya se usa para el aviso), el iframe deja de simular un marco de teléfono de ancho fijo y simplemente ocupa el ancho disponible (`w-full`, sin marco) — ya no hace falta simular "cómo se ve en un celular" cuando literalmente se está mirando desde uno.

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
- En `/panel/personalizacion`, con el mouse sobre el formulario: `cursor: none` y la clase que activa el cursor propio están presentes — confirma que volvió a estar activo en el panel.
- Con el mouse dentro del iframe: los 3 divs del cursor propio del padre miden `opacity: 0` (no solo invisibles por estado, medido en el DOM real) — no queda ningún cursor "fantasma" congelado en el borde. El documento del iframe, por su parte, tiene su propio cursor activo y en movimiento normal.
- Al volver a sacar el mouse del iframe al formulario: el cursor del padre se reactiva de inmediato.
- En viewport móvil real (390px): no existe ningún botón "PC" ni "Móvil" (no hay nada para alternar, solo existe un modo) — y el ancho total del documento mide exactamente 390px, igual que cualquier otra pantalla del panel sin iframe (antes medía 417px, 27px de desborde). El iframe ocupa los 343px disponibles dentro del padding de la página, sin desbordar.
- Build y lint limpios, cero errores de consola/página en ningún escenario.

**Por qué:**
- Un cursor para todo el sitio, sin excepciones de ruta: es una decisión de producto de Enzo, no negociable por conveniencia técnica — la solución correcta era resolver el problema real (congelamiento en el borde del iframe), no evitarlo apagando el cursor en secciones enteras.
- `pointerover`/`pointerout` en vez de, por ejemplo, seguir excluyendo la ruta: ataca la causa exacta (cruzar el borde de un iframe específico) en vez de una categoría entera de páginas — un iframe en cualquier otra pantalla futura del sitio también quedaría cubierto automáticamente, sin tener que acordarse de agregarlo a una lista de exclusión.
- Sacar el "marco de teléfono" en el celular real en vez de, por ejemplo, agregarle `overflow-x-hidden` a la página para tapar el síntoma: `overflow-x-hidden` escondería la barra de scroll pero seguiría dejando contenido invisible cortado a los costados — la causa real (un ancho fijo que no entra en el espacio disponible) era evitable directamente.

**Archivos afectados:**
- Modificado: `src/components/common/Cursor.jsx` (se quita la exclusión de rutas; se agrega la detección de entrada/salida del iframe vía `pointerover`/`pointerout`), `src/routes/AppRouter.jsx` y `src/main.jsx` (se revierte la reestructuración de la ronda anterior — ya no era necesaria), `src/pages/panel/PanelPersonalizacion.jsx` (el modo Móvil no usa marco de ancho fijo cuando `esMobile` es real; el toggle PC/Móvil no se muestra en absoluto en ese caso, y el modo queda forzado a Móvil).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Selectores de archivo con diseño propio, y "Nuestro equipo" pasa a ser reordenable desde Personalización

**Qué se hizo:**
Dos pedidos de Enzo:

**1. Los selectores de archivo ("Choose File / No file chosen") ahora tienen diseño propio.** El input nativo de tipo archivo se ve distinto en cada navegador y no admite estilos directos — hasta ahora se mostraba tal cual, en texto crudo sin ninguna relación visual con la paleta del sitio. Se creó `SelectorArchivo` (nuevo, en `components/common/`): un `<label>` estilizado como botón secundario (mismo lenguaje que ya usan los botones "+ Galería de fotos" — borde gris cálido, texto versalita, hover a cobre) que envuelve un input de archivo oculto — clickear el botón en cualquier parte abre el selector, comportamiento nativo del `<label>` sin JS de por medio. Se reemplazaron los 4 selectores de archivo que había en el panel: logo, imagen de una sección "imagen y texto", carga múltiple de fotos de una galería (en Personalización), y foto de barbero (en la pestaña Barberos, que ya tenía un estilo de texto/link y pasó al mismo botón que todos los demás, por consistencia).

**2. "Nuestro equipo" pasa a ser reordenable desde Personalización.** Hasta ahora el orden de los barberos en la sección "Nuestro equipo" de la página pública era simplemente el orden en que venían de la base (alfabético en el query real, de carga en el mock) — no había forma de elegirlo. Se agregó una nueva sección numerada ("03 Nuestro equipo", entre "Textos principales" y "Secciones de la página", que pasó a ser la "04" — el orden de los grupos del panel ahora refleja el orden real de la página pública: header → equipo → secciones → reserva) que lista los barberos activos (traídos de la pestaña Barberos, no duplicados ni editables acá — para eso ya está esa pestaña) con botones ↑/↓ para reordenarlos. El orden elegido se guarda como un array de ids (`orden_equipo`, campo nuevo dentro de `personalizacion`) y se aplica tanto en la vista previa en vivo como en la página pública real, a través de una única función compartida (`ordenarEquipo`, en `utils/personalizacion.js`) que usan ambas — la misma garantía de "la vista previa nunca se desincroniza de la página real" que ya se usa para el resto de esta pantalla. Un barbero recién agregado desde la pestaña Barberos (que todavía no aparece en el orden guardado) no desaparece: se agrega solo al final de la lista.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- El texto nativo "Choose File / No file chosen" ya no aparece en pantalla en ningún selector — confirmado con una búsqueda de ese texto en la página (0 resultados).
- El botón "Seleccionar imagen" del logo mide como una caja real con borde y radio de 6px — no el input crudo del navegador.
- Se subió el orden de "Ignacio Soto" un lugar en el panel → el orden cambió correctamente ahí, se reflejó al instante en la vista previa (iframe, sin guardar todavía) → tras guardar, `localStorage` guardó `orden_equipo: ['prov-barbero-2', 'prov-barbero-1']` (el id de Ignacio primero) → la página pública real, navegada aparte, mostró el nuevo orden (Ignacio antes que Manuel) — confirmado también con una captura de pantalla.
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- Un componente `SelectorArchivo` compartido en vez de estilizar cada input por separado: los 4 casos son exactamente el mismo patrón (label + input oculto) — escribirlo una vez evita que quede alguno con un estilo levemente distinto a los demás.
- `orden_equipo` como array de ids (no un campo en cada fila de `barberos`, ej. un `orden` numérico por barbero): así el orden vive junto con el resto de las decisiones de personalización (mismo objeto, mismo guardado, mismo botón "Guardar cambios"), sin tener que agregar una mutación aparte cada vez que se reordena — coherente con cómo ya funciona el reordenamiento de `secciones`.
- No hacer editable la foto/especialidad desde esta pantalla (solo el orden): esos datos ya tienen un lugar donde se editan (pestaña Barberos) — duplicar esos campos acá hubiera sido dos lugares para la misma información, con riesgo de que se desincronicen.

**Archivos afectados:**
- Nuevo: `src/components/common/SelectorArchivo.jsx`.
- Modificado: `src/utils/personalizacion.js` (`orden_equipo` en `normalizarPersonalizacion`, nueva función `ordenarEquipo`), `src/pages/panel/hooks/usePersonalizacionAdmin.js` y `src/pages/barberias/hooks/useBarberiaPorSlug.js` (columna `orden_equipo` en el select real de `personalizacion`), `src/pages/barberias/components/VistaBarberia.jsx` (`SeccionEquipo` usa `ordenarEquipo`), `src/pages/panel/PanelPersonalizacion.jsx` (sección "03 Nuestro equipo" reordenable, selectores de archivo estilizados), `src/pages/panel/PanelBarberos.jsx` (selector de archivo estilizado).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - "Nuestro equipo" deja de ser un bloque fijo: pasa a ser una sección más, reordenable junto a galerías e imagen-y-texto

**Qué se hizo:**
Enzo pidió poder ordenar TODAS las secciones de Personalización entre sí, no solo el equipo entre sus propios barberos — con un ejemplo concreto: poder mostrar el equipo antes o después de las fotos del trabajo, según lo que cada barbería prefiera. El objetivo de fondo, dicho explícitamente, es que las páginas no terminen todas pareciéndose entre sí — coherente con la idea original de esta pantalla (cada barbería con identidad propia).

Hasta la ronda anterior, "Nuestro equipo" vivía como un bloque fijo, siempre renderizado justo después del encabezado — con orden propio (`orden_equipo`, quién va primero de los barberos) pero sin poder moverse como bloque respecto a las demás secciones (galerías, imagen y texto). Se cambió el modelo: **"equipo" pasó a ser un tipo de sección más**, dentro del mismo array `secciones` que ya usan galería e imagen-y-texto — así que ahora se reordena con las mismas flechas ↑/↓ que ya movían el resto, intercalándose libremente entre ellas.

Como cualquier barbería que ya tenía `secciones` guardadas de antes de este cambio no tenía ninguna de tipo "equipo" todavía, `normalizarPersonalizacion` (compartida entre el panel y la página pública) detecta esa situación y le agrega una al principio de la lista — la misma posición visual que ya tenía el bloque fijo — así nadie pierde su "Nuestro equipo" de la nada por este cambio; de ahí en más, ya se puede mover como cualquier otra sección.

En el panel, el acordeón de "Secciones de la página" ahora tiene tres tipos en vez de dos: al abrir una sección de tipo "Equipo" se ve la misma lista de barberos con sus flechas ↑/↓ que existía antes en su propio grupo aparte (ese grupo se eliminó — ya no hace falta, el equipo vive junto con las demás secciones) — el título de esa sección también se puede editar, igual que el título de una galería. También se agregó un botón "+ Nuestro equipo" para volver a agregarla si alguien la borra a propósito (con "Eliminar", el mismo botón que ya tienen las demás secciones).

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Con `localStorage` recién limpiado (simulando una barbería que nunca tocó esta pantalla), "Equipo" ya aparece en la lista de "Secciones de la página" sin que nadie la agregara — confirma la migración automática. El grupo aparte "Nuestro equipo" ya no existe en la pantalla.
- La página pública, antes de tocar nada, sigue mostrando "Nuestro equipo" como primer bloque después del encabezado — mismo lugar que antes del cambio.
- Se agregó una galería con una foto y se subió un lugar (equivalente a bajar "Equipo" un lugar) → el panel refleja el nuevo orden de tipos (`['Galería', 'Equipo']`) → tras guardar, la página pública real muestra "Nuestro trabajo" (la galería) antes que "Nuestro equipo" — el orden elegido en el panel se respeta exactamente.
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- "Equipo" como sección del mismo array, no un array/orden aparte: es la forma más directa de lograr "que se pueda intercalar con las demás" — con dos listas separadas (una para el orden entre bloques, otra para el orden entre barberos) hubiera hecho falta inventar alguna forma de mezclarlas al renderizar; como sección del mismo array, el orden entre bloques sale gratis de cómo ya funciona `secciones`.
- Migración automática (agregar la sección si no existe) en vez de pedirle a cada barbería que la agregue a mano: nadie debería notar este cambio de arquitectura interno — la página se sigue viendo exactamente igual hasta que alguien decide tocar el orden.
- `orden_equipo` (el orden entre barberos) se mantiene como campo aparte de `personalizacion`, no dentro de la sección: solo puede haber una razón real para tener varias secciones "equipo" (nunca pasa en la práctica) y mover ese campo adentro de la sección hubiera complicado el código sin un beneficio real hoy.

**Archivos afectados:**
- Modificado: `src/utils/personalizacion.js` (`'equipo'` en `TIPOS_SECCION`, migración automática en `normalizarPersonalizacion`), `src/pages/barberias/components/VistaBarberia.jsx` (`SeccionEquipo` se renderiza dentro del `secciones.map`, ya no como bloque fijo aparte), `src/pages/panel/PanelPersonalizacion.jsx` (se elimina el grupo aparte "Nuestro equipo"; el acordeón de "Secciones de la página" gana el tipo "Equipo", con su editor de título y su lista de barberos reordenable adentro).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Fix: doble scroll en la vista previa (el iframe scrolleaba por su cuenta además de la caja que lo contiene)

**Qué se hizo:**
Enzo reportó, con una captura, dos scrollbars visibles en la vista previa de Personalización. La causa: el `<iframe>` tenía una altura FIJA (1600px en modo PC, 900px en Móvil, puesta a mano en una ronda anterior) — con el contenido real de la página ya más largo que eso (sobre todo después de sumar la sección "Nuestro equipo" y galerías con varias fotos), el iframe quedaba con su propio scroll interno para ver el resto, ADEMÁS del scroll de la caja exterior (`max-h-[80vh] overflow-auto`, que existe a propósito para que la vista previa no estire la pantalla entera). Dos scrolls anidados, uno pegado al otro.

Esto ya estaba anotado como una imperfección conocida desde que se armó el iframe + toggle PC/Móvil ("se podría mejorar más adelante escuchando la altura real del contenido vía postMessage si hace falta") — llegó el momento de resolverlo. Se agregó un `ResizeObserver` dentro de `PreviewBarberia.jsx` (la página que vive en el iframe) que mide la altura real del contenido (`document.documentElement.scrollHeight`) cada vez que cambia — nueva foto, texto más largo, cambio de fuente, lo que sea — y la avisa al panel por `postMessage`. `PanelPersonalizacion.jsx` escucha ese aviso y usa esa altura exacta como la altura del `<iframe>` (en vez del valor fijo de antes), con `scrolling="no"` como respaldo. Con el iframe siempre exactamente tan alto como su contenido, ya no tiene motivo para scrollear por su cuenta — el único scroll que queda es el de la caja exterior, el que siempre fue intencional.

Al cambiar entre modo PC y Móvil (que cambia el ancho del iframe y por lo tanto cómo se acomoda el contenido) la altura vieja se descarta de inmediato para no mostrar, por un instante, la altura de un ancho que ya no es el actual — el `ResizeObserver` manda la altura correcta enseguida.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Medido directamente (altura CSS del iframe vs. altura real de su contenido, `scrollHeight`): iguales en todo momento — antes de tocar nada, después de agregar una galería con 3 fotos, cambiado a Móvil, y vuelto a PC.
- Con un cambio más grande (8 fotos agregadas de una), la altura CSS del iframe creció exactamente junto con la altura real del contenido (de 1600px a 1673px) — confirma que se ajusta de verdad al contenido, no un número fijo por casualidad.
- Verificado explícitamente que el documento dentro del iframe nunca queda con su propio scroll (`scrollHeight` nunca supera `clientHeight`) en ningún escenario probado.
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- `ResizeObserver` en vez de recalcular la altura solo al cargar el iframe: el contenido cambia constantemente mientras se edita (cada tecla en un campo de texto, cada foto que se agrega) — un cálculo puntual al montar se desactualiza con el primer cambio.
- Altura dinámica en vez de simplemente agrandar el valor fijo (ej. subir de 1600 a 2000px): cualquier número fijo nuevo iba a quedar corto de nuevo en cuanto la barbería agregara más contenido — la causa real era tener un número fijo, no que el número fuera chico.

**Archivos afectados:**
- Modificado: `src/pages/panel/PreviewBarberia.jsx` (mide y avisa su altura real vía `ResizeObserver` + `postMessage`), `src/pages/panel/PanelPersonalizacion.jsx` (escucha esa altura y la aplica al `<iframe>` en vez de un valor fijo).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Dirección y teléfono de WhatsApp editables desde Personalización, con opción de burbuja flotante en vez del enlace del header

**Qué se hizo:**
Enzo pidió tres cosas relacionadas con el contacto de la barbería, hasta ahora sin ningún lugar donde editarlas desde el panel: la dirección, el teléfono usado para el botón de WhatsApp, y una forma de elegir cómo se muestra ese WhatsApp en la página pública.

**1. Dirección y teléfono de WhatsApp, editables.** Ambos campos ya existían en la base (`barberia.direccion`, `barberia.telefono_whatsapp`) y ya se mostraban en el encabezado de la página pública, pero no había ninguna pantalla del panel donde cambiarlos — quedaban fijos en lo que sea que tuvieran cargado desde el alta de la barbería. Se agregaron como dos campos de texto más en "02 Textos y contacto" (antes "Textos principales" — el nombre cambió para reflejar que ahora también vive el contacto ahí).

**2. Elegir entre el enlace de siempre o una burbuja flotante.** Se agregó un campo nuevo, `estilo_whatsapp` (`'enlace'` por defecto, o `'burbuja'`), con un toggle de dos botones (mismo lenguaje visual que el toggle PC/Móvil de la vista previa). En `'enlace'` (el comportamiento de siempre) se ve el texto "Escribir por WhatsApp" junto a la dirección, en el encabezado. En `'burbuja'` ese texto desaparece del encabezado y en su lugar aparece un botón circular fijo en la esquina inferior derecha, visible en toda la página pública (no solo en el encabezado) — con el color de marca de la barbería (`--color-cobre`) en vez del verde tradicional de WhatsApp, para no salirse de la paleta que cada barbería ya eligió. Son mutuamente excluyentes: nunca se muestran los dos a la vez.

**Cómo se probó (Playwright, instalado y desinstalado como siempre):**
- Los campos nuevos (Dirección, Teléfono de WhatsApp, el toggle) aparecen en el panel.
- Editar la dirección y el teléfono se refleja al instante en la vista previa, sin guardar todavía.
- Cambiar a "Burbuja flotante" hace desaparecer el enlace de texto del encabezado en la vista previa y aparece la burbuja — confirmado también dentro del iframe.
- Tras guardar, la página pública real: muestra la dirección nueva, no muestra el enlace de texto, y sí muestra la burbuja — con un `href` de WhatsApp correctamente armado a partir del teléfono nuevo (`https://wa.me/56987654321?text=...`, normalizado a partir de "+56 9 8765 4321").
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- Dos campos en la barbería (no dentro de `personalizacion`) en vez de moverlos: ya vivían ahí y ya los usa el flujo de reserva/booking en otras partes de la página — moverlos hubiera significado tocar más código del necesario para lo que se pidió (poder editarlos, no reubicarlos).
- Burbuja con el color de marca en vez del verde de WhatsApp: WhatsApp es reconocible por la forma (círculo, ícono, posición fija en la esquina) sin necesidad de su verde característico — usar ese verde específico hubiera sido la primera excepción a la paleta del sitio desde que se armó esta pantalla.
- Mutuamente excluyentes (no "mostrar ambos"): fue explícito en el pedido — dos formas de llegar al mismo WhatsApp en la misma página es redundante, no una mejora.

**Archivos afectados:**
- Modificado: `src/utils/personalizacion.js` (`estilo_whatsapp` en `normalizarPersonalizacion`), `src/mocks/datosProvisoriosSuperadmin.js` (guarda `direccion`/`telefono_whatsapp` en el mock provisorio), `src/pages/panel/hooks/usePersonalizacionAdmin.js` y `src/pages/barberias/hooks/useBarberiaPorSlug.js` (columna `estilo_whatsapp` en el select real; `direccion`/`telefono_whatsapp` correctamente separados hacia la tabla `barberias` al guardar), `src/pages/barberias/components/VistaBarberia.jsx` (nuevo componente `BurbujaWhatsApp`; el enlace del encabezado se oculta cuando el estilo elegido es burbuja), `src/pages/panel/PanelPersonalizacion.jsx` (campos de Dirección/Teléfono, toggle de estilo, grupo renombrado a "Textos y contacto").

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Fix real del "doble scroll" (afectaba a la burbuja de WhatsApp) + burbuja con color, tamaño y efecto de pulso

**Qué se hizo:**
Enzo reportó que la burbuja de WhatsApp (agregada la ronda anterior) "rompía" la vista previa, y pidió tres mejoras más: poder agrandarla (la encontró muy chica), poder elegirle su propio color, y darle un efecto de "pulso" flotante.

**La causa real del "rompe la página" — encontrada al investigar, no dicha por Enzo:** el fix del doble-scroll de la ronda anterior (hacer que el `<iframe>` de la vista previa creciera exactamente a la altura de su contenido, sin scroll propio) tuvo un efecto secundario no previsto: un elemento con `position: fixed` se ancla al *viewport* del documento donde vive — y si ese documento (el de adentro del iframe) nunca scrollea porque mide exactamente lo que su contenido, su "viewport" pasa a ser el documento COMPLETO, no lo que se ve en pantalla. Resultado: la burbuja quedaba pegada al final de todo el contenido (después del footer) en vez de flotar visible mientras se scrollea la vista previa — exactamentente lo que "rompe la página" describe.

Se revirtió esa parte del fix anterior: el `<iframe>` de la vista previa vuelve a tener una altura FIJA (`80vh`, antes eran 1600px/900px separados por modo) y scrollea por dentro si el contenido es más alto — como una ventana de navegador real. Se sacó el `<div>` exterior que scrolleaba por fuera (ya no hace falta: con un solo elemento que scrollea, no hay contra qué desincronizarse) y se eliminó por completo el mecanismo de `ResizeObserver` + `postMessage` que medía la altura real del contenido (se había armado la ronda pasada para el problema de doble-scroll, que ahora se resuelve distinto). Con el iframe scrolleando de nuevo por su cuenta, el `position: fixed` de la burbuja vuelve a anclarse a lo que se ve en pantalla, como en cualquier navegador real — y de paso, esto es lo que hace que la vista previa se sienta como una ventana real en vez de una página sin límites.

**Las otras tres mejoras, todas en la burbuja:**
- **Tamaño**: tres opciones (Chica/Mediana/Grande — 48px/56px/72px), con botones tipo toggle, mismo lenguaje que el resto de los controles de esta pantalla.
- **Color propio**: un selector de color más (mismo patrón que "Color de marca"/"Color del header") — sin elegir nada, sigue usando el color de marca de la barbería, como antes.
- **Efecto de pulso**: un aro que se expande y se desvanece detrás del botón (`animate-ping`, ya viene con Tailwind) — el mismo lenguaje visual que ya usan las burbujas de chat de cualquier sitio, para que se note que es interactivo sin tener que explicarlo.

**Cómo se probó (Playwright + sharp, instalados y desinstalados como siempre):**
- Con una galería de 6 fotos agregada (para que el contenido real sea más alto que la ventana de la vista previa): el documento mide 1673px de alto pero el viewport del iframe solo 800px — confirmado que scrollea por dentro.
- Medido la posición de la burbuja ANTES y DESPUÉS de scrollear 400px dentro del iframe: exactamente la misma posición (`top: 724` en ambos casos) — confirma que el `position: fixed` quedó pegado al viewport visible, no al final del documento.
- Cambiar el color a un valor custom y el tamaño a "Grande": se refleja en la vista previa (72×72px, color aplicado) y persiste igual en la página pública real tras guardar.
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- Volver a un alto fijo con scroll interno (en vez de seguir ajustando la altura al contenido): es la única forma de que `position: fixed` funcione como se espera dentro de un iframe — un iframe sin scroll propio nunca va a tener un "viewport visible" distinto de "todo el documento", sin importar qué tan bien se mida la altura.
- Tamaños predefinidos (Chica/Mediana/Grande) en vez de un campo numérico libre: alcanza para lo que se pidió ("demasiado pequeño, poder agrandarlo") sin la complejidad de validar un número arbitrario que podría quedar ilegible o gigante por error.
- `animate-ping` de Tailwind en vez de una animación armada a mano: es exactamente el efecto pedido ("como con pulsaciones"), ya viene incluido, sin sumar código de animación nuevo para algo que el framework ya resuelve.

**Archivos afectados:**
- Modificado: `src/pages/panel/PreviewBarberia.jsx` (se sacó el `ResizeObserver`/aviso de altura), `src/pages/panel/PanelPersonalizacion.jsx` (iframe con altura fija `80vh` y scroll propio, sin caja exterior con su propio scroll; UI de color/tamaño de la burbuja), `src/utils/personalizacion.js` (`whatsapp_color`/`whatsapp_tamano` en `normalizarPersonalizacion`), `src/pages/barberias/components/VistaBarberia.jsx` (`BurbujaWhatsApp` con tamaño/color configurables y aro de pulso), `src/pages/panel/hooks/usePersonalizacionAdmin.js` y `src/pages/barberias/hooks/useBarberiaPorSlug.js` (columnas nuevas en el select real).

**Pendiente / próximos pasos:**
- Ninguno.

---

## 2026-08-11 - Fix: el cursor de la vista previa se quedaba prendido al salir de ella (avisado por postMessage, no por esperar un evento del navegador)

**Qué se hizo:**
Enzo volvió a ver el cursor duplicado — esta vez con una idea concreta de cómo arreglarlo: que el cursor de adentro de la vista previa desaparezca al salir de ella, y solo vuelva a aparecer al pasar el mouse por encima. Esa es exactamente la pieza que faltaba.

El cursor de adentro del iframe (una instancia propia de `<Cursor />`, corriendo en ese documento aparte — ver la entrada de la ronda anterior) escuchaba `pointerleave` en su propia ventana para ocultarse solo al salir. En la práctica, ese evento no siempre llega apenas el mouse cruza directo del iframe al documento padre — así que el cursor de adentro podía quedar prendido un instante (o quedarse prendido del todo) justo cuando el cursor del panel se vuelve a mostrar, encimados los dos a la vez.

En vez de seguir dependiendo de que el iframe se dé cuenta solo, ahora el PADRE (que sí sabe con certeza, vía `pointerout`, el instante exacto en que el mouse deja el elemento `<iframe>`) le manda un aviso directo por `postMessage` en ese momento — "el mouse ya no está sobre vos" — y el cursor de adentro se oculta al toque, sin esperar a que le llegue su propio evento. No hace falta el aviso contrario ("volviste a entrar"): el movimiento real del mouse dentro del iframe ya lo revela solo, apenas hay el primer `pointermove` genuino ahí adentro.

**Cómo se probó (Playwright, instalado y desinstalado como siempre; se reinició el servidor de desarrollo de cero para descartar cualquier resto de tantas rondas de recarga en caliente):**
- Con el mouse recién movido hacia adentro de la vista previa: el cursor del panel mide opacidad 0 (oculto) y el de adentro del iframe tiene alguna opacidad > 0 (visible) — correcto.
- Con el mouse recién sacado de la vista previa (medido a los 150ms, a propósito corto, para que el aviso tenga que ser instantáneo y no "eventualmente correcto"): el cursor de adentro del iframe ya mide opacidad 0 en los tres — confirma que se oculta al toque, no después de un rato.
- Medido de nuevo 400ms más tarde: se mantiene oculto — no es un parpadeo que se prende solo.
- Cero errores de consola/página. Build y lint limpios.

**Por qué:**
- Avisar desde el padre en vez de confiar en que el iframe detecte su propia salida: el padre YA tiene la fuente de verdad más confiable (el mismo `pointerout` que ya usa para ocultar su propio cursor) — reusarla para avisarle al iframe es más directo que esperar a que un evento de navegador, con comportamiento no 100% uniforme entre navegadores en el borde de un iframe, se dispare por su cuenta.
- Sin aviso de "volviste a entrar": agregarlo hubiera sido lógica de más para un caso que el `pointermove` real ya cubre solo — el mouse moviéndose de verdad adentro del iframe siempre va a disparar ese evento ahí.

**Archivos afectados:**
- Modificado: `src/components/common/Cursor.jsx` (el padre avisa por `postMessage` al salir de un `<iframe>`; nuevo listener que oculta el cursor propio al recibir ese aviso).

**Pendiente / próximos pasos:**
- Si Enzo sigue viendo el cursor duplicado después de este cambio, probar primero en una pestaña nueva o con un refresh forzado — la pestaña donde lo vio venía de muchas rondas de recarga en caliente (HMR) durante esta misma sesión de trabajo, y no se puede descartar por completo que algo de ese historial quedara pegado en esa pestaña puntual.

---

## 2026-08-11 - Panel propio para barberos (reservas, horarios y servicios) + el asistente de reserva elige primero al barbero

**Qué se hizo:**
La más grande hasta ahora: Enzo pidió que el asistente de reserva público elija primero al barbero (no el servicio) — porque cada barbero puede ofrecer cosas distintas — y que los barberos tengan su propio panel para ver/administrar sus horarios, reservas y servicios, con un interruptor que el dueño puede prender por barbero para darle servicios y precios propios en vez de los compartidos de la barbería.

**Investigación previa:** antes de tocar nada se revisó a fondo cómo estaba armado hoy el asistente de reserva, el modelo de datos (mock y los `select` de Supabase ya existentes en el código, aunque no haya backend real conectado), el panel de barbero que ya existía (`/panel/precios`, solo dejaba tocar precios del catálogo compartido) y los paneles del dueño (Reservas/Servicios/Horarios). Encontrado clave: el cálculo de horarios disponibles YA es 100% por barbero (`horarios_disponibles.barbero_id`, `reservas.barbero_id`) — buena base para invertir el orden sin tocar esa lógica. Lo que no existía en ningún lado era una relación entre `servicios` y `barbero_id`, ni un flag de "catálogo propio" en `barberos`.

Con eso se le presentaron a Enzo dos decisiones de producto (no técnicas) antes de empezar:
1. Al activar "servicios propios" por primera vez, ¿arranca vacío o con una copia editable del catálogo compartido? → **copia editable** (menos trabajo inicial para el barbero).
2. Como no hay backend real conectado, la sesión de prueba siempre entra como dueño — ¿agregar un selector temporal "Ver como" para poder probar el panel de barbero en este entorno? → **sí**.

**1. Asistente de reserva: Barbero → Servicio → Horario → Datos** (antes era Servicio → Barbero). Con el barbero elegido primero, el paso de Servicio se filtra a lo que ese barbero realmente ofrece: si no tiene catálogo propio, ve el catálogo compartido de la barbería (como todos, comportamiento de siempre); si lo tiene, ve solo el suyo. Con un solo barbero activo (el caso más común) ese paso se sigue saltando solo — pero el filtrado de servicios se sigue aplicando igual, no depende de que se muestre el paso.

**2. "Servicios propios" por barbero.** Nuevo interruptor en la pestaña "Barberos" del dueño, junto al de activar/desactivar — al prenderlo, ese barbero pasa a tener su PROPIO catálogo (una copia inicial del compartido, después independiente); al apagarlo, vuelve a usar el compartido sin perder lo que tenía armado (se guarda, no se borra, por si se reactiva más adelante).

**3. Panel de barbero, expandido.** Antes era una sola pantalla ("Mis precios", solo editar precio/oferta del catálogo compartido). Ahora es un panel con tres pestañas, en `/panel/barbero` (antes `/panel/precios`):
   - **Reservas**: solo las suyas, con el mismo botón de cancelar que ya tiene el dueño.
   - **Horarios**: los suyos, con la misma edición por bloques de día que ya tenía el dueño (sin el selector de "elegir qué barbero", porque siempre es él mismo).
   - **Servicios**: si NO tiene catálogo propio, ve el compartido y solo puede tocar precio/oferta (como antes). Si SÍ lo tiene, tiene el mismo CRUD completo que tiene el dueño sobre el compartido — crear, editar, publicar/ocultar.

**4. Selector temporal "Ver como" (Dueño / Barbero).** En la barra superior del panel (solo visible sin backend real) — alterna entre el perfil de dueño y el de cualquiera de los barberos ya cargados, guardado en `localStorage`, así Enzo puede probar y mostrar ambos lados del panel sin que exista login real todavía. Se autodesactiva junto con el resto del modo provisorio en cuanto haya un backend real conectado.

**Deuda técnica resuelta de paso:** los hooks de Reservas/Servicios/Horarios del dueño, el panel de barbero, y el asistente de reserva público (fuera del caso especial de la barbería `/demo`) nunca tuvieron la rama `HAY_BACKEND_REAL` — pegaban contra el Supabase real inexistente y fallaban en este entorno, igual que ya había pasado antes con otros hooks. Se les agregó esa rama a los seis, y se sumaron `horarios_disponibles` y `reservas` al mock provisorio como sus propias listas (antes no existían ahí en absoluto para una barbería normal, solo para la demo) — así que además de la funcionalidad nueva, **el asistente de reserva público y los 3 paneles de gestión (dueño) ahora funcionan de verdad en este entorno sin backend real**, cosa que antes no pasaba.

**Cómo se probó (Playwright, instalado y desinstalado como siempre, con el servidor de desarrollo reiniciado de cero para evitar cualquier resto de tantas rondas de recarga en caliente):**
- Flujo público completo: "Elige un barbero" es el primer paso → se elige a Manuel Rojas → "Elige un servicio" muestra el catálogo compartido → se elige "Corte clásico" → "Elige día y hora" muestra 4 horas disponibles (el seed de horarios ya cargado) → se completan los datos y se confirma → "¡Reserva confirmada!" con el resumen correcto.
- Panel del dueño: se activa "Servicios propios" para Manuel Rojas → se clonaron correctamente sus 3 servicios (con ids nuevos y `barbero_id` puesto) → el texto cambia a "Tiene sus propios servicios y precios".
- Selector "Ver como" → Barbero: Manuel Rojas → redirige a `/panel/barbero/reservas`, con las 3 pestañas nuevas visibles.
- Pestaña Servicios del barbero: muestra su catálogo PROPIO (los 3 clonados), editable con CRUD completo.
- Pestaña Horarios del barbero: muestra los 6 bloques del seed (lunes a sábado, 10:00–19:00).
- Pestaña Reservas del barbero: aparece la reserva creada en el paso público, con los datos correctos del cliente.
- Vuelto a "Ver como" Dueño: la bandeja de reservas del panel admin muestra la misma reserva, con "Manuel Rojas" como barbero.
- Repetido el flujo público desde cero: al elegir a Manuel Rojas ahora se le ofrece su catálogo PROPIO (ya no el compartido) — confirma que el filtro por `usa_catalogo_propio` funciona en ambas direcciones.
- Cero errores de consola/página en los 11 puntos verificados. Build y lint limpios.

**Por qué:**
- Investigar el código existente antes de tocar nada (en vez de asumir el modelo de datos): el hallazgo de que horarios/reservas ya eran por barbero cambió el alcance real del trabajo — sin esa base, invertir el orden del asistente hubiera sido mucho más grande.
- Copia editable al activar servicios propios (no vacío): así lo pidió Enzo explícitamente, y tiene sentido de negocio — un barbero no debería quedarse sin poder cobrar nada mientras arma su catálogo desde cero.
- No borrar los servicios propios al desactivar: si el dueño prueba a activar/desactivar mientras decide, el barbero no pierde el trabajo de armar su catálogo por una decisión reversible.
- Selector "Ver como" en vez de simplemente no poder probarlo: sin esto, toda esta funcionalidad hubiera quedado sin verificar de verdad en este entorno — se autodesactiva solo, mismo criterio que ya se usa en todo el resto del modo provisorio.

**Archivos afectados:**
- Nuevo: `src/pages/panel/PanelBarberoLayout.jsx`, `PanelBarberoReservas.jsx`, `PanelBarberoHorarios.jsx`, `PanelBarberoServicios.jsx`.
- Eliminado: `src/pages/panel/PanelBarbero.jsx` (reemplazado por los 4 anteriores).
- Modificado: `src/mocks/datosProvisoriosSuperadmin.js` (`horarios_disponibles` y `reservas` como tablas propias, `barbero_id` en servicios, `usa_catalogo_propio` en barberos, perfil provisorio de barbero), `src/context/AuthContext.jsx` y `src/components/panel/PanelShell.jsx` (selector "Ver como"), `src/utils/roles.js` (`/panel/precios` → `/panel/barbero`), `src/routes/AppRouter.jsx` (rutas nuevas del panel de barbero), `src/pages/barberias/components/AsistenteReserva.jsx` + `PasoBarbero.jsx` + `PasoServicio.jsx` (orden invertido, filtrado de servicios), `src/pages/panel/hooks/useServiciosAdmin.js`, `useServiciosPanel.js`, `useHorariosAdmin.js`, `useReservasBandeja.js`, `useBarberosAdmin.js` (rama provisoria + columnas nuevas + mutaciones de catálogo propio), `src/pages/barberias/hooks/useHorariosDisponibles.js`, `useReservasDelDia.js`, `useCrearReserva.js` (rama provisoria más allá del caso demo), `src/pages/panel/PanelBarberos.jsx` (interruptor de catálogo propio).

**Pendiente / próximos pasos:**
- Ninguno funcional. A futuro: si se agregan muchos barberos con catálogo propio, podría convenir un indicador visual en la pestaña "Servicios" del dueño aclarando que ese barbero tiene su propio catálogo aparte (hoy solo se ve desde "Barberos") — no se pidió, no se hizo.

---

## 2026-08-11 - Fix: el interruptor de "servicios propios" no cambiaba nada real, y guardado explícito en vez de automático en el catálogo del barbero

**Qué se hizo:**
Enzo probó el interruptor de la ronda anterior y notó el problema de fondo: estuviera prendido o apagado, el barbero igual podía modificar los servicios (antes, con el interruptor apagado, todavía se le dejaba tocar precio y oferta del catálogo compartido — el mismo comportamiento de siempre, previo a que existiera este interruptor). Si "apagado" y "prendido" terminan permitiendo lo mismo (poder tocar algo), el interruptor no representa una decisión real — de ahí el "pierde criterio" que señaló.

**El fix real: el interruptor ahora es sobre el PERMISO de edición, no sobre "qué lista se muestra".**
- **Apagado** (por defecto): el barbero ve el catálogo compartido de la barbería en **solo lectura** — ningún campo editable, ni precio ni nada. Si quiere cambiar algo, tiene que pedírselo a su dueño.
- **Prendido**: el barbero tiene su propio catálogo (arranca como copia del compartido, ver la ronda anterior) con edición completa — nombre, duración, precio, oferta, publicado/oculto.

De paso, se aclaró el texto junto al interruptor en la pestaña "Barberos" del dueño para que quede inequívoco qué decide: "Puede crear y editar sus propios servicios y precios" vs. "Solo puede ver el catálogo compartido — no puede modificarlo" (antes decía solo "Usa el catálogo compartido...", que describía la lista pero no el permiso).

**Guardado explícito, no automático.** Antes, cada campo del catálogo propio se guardaba solo al perder el foco (`onBlur`), campo por campo — Enzo pidió que hubiera un botón "Guardar cambios" que confirme el cambio de una vez. Ahora los campos del catálogo propio del barbero quedan en un borrador local (no se manda nada mientras se edita) y aparece un aviso "Tenés cambios sin guardar" + un botón "Guardar cambios" (deshabilitado si no hay nada pendiente) que confirma todos los cambios juntos, con una notificación de guardado (reusando `ToastGuardado`, el mismo componente que ya se usa en Personalización). Alta de un servicio nuevo sigue siendo su propio paso explícito (ya tenía su botón "Crear servicio", sin cambios ahí).

**Cómo se probó (Playwright, instalado y desinstalado como siempre, con el servidor de desarrollo reiniciado de cero):**
- Con el interruptor apagado (default): "Ver como" Barbero → pestaña Servicios muestra 0 campos editables (`<input>`) en toda la pantalla — puede ver "Corte clásico" pero no tocar nada.
- Se activa el interruptor desde el panel del dueño → el texto junto a él cambia correctamente entre los dos estados aclarados.
- Con el interruptor prendido: la pestaña Servicios del barbero muestra el catálogo propio editable, con el botón "Guardar cambios" deshabilitado (sin cambios pendientes todavía).
- Se edita un precio (sin guardar) → aparece "Tenés cambios sin guardar", el botón se habilita, y el valor en `localStorage` **sigue siendo el viejo** — confirma que nada se guarda solo mientras se edita.
- Se aprieta "Guardar cambios" → el aviso desaparece, aparece el toast "Cambios guardados", y recién ahí el valor en `localStorage` queda actualizado.
- Cero errores de consola/página en los 5 puntos verificados. Build y lint limpios.

**Por qué:**
- Solo lectura en vez de "editar precio igual que antes": era exactamente la ambigüedad que señaló Enzo — un interruptor que no cambia el comportamiento real no sirve de nada, sin importar qué tan bien esté explicado en el texto de al lado.
- Borrador local + un solo botón de guardado (en vez de seguir con guardado automático por campo): fue un pedido explícito, y de paso da más margen para editar varios campos de varios servicios antes de confirmar, en vez de ir guardando de a un campo cada vez que se saca el foco.
- Reusar `ToastGuardado` en vez de armar una notificación nueva: mismo lenguaje visual de guardado que ya conoce el dueño en Personalización — no hacía falta un patrón nuevo para esto.

**Archivos afectados:**
- Eliminado: `src/pages/panel/components/FilaServicioPrecio.jsx` y el hook `useActualizarPrecioServicio` (ya no se usan — el modo "apagado" pasó a ser de solo lectura).
- Modificado: `src/pages/panel/PanelBarberoServicios.jsx` (reescrito: modo solo-lectura + modo catálogo propio con borrador local y "Guardar cambios"), `src/pages/panel/hooks/useServiciosPanel.js` (se saca el hook de precio-solo, ya sin uso), `src/pages/panel/PanelBarberos.jsx` (texto del interruptor aclarado).

**Pendiente / próximos pasos:**
- Ninguno.

---
