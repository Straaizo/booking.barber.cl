import { useAuth } from '../../hooks/useAuth'
import { Loader } from '../../components/common/Loader'
import { formatoCLP, ofertaVigente } from '../../utils/formatos'
import { useServiciosDeBarberia } from './hooks/useServiciosPanel'

// Todo lo que un barbero ve en su propia pestaña "Servicios": los
// compartidos (para cualquiera) más los que el dueño le asignó puntualmente
// a él — siempre de solo lectura, el catálogo completo lo administra el
// dueño desde su panel (ver PanelServicios.jsx, con el selector "Barbero
// asignado" por servicio). Antes existía un "catálogo propio" que el barbero
// podía editar él mismo si el dueño se lo activaba — se sacó del todo: más
// simple para el dueño (un solo lugar donde administrar precios) y sin la
// confusión de dos catálogos paralelos.
export function PanelBarberoServicios() {
  const { perfil } = useAuth()
  const { data: servicios, isLoading, isError } = useServiciosDeBarberia(perfil.barberia_id, perfil.barbero_id)

  return (
    <div>
      <h1 className="font-display text-2xl font-light tracking-tight text-negro-barbero md:text-3xl">
        Mis servicios
      </h1>
      <p className="mt-2 max-w-lg text-sm text-gris-calido-700">
        Los servicios y precios que ofreces — los administra tu dueño desde su panel. Si falta
        algo o el precio está mal, pídele que lo actualice ahí.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="py-12">
            <Loader label="Cargando servicios" />
          </div>
        )}

        {isError && (
          <p role="alert" className="py-8 text-sm text-red-700">
            No pudimos cargar los servicios. Recarga la página o intenta más tarde.
          </p>
        )}

        {servicios && servicios.length === 0 && (
          <p className="py-8 text-sm text-gris-calido-700">
            Todavía no tenés servicios asignados. Pídele a tu dueño que los cree.
          </p>
        )}

        {servicios && servicios.length > 0 && (
          <div className="flex flex-col gap-3">
            {servicios.map((servicio) => {
              const enOferta = ofertaVigente(servicio)
              return (
                <div
                  key={servicio.id}
                  className="flex items-center gap-4 rounded-lg border border-gris-calido-200 bg-white p-4"
                >
                  {servicio.imagen_url ? (
                    <img
                      src={servicio.imagen_url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="h-14 w-14 shrink-0 rounded-md bg-cobre/5" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block font-medium ${servicio.activo ? 'text-negro-barbero' : 'text-gris-calido-400 line-through'}`}
                    >
                      {servicio.nombre}
                    </span>
                    <span className="versalitas mt-0.5 block text-xs text-gris-calido-400">
                      {servicio.duracion_minutos} min · solo lectura
                    </span>
                  </div>
                  <div className="numeros-tabulares shrink-0 text-right">
                    {enOferta ? (
                      <>
                        <span className="block text-xs text-gris-calido-400 line-through">
                          {formatoCLP(servicio.precio_clp)}
                        </span>
                        <span className="block text-sm font-semibold text-cobre-texto">
                          {formatoCLP(servicio.precio_oferta)}
                        </span>
                      </>
                    ) : (
                      <span className="block text-sm font-semibold text-negro-barbero">
                        {formatoCLP(servicio.precio_clp)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
