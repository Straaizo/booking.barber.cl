import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  )

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = (event) => setIsMobile(event.matches)
    query.addEventListener('change', update)
    setIsMobile(query.matches)
    return () => query.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}
