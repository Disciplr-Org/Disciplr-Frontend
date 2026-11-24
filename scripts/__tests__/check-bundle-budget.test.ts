import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkBundleBudget } from '../check-bundle-budget'

describe('check-bundle-budget', () => {
  let fixtureDir = ''
  let assetsDir = ''

  afterEach(() => {
    vi.restoreAllMocks()
    if (fixtureDir) rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = ''
    assetsDir = ''
  })

  function createFixture(): void {
    fixtureDir = mkdtempSync(join(tmpdir(), 'check-bundle-budget-'))
    assetsDir = join(fixtureDir, 'assets')
    mkdirSync(assetsDir)
  }

  function writeChunk(name: string, content: Buffer | string): void {
    writeFileSync(join(assetsDir, name), content)
  }

  it('returns 0 when expected chunks are under budget and ignores extra chunks', () => {
    createFixture()
    writeChunk('index-abc123.js', 'small')
    writeChunk('unexpected-large-chunk.js', randomBytes(300_000))
    const output = vi.spyOn(console, 'log').mockImplementation(() => {})

    expect(checkBundleBudget(assetsDir, { index: 200_000 })).toBe(0)
    expect(output.mock.calls.join('\n')).toContain('100.0%')
    expect(output.mock.calls.join('\n')).toContain('OK')
  })

  it('returns 1 and lists every over-budget chunk', () => {
    createFixture()
    writeChunk('index-abc123.js', randomBytes(300_000))
    writeChunk('Analytics-deadbeef.js', randomBytes(300_000))
    const output = vi.spyOn(console, 'log').mockImplementation(() => {})

    expect(
      checkBundleBudget(assetsDir, { index: 200_000, Analytics: 50_000 }),
    ).toBe(1)
    const table = output.mock.calls.join('\n')
    expect(table).toContain('index')
    expect(table).toContain('Analytics')
    expect(table.match(/OVER/g)).toHaveLength(2)
    expect(table).toMatch(/\d+\.\d kB/)
    expect(table).toMatch(/-\d+\.\d%/)
  })

  it('returns 1 with a clear message when an expected chunk is missing', () => {
    createFixture()
    writeChunk('index-abc123.js', 'small')
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const output = vi.spyOn(console, 'log').mockImplementation(() => {})

    expect(
      checkBundleBudget(assetsDir, { index: 200_000, 'vendor-recharts': 150_000 }),
    ).toBe(1)
    expect(errors.mock.calls.join('\n')).toContain('vendor-recharts')
    expect(errors.mock.calls.join('\n')).toContain('Missing expected chunk')
    expect(output.mock.calls.join('\n')).toContain('MISSING')
  })
})
