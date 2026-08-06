import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { esquemaDatosCliente } from './esquemaReserva'
import { BackButton } from '../../../components/common/BackButton'
import { Button } from '../../../components/common/Button'

export function PasoDatos({ resumen, onConfirmar, enviando, onVolver }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(esquemaDatosCliente) })

  return (
    <div>
      <BackButton onClick={onVolver} />
      <h2 className="font-display mb-4 mt-3 text-xl font-light tracking-tight text-negro-barbero md:text-2xl">
        Tus datos
      </h2>

      <div className="border-l-2 border-cobre/40 py-1 pl-4 text-sm text-gris-calido-700">
        {resumen}
      </div>

      <form onSubmit={handleSubmit(onConfirmar)} className="mt-8 flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="versalitas text-xs text-gris-calido-500">Nombre</span>
          <input
            {...register('cliente_nombre')}
            type="text"
            placeholder="Tu nombre"
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
          {errors.cliente_nombre && (
            <span role="alert" className="text-xs text-red-700">
              {errors.cliente_nombre.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="versalitas text-xs text-gris-calido-500">Celular</span>
          <input
            {...register('cliente_telefono')}
            type="tel"
            placeholder="9 1234 5678"
            className="min-h-11 border-b border-gris-calido-200 bg-transparent py-2 text-base text-negro-barbero outline-none transition-colors focus:border-cobre"
          />
          {errors.cliente_telefono && (
            <span role="alert" className="text-xs text-red-700">
              {errors.cliente_telefono.message}
            </span>
          )}
        </label>

        <Button as="button" type="submit" disabled={enviando} className="mt-2 w-full disabled:opacity-60">
          {enviando ? 'Confirmando…' : 'Confirmar reserva'}
        </Button>
      </form>
    </div>
  )
}
