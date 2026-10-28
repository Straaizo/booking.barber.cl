import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabaseClient'
import { HAY_BACKEND_REAL } from '../../../mocks/datosProvisoriosSuperadmin'

// `mes` siempre es un Date local en el día 1 — se manda como 'YYYY-MM-01'.
export function claveMes(mes) {
  return `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}-01`
}

// Modo de prueba (sin backend): números de ejemplo que cambian según el mes,
// para poder ver la comparativa sin una base real.
function resumenProvisorio(mes) {
  const semilla = mes.getFullYear() * 12 + mes.getMonth()
  return [
    ['prov-barbero-1', 'Manuel Rojas', 58],
    ['prov-barbero-2', 'Ignacio Soto', 34],
  ].map(([barbero_id, barbero_nombre, base], i) => {
    const reservas = base + ((semilla * (i + 3)) % 17) - 8
    const canceladas = 2 + ((semilla + i) % 4)
    const atendidas = reservas - canceladas - 3
    return {
      barbero_id,
      barbero_nombre,
      reservas,
      atendidas,
      canceladas,
      sin_confirmar: 3,
      pendientes: 0,
      ingresos_agendados: (reservas - canceladas) * 9500,
      ingresos_atendidos: atendidas * 9500,
    }
  })
}

// Totales del mes por barbero (ver `resumen_mes` en
// 20261028000003_resumen_y_metas.sql): el dueño recibe a todos sus
// barberos, el barbero solo su fila.
export function useResumenMes(mes) {
  return useQuery({
    queryKey: ['resumen_mes', claveMes(mes)],
    queryFn: async () => {
      if (!HAY_BACKEND_REAL) return resumenProvisorio(mes)
      const { data, error } = await supabase.rpc('resumen_mes', { p_mes: claveMes(mes) })
      if (error) throw error
      return data.map((fila) => ({
        ...fila,
        ingresos_agendados: Number(fila.ingresos_agendados),
        ingresos_atendidos: Number(fila.ingresos_atendidos),
      }))
    },
  })
}

// Metas del mes: la general (`barbero_id` null) y las de cada barbero. RLS
// ya filtra — el barbero solo recibe la suya.
export function useMetasMes(mes) {
  return useQuery({
    queryKey: ['metas_mes', claveMes(mes)],
    queryFn: async () => {
      if (!HAY_BACKEND_REAL) {
        return [
          { barbero_id: null, meta_ingresos_clp: 900000 },
          { barbero_id: 'prov-barbero-1', meta_ingresos_clp: 550000 },
        ]
      }
      const { data, error } = await supabase
        .from('metas_mensuales')
        .select('barbero_id, meta_ingresos_clp')
        .eq('mes', claveMes(mes))
      if (error) throw error
      return data
    },
  })
}

export function useGuardarMetas(mes) {
  const queryClient = useQueryClient()
  return useMutation({
    // `metas`: [{ barbero_id: number | null, meta: number | null }]
    mutationFn: async (metas) => {
      if (!HAY_BACKEND_REAL) throw new Error('No disponible en modo de prueba.')
      for (const { barbero_id, meta } of metas) {
        const { error } = await supabase.rpc('guardar_meta_mensual', {
          p_mes: claveMes(mes),
          p_barbero_id: barbero_id,
          p_meta: meta || null,
        })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metas_mes', claveMes(mes)] }),
  })
}

const ESTADOS_CSV = { confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada' }

function celdaCsv(valor) {
  const texto = String(valor ?? '')
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

// Descarga las reservas del mes como CSV separado por `;` (lo que Excel en
// español espera para abrirlo directo en columnas) con BOM UTF-8 para que
// los tildes se vean bien.
export async function descargarReservasDelMes(mes, nombreArchivo) {
  const { data, error } = await supabase.rpc('reservas_del_mes', { p_mes: claveMes(mes) })
  if (error) throw error

  const encabezado = ['Fecha', 'Hora', 'Barbero', 'Cliente', 'Teléfono', 'Servicio', 'Precio', 'Estado']
  const filas = data.map((r) => {
    const fecha = new Date(r.fecha_hora)
    return [
      fecha.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }),
      fecha.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false }),
      r.barbero,
      r.cliente,
      r.telefono,
      r.servicio,
      r.precio_clp,
      ESTADOS_CSV[r.estado] ?? r.estado,
    ]
  })
  const csv = [encabezado, ...filas].map((fila) => fila.map(celdaCsv).join(';')).join('\r\n')

  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return data.length
}
