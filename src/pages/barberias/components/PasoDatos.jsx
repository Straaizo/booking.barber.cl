import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { esquemaDatosCliente } from './esquemaReserva'
import { BackButton } from '../../../components/common/BackButton'

export function PasoDatos({ resumen, onConfirmar, enviando, onVolver }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(esquemaDatosCliente) })

  return (
    <div className="flex flex-col gap-4">
      <BackButton onClick={onVolver} />
      <h2 className="text-lg font-bold text-negro-barbero">Tus datos</h2>

      <div className="rounded-xl bg-gris-calido-100 px-4 py-3 text-sm text-gris-calido-700">
        {resumen}
      </div>

      <form onSubmit={handleSubmit(onConfirmar)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-negro-barbero">Nombre</span>
          <input
            {...register('cliente_nombre')}
            type="text"
            placeholder="Tu nombre"
            className="rounded-lg border border-gris-calido-200 bg-white px-4 py-3 text-negro-barbero outline-none focus:border-cobre"
          />
          {errors.cliente_nombre && (
            <span className="text-sm text-red-700">
              {errors.cliente_nombre.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-negro-barbero">Celular</span>
          <input
            {...register('cliente_telefono')}
            type="tel"
            placeholder="9 1234 5678"
            className="rounded-lg border border-gris-calido-200 bg-white px-4 py-3 text-negro-barbero outline-none focus:border-cobre"
          />
          {errors.cliente_telefono && (
            <span className="text-sm text-red-700">
              {errors.cliente_telefono.message}
            </span>
          )}
        </label>

        <motion.button
          type="submit"
          disabled={enviando}
          whileHover={{ scale: enviando ? 1 : 1.02 }}
          whileTap={{ scale: enviando ? 1 : 0.98 }}
          className="mt-2 rounded-lg bg-cobre py-3 font-bold text-hueso transition-colors hover:bg-cobre-oscuro disabled:opacity-60"
        >
          {enviando ? 'Confirmando…' : 'Confirmar reserva'}
        </motion.button>
      </form>
    </div>
  )
}
