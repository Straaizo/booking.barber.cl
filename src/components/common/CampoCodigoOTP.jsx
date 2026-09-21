import { useRef, useState } from 'react'

const LARGO = 6

// Un cuadro por dígito — el patrón estándar de cualquier código de un solo
// uso (GitHub, Google, Stripe...), no un input de texto plano: más fácil de
// leer de un vistazo y corregir un dígito puntual sin borrar todo. Avanza
// solo al siguiente cuadro al tipear, retrocede con Backspace en uno vacío,
// y pegar el código completo (copiado de la app de autenticación) en
// cualquier cuadro lo reparte en los 6 de una vez.
//
// El estado de los 6 dígitos vive ACÁ (no viene controlado por el padre) —
// evita reconstruir posiciones a partir de un string colapsado, que es
// donde vivía el bug de la primera versión (pegar o escribir salteado podía
// correr los dígitos de cuadro). El padre solo recibe el código final via
// `onCambio`/`onCompleto`; para limpiar el campo (ej: después de un código
// incorrecto), se lo remonta con un `key` distinto en vez de controlarlo.
//
// `data-1p-ignore`/`data-lpignore`: le piden a 1Password/LastPass que NO
// ofrezcan guardar esto como una contraseña — un código de 6 dígitos en un
// <form> es justo el tipo de campo que un gestor de contraseñas confunde con
// una credencial para recordar si no se le avisa explícitamente que no lo
// haga. `autoComplete="one-time-code"` cumple el mismo rol para el propio
// navegador. El código nunca viaja por una URL ni queda en logs — va directo
// en el body del POST de verificación (mfaService.js).
export function CampoCodigoOTP({ onCambio, onCompleto, deshabilitado, autoFocus = true }) {
  const [digitos, setDigitos] = useState(() => Array(LARGO).fill(''))
  const referencias = useRef([])

  function avisar(nuevosDigitos) {
    const codigo = nuevosDigitos.join('')
    onCambio?.(codigo)
    if (codigo.length === LARGO) onCompleto?.(codigo)
  }

  function enCambio(indice, evento) {
    const digito = evento.target.value.replace(/\D/g, '').slice(-1)
    const nuevos = [...digitos]
    nuevos[indice] = digito
    setDigitos(nuevos)
    avisar(nuevos)
    if (digito && indice < LARGO - 1) referencias.current[indice + 1]?.focus()
  }

  function enTeclaAbajo(indice, evento) {
    if (evento.key === 'Backspace' && !digitos[indice] && indice > 0) {
      referencias.current[indice - 1]?.focus()
    }
  }

  function enPegar(evento) {
    const texto = evento.clipboardData.getData('text').replace(/\D/g, '').slice(0, LARGO)
    if (!texto) return
    evento.preventDefault()
    const nuevos = Array.from({ length: LARGO }, (_, i) => texto[i] ?? '')
    setDigitos(nuevos)
    avisar(nuevos)
    referencias.current[Math.min(texto.length, LARGO - 1)]?.focus()
  }

  return (
    <div className="flex gap-2">
      {digitos.map((digito, indice) => (
        <input
          key={indice}
          ref={(el) => (referencias.current[indice] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={indice === 0 ? 'one-time-code' : 'off'}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-1p-ignore=""
          data-lpignore="true"
          autoFocus={autoFocus && indice === 0}
          disabled={deshabilitado}
          value={digito}
          onChange={(e) => enCambio(indice, e)}
          onKeyDown={(e) => enTeclaAbajo(indice, e)}
          onPaste={enPegar}
          className="numeros-tabulares h-14 w-11 rounded-md border border-gris-calido-200 bg-transparent text-center text-xl text-negro-barbero outline-none transition-colors focus:border-cobre disabled:opacity-60 sm:w-12"
        />
      ))}
    </div>
  )
}
