import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const SCRATCH = 'C:\\Users\\ENZOSA~1\\AppData\\Local\\Temp\\claude\\c--Users-Enzo-Sabattini-Desktop-BOOKING-BARBER\\32781b76-f736-4992-b9aa-0790b55a57e5\\scratchpad\\'

const browser = await chromium.launch()

async function reservar(page, { hora, telefonoOchoDigitos, nombre }) {
  await page.goto(`${BASE}/barberia-jose-luis`, { waitUntil: 'networkidle' })
  await page.locator('#reservar').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const asistente = page.locator('#reservar')
  await asistente.getByText('Corte + Degradado').first().click()
  await page.waitForTimeout(1500)
  // Elige el primer día habilitado (hoy, si tiene cupos) y la hora pedida
  const botonHora = asistente.getByRole('button', { name: hora, exact: true })
  if ((await botonHora.count()) === 0) {
    const disponibles = await asistente.locator('button.numeros-tabulares').allTextContents()
    console.log(`  (no hay cupo a las ${hora} hoy, se omite esta prueba — disponibles: ${disponibles.join(', ')})`)
    return false
  }
  await botonHora.click()
  await page.waitForTimeout(400)
  await asistente.locator('input[type="text"]').first().fill(nombre)
  const tel = asistente.locator('input[type="tel"]')
  await tel.evaluate(
    (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(el, val)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    `9${telefonoOchoDigitos}`
  )
  await asistente.getByRole('button', { name: 'Confirmar reserva' }).click()
  await page.waitForTimeout(1200)
  const mensajeError = await asistente.locator('[role="alert"]').last().textContent().catch(() => null)
  console.log(`  ${hora} - ${nombre}: ${mensajeError ? 'FALLÓ -> ' + mensajeError : 'OK'}`)
  return !mensajeError
}

const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

console.log('=== Creando una reserva de prueba en el único cupo libre de hoy ===')
await reservar(page, { hora: '18:00', telefonoOchoDigitos: '11112222', nombre: 'Cliente Prueba Dieciocho' })

console.log('\n=== Entrando al panel para ver el calendario con varias reservas ===')
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.locator('input[autocomplete="username"]').fill('jluis')
await page.locator('input[autocomplete="current-password"]').fill('Jluis2026')
await page.locator('button[type="submit"]').click()
await page.waitForURL(/\/panel/, { timeout: 10000 })
await page.goto(`${BASE}/panel/reservas`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: `${SCRATCH}semanal-1-con-datos.png`, fullPage: true })

await browser.close()
