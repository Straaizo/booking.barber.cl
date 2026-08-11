import { useOutletContext } from 'react-router-dom'
import { VistaBarberia } from './components/VistaBarberia'

export function PaginaBarberia() {
  const { barberia } = useOutletContext()
  return <VistaBarberia barberia={barberia} />
}
