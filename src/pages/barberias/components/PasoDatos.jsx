import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { esquemaDatosCliente } from './esquemaReserva'
import { BackButton } from '../../../components/common/BackButton'
import { Button } from '../../../components/common/Button'

// Solo dígitos, máximo 8 (lo que sigue al "9" fijo de todo celular chileno)
// — cualquier otra tecla (letras, símbolos, un pegado con espacios o +56 de
// más) se descarta al tipear, en vez de aceptarla y recién avisar al enviar.
function soloOchoDigitos(texto) {
  return texto.replace(/\D/g, '').slice(0, 8)
}

// "12345678" -> "1234 5678", igual al formato +56 9 0000 0000 que ya usa el
// resto de la plataforma (ver PanelPersonalizacion, WhatsApp, etc.)
function formatoVisual(ochoDigitos) {
  return ochoDigitos.length > 4 ? `${ochoDigitos.slice(0, 4)} ${ochoDigitos.slice(4)}` : ochoDigitos
}

export function PasoDatos({ resumen, onConfirmar, enviando, onVolver }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaDatosCliente),
    defaultValues: { cliente_telefono: '9' },
  })

  return (
    <div>
      <BackButton onClick={onVolver} />
      <h2 className="font-display mb-4 mt-3 text-xl font-light tracking-tight text-[var(--pb-texto)] md:text-2xl">
        Tus datos
      </h2>

      <div className="border-l-2 border-cobre/40 py-1 pl-4 text-sm text-[var(--pb-texto-secundario)]">
        {resumen}
      </div>

      <form onSubmit={handleSubmit(onConfirmar)} className="mt-8 flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="versalitas text-xs text-[var(--pb-texto-terciario)]">Nombre</span>
          <input
            {...register('cliente_nombre')}
            type="text"
            placeholder="Tu nombre"
            className="min-h-11 border-b border-[var(--pb-borde)] bg-transparent py-2 text-base text-[var(--pb-texto)] outline-none transition-colors focus:border-cobre"
          />
          {errors.cliente_nombre && (
            <span role="alert" className="text-xs text-red-700">
              {errors.cliente_nombre.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="versalitas text-xs text-[var(--pb-texto-terciario)]">Celular</span>
          <Controller
            name="cliente_telefono"
            control={control}
            render={({ field }) => (
              <div className="flex min-h-11 items-center gap-2 border-b border-[var(--pb-borde)] py-2 transition-colors focus-within:border-cobre">
                <span className="numeros-tabulares shrink-0 text-base text-[var(--pb-texto-terciario)]">+56 9</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="1234 5678"
                  value={formatoVisual(field.value.slice(1))}
                  onChange={(evento) => field.onChange(`9${soloOchoDigitos(evento.target.value)}`)}
                  className="numeros-tabulares min-w-0 flex-1 bg-transparent text-base text-[var(--pb-texto)] outline-none"
                />
              </div>
            )}
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
