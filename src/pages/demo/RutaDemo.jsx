import { Outlet } from 'react-router-dom'
import { BARBERIA_DEMO } from '../../config/demo'

// Mismo contrato que RutaBarberia (Outlet con { barberia } en el contexto),
// pero con datos locales — así PaginaBarberia y AsistenteReserva son
// exactamente el mismo código para /demo que para una barbería real.
export function RutaDemo() {
  return <Outlet context={{ barberia: BARBERIA_DEMO }} />
}
