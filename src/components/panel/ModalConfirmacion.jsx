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
      <p className="text-sm text-gris-calido-700">{mensaje}</p>
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="button"
          onClick={onCerrar}
          disabled={confirmando}
          className="versalitas text-xs text-gris-calido-500 transition-colors hover:text-negro-barbero disabled:opacity-50"
        >
          {textoCancelar}
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-hueso transition-[filter] hover:brightness-110 disabled:opacity-60 ${
            variante === 'peligro' ? 'bg-red-700' : 'bg-cobre-oscuro'
          }`}
        >
          {confirmando ? 'Un momento…' : textoConfirmar}
        </button>
      </div>
    </ModalFormulario>
  )
}
