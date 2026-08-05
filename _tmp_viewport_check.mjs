import { chromium } from 'playwright'

const browser = await chromium.launch()
const out = process.argv[2]
const resultados = []

const viewports = [
  { nombre: '375', width: 375, height: 812 },
  { nombre: '390', width: 390, height: 844 },
  { nombre: '768', width: 768, height: 1024 },
  { nombre: '1024', width: 1024, height: 900 },
  { nombre: '1440', width: 1440, height: 1000 },
  { nombre: '1920', width: 1920, height: 1080 },
]

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Reservas online para barberías chilenas')

  // scroll incremental real para disparar whileInView de toda la página
  const total = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < total; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(400)

  const scrollAncho = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )

  await page.screenshot({ path: `${out}/vp_${vp.nombre}.png`, fullPage: true })

  resultados.push({
    viewport: vp.nombre,
    scrollHorizontalIndebido: scrollAncho,
    erroresConsola: consoleErrors,
  })

  await page.close()
}

console.log(JSON.stringify(resultados, null, 2))
await browser.close()
