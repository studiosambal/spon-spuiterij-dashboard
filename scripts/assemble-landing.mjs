// Kopieert de statische landingspagina (landing/) naar de root van dist/,
// zodat / de keuzepagina toont en /v1 + /v2 de twee gebouwde apps zijn.
import { cp, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

await mkdir(dist, { recursive: true })
await cp(join(root, 'landing'), dist, { recursive: true })

console.log('✓ landingspagina naar dist/ gekopieerd')
