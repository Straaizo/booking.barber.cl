# Datos provisorios

Estos CSV (se abren en Excel/Sheets normal) son tu referencia de los datos de prueba mientras no hay Supabase real conectado. Reflejan la barbería "Don Manuel" que ya está cargada en el panel.

**Importante — esto no se lee automáticamente:** la app no importa estos archivos. Lo que realmente ve el navegador vive en `src/mocks/datosProvisoriosSuperadmin.js` (el "seed" inicial) y después en el `localStorage` de tu navegador (ahí quedan los cambios que hagas desde el panel — plan, estado, nuevas barberías que crees con el formulario). Si editás estos CSV a mano, es solo para tu propia planificación/registro — no cambia lo que se ve en la página.

Si en algún momento quieres agregar más barberías de prueba, lo más simple es hacerlo directo desde el formulario "Nueva barbería" del panel (`/admin`) — queda guardado solo. Editar el CSV es opcional, solo para tener un respaldo legible fuera del navegador.

Para borrar todos los datos de prueba y volver al estado inicial: abre la consola del navegador en cualquier página del sitio y ejecuta:
```js
localStorage.removeItem('booking_barber_datos_provisorios_v1')
```
y recarga.

Cuando conectes un Supabase real (`.env` con una URL real, no la de ejemplo), todo esto se desactiva solo — el panel vuelve a leer/escribir contra la base real sin que haya que tocar código ni borrar estos archivos.
