import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

interface BudgetConfig {
  unit: 'gzip-bytes'
  budgets: Record<string, number>
}

interface BudgetRow {
  chunk: string
  gzipBytes: number | null
  budgetBytes: number
  status: 'OK' | 'OVER' | 'MISSING' | 'AMBIGUOUS'
}

function readBudgetConfig(path: string): BudgetConfig {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('bundle-budget.json must contain an object')
  }

  const config = parsed as Record<string, unknown>
  if (config.unit !== 'gzip-bytes') {
    throw new Error('bundle-budget.json unit must be "gzip-bytes"')
  }
  if (
    typeof config.budgets !== 'object' ||
    config.budgets === null ||
    Array.isArray(config.budgets)
  ) {
    throw new Error('bundle-budget.json must contain a budgets object')
  }

  const budgets: Record<string, number> = {}
  for (const [chunk, value] of Object.entries(config.budgets)) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(chunk)) {
      throw new Error(`Invalid chunk name in bundle-budget.json: ${chunk}`)
    }
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Budget for "${chunk}" must be a positive integer number of bytes`)
    }
    budgets[chunk] = value
  }
  if (Object.keys(budgets).length === 0) {
    throw new Error('bundle-budget.json must define at least one chunk budget')
  }

  return { unit: 'gzip-bytes', budgets }
}

export function checkBundleBudget(assetsDir: string, budgets: Record<string, number>): number {
  const assets = readdirSync(assetsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
  const rows: BudgetRow[] = []
  let failed = false

  for (const [chunk, budgetBytes] of Object.entries(budgets)) {
    const matcher = new RegExp(`^${chunk}(?:-[A-Za-z0-9_-]+)?\\.js$`)
    const matches = assets.filter((asset) => matcher.test(asset))

    if (matches.length === 0) {
      console.error(
        `Missing expected chunk "${chunk}" in ${assetsDir} (expected ${chunk}.js or ${chunk}-<hash>.js).`,
      )
      rows.push({ chunk, gzipBytes: null, budgetBytes, status: 'MISSING' })
      failed = true
      continue
    }
    if (matches.length > 1) {
      console.error(`Found multiple files for expected chunk "${chunk}": ${matches.join(', ')}`)
      rows.push({ chunk, gzipBytes: null, budgetBytes, status: 'AMBIGUOUS' })
      failed = true
      continue
    }

    const gzipBytes = gzipSync(readFileSync(join(assetsDir, matches[0]))).byteLength
    const overBudget = gzipBytes >= budgetBytes
    rows.push({
      chunk,
      gzipBytes,
      budgetBytes,
      status: overBudget ? 'OVER' : 'OK',
    })
    if (overBudget) failed = true
  }

  const chunkWidth = Math.max(5, ...rows.map((row) => row.chunk.length))
  const table = [
    `Bundle budget (gzip; decimal kB)`,
    `${'Chunk'.padEnd(chunkWidth)}  ${'Gzip'.padStart(10)}  ${'Budget'.padStart(10)}  ${'Headroom'.padStart(10)}  Status`,
    ...rows.map((row) => {
      if (row.gzipBytes === null) {
        return `${row.chunk.padEnd(chunkWidth)}  ${'-'.padStart(10)}  ${`${(row.budgetBytes / 1000).toFixed(1)} kB`.padStart(10)}  ${'-'.padStart(10)}  ${row.status}`
      }
      const headroom = ((row.budgetBytes - row.gzipBytes) / row.budgetBytes) * 100
      return `${row.chunk.padEnd(chunkWidth)}  ${`${(row.gzipBytes / 1000).toFixed(1)} kB`.padStart(10)}  ${`${(row.budgetBytes / 1000).toFixed(1)} kB`.padStart(10)}  ${`${headroom.toFixed(1)}%`.padStart(10)}  ${row.status}`
    }),
  ]
  console.log(table.join('\n'))

  if (!failed) console.log('check:bundle: all expected chunks are within budget.')
  return failed ? 1 : 0
}

function main(): number {
  const root = resolve(fileURLToPath(import.meta.url), '../..')
  try {
    const { budgets } = readBudgetConfig(join(root, 'bundle-budget.json'))
    return checkBundleBudget(join(root, 'dist', 'assets'), budgets)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`check:bundle: ${message}`)
    return 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main())
}
