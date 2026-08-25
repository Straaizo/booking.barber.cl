export function BackButton({ onClick }) {
  if (!onClick) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-fit text-sm text-[var(--pb-texto-secundario)] underline-offset-2 hover:underline"
    >
      ← Volver
    </button>
  )
}
