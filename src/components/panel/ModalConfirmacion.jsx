import { ModalFormulario } from './ModalFormulario'

// Confirmación para una acción importante o difícil de deshacer (cancelar
// una reserva, dar de baja algo, eliminar una cuenta) — la misma tarjeta
// flotante que `ModalFormulario`, en vez de un `window.confirm()` nativo del
// navegador (sin estilo propio, y que en Chrome/Firefox ya se ve distinto en
// cada sistema operativo). `variante="peligro"` (la de por defecto) pinta el
// botón de confirmar en rojo, para lo destructivo; `variante="normal"` lo
// deja en el color de marca, para acciones importantes pero no destructivas
// (ej: reactivar algo).
export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'peligro',
  confirmando = false,
  onConfirmar,
  onCerrar,
}) {
  return (
    <ModalFormulario abierto={abierto} titulo={titulo} onCerrar={onCerrar}>
      <p className="text-base leading-relaxed text-gris-calido-700 md:text-sm">{mensaje}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end md:gap-4">
        <button
          type="button"
          onClick={onCerrar}
          disabled={confirmando}
          className="min-h-12 rounded-xl text-base text-gris-calido-700 transition-colors hover:text-negro-barbero active:bg-gris-calido-100 disabled:opacity-50 md:min-h-0 md:text-xs md:font-semibold md:uppercase md:tracking-[0.07em] md:text-gris-calido-500"
        >
          {textoCancelar}
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
          className={`min-h-12 rounded-xl px-5 py-2.5 text-base font-semibold md:min-h-0 md:rounded-lg md:text-sm text-hueso transition-[filter] hover:brightness-110 disabled:opacity-60 ${
            variante === 'peligro' ? 'bg-red-700' : 'bg-cobre-oscuro'
          }`}
        >
          {confirmando ? 'Un momento…' : textoConfirmar}
        </button>
      </div>
    </ModalFormulario>
  )
}
