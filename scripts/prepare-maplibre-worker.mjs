import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const maplibreEntry = fileURLToPath(import.meta.resolve('maplibre-gl'))
const maplibreDist = path.dirname(maplibreEntry)
const destination = path.resolve(process.cwd(), 'public', 'vendor', 'maplibre')

mkdirSync(destination, { recursive: true })
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(path.join(maplibreDist, file), path.join(destination, file))
}
