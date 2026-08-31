import { describe, expect, it } from 'vitest'
import {
  evidenceUploadReducer,
  INITIAL_STATE,
  type EvidenceUploadAction,
  type EvidenceUploadState,
} from '../evidenceUploadMachine'

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyAll(
  actions: EvidenceUploadAction[],
  initial: EvidenceUploadState = INITIAL_STATE,
): EvidenceUploadState {
  return actions.reduce((s, a) => evidenceUploadReducer(s, a), initial)
}

function submitState(): EvidenceUploadState {
  return applyAll([{ type: 'SUBMIT', url: 'https://example.com/proof' }])
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('INITIAL_STATE', () => {
  it('starts idle with no error and key 0', () => {
    expect(INITIAL_STATE).toEqual({
      status: 'idle',
      pendingUrl: null,
      submissionKey: 0,
      error: null,
    })
  })
})

// ── URL_CHANGE ────────────────────────────────────────────────────────────────

describe('URL_CHANGE', () => {
  it('updates pendingUrl from idle', () => {
    const next = evidenceUploadReducer(INITIAL_STATE, {
      type: 'URL_CHANGE',
      url: 'https://example.com',
    })
    expect(next.pendingUrl).toBe('https://example.com')
    expect(next.status).toBe('idle')
  })

  it('clears error and returns to idle from failed', () => {
    const failed: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'failed',
      error: 'network error',
      submissionKey: 1,
    }
    const next = evidenceUploadReducer(failed, { type: 'URL_CHANGE', url: 'https://retry.com' })
    expect(next.status).toBe('idle')
    expect(next.error).toBeNull()
    expect(next.pendingUrl).toBe('https://retry.com')
  })

  it('returns to idle from submitted, clearing outcome', () => {
    const submitted: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'submitted',
      submissionKey: 1,
    }
    const next = evidenceUploadReducer(submitted, { type: 'URL_CHANGE', url: 'https://new.com' })
    expect(next.status).toBe('idle')
  })

  it('is a no-op while submitting (I5)', () => {
    const state = submitState()
    expect(state.status).toBe('submitting')
    const next = evidenceUploadReducer(state, { type: 'URL_CHANGE', url: 'https://other.com' })
    expect(next).toBe(state) // referential equality — same object returned
  })
})

// ── FILE_CHANGE ───────────────────────────────────────────────────────────────

describe('FILE_CHANGE', () => {
  it('stays idle and preserves pendingUrl on file change', () => {
    const s: EvidenceUploadState = { ...INITIAL_STATE, pendingUrl: 'https://existing.com' }
    const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' })
    const next = evidenceUploadReducer(s, { type: 'FILE_CHANGE', file })
    expect(next.status).toBe('idle')
    expect(next.pendingUrl).toBe('https://existing.com')
    expect(next.error).toBeNull()
  })

  it('is a no-op while submitting (I5)', () => {
    const state = submitState()
    const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' })
    const next = evidenceUploadReducer(state, { type: 'FILE_CHANGE', file })
    expect(next).toBe(state)
  })
})

// ── SUBMIT ────────────────────────────────────────────────────────────────────

describe('SUBMIT', () => {
  it('transitions idle → submitting and increments submissionKey (I1)', () => {
    const next = evidenceUploadReducer(INITIAL_STATE, {
      type: 'SUBMIT',
      url: 'https://example.com/proof',
    })
    expect(next.status).toBe('submitting')
    expect(next.submissionKey).toBe(1)
    expect(next.pendingUrl).toBe('https://example.com/proof')
    expect(next.error).toBeNull()
  })

  it('is a no-op while already submitting — double-click guard (I1)', () => {
    const state = submitState()
    const next = evidenceUploadReducer(state, {
      type: 'SUBMIT',
      url: 'https://example.com/second',
    })
    expect(next).toBe(state)
    expect(next.submissionKey).toBe(1)
  })

  it('is a no-op when already submitted — re-submission guard (I1)', () => {
    const submitted: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'submitted',
      submissionKey: 2,
    }
    const next = evidenceUploadReducer(submitted, {
      type: 'SUBMIT',
      url: 'https://example.com/again',
    })
    expect(next).toBe(submitted)
  })

  it('increments submissionKey on retry from failed', () => {
    const failed: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'failed',
      submissionKey: 1,
      error: 'timeout',
    }
    const next = evidenceUploadReducer(failed, {
      type: 'SUBMIT',
      url: 'https://example.com/retry',
    })
    expect(next.status).toBe('submitting')
    expect(next.submissionKey).toBe(2) // fresh key — stale responses from key 1 are discarded
    expect(next.error).toBeNull()
  })
})

// ── RESOLVE ───────────────────────────────────────────────────────────────────

describe('RESOLVE', () => {
  it('transitions submitting → submitted on matching key', () => {
    const state = submitState() // submissionKey === 1
    const next = evidenceUploadReducer(state, { type: 'RESOLVE', submissionKey: 1 })
    expect(next.status).toBe('submitted')
    expect(next.error).toBeNull()
    expect(next.pendingUrl).toBe('https://example.com/proof')
  })

  it('is a no-op for a stale key (I2)', () => {
    const state = submitState() // key === 1
    const next = evidenceUploadReducer(state, { type: 'RESOLVE', submissionKey: 0 })
    expect(next).toBe(state)
  })

  it('is a no-op when not submitting (I2)', () => {
    const next = evidenceUploadReducer(INITIAL_STATE, { type: 'RESOLVE', submissionKey: 0 })
    expect(next).toBe(INITIAL_STATE)
  })

  it('stale resolve from an old retry cannot land on top of a newer flight (I2)', () => {
    // Simulate: submit (key=1), submit again (key=2), then old resolve for key=1 arrives
    const afterFirstSubmit = applyAll([
      { type: 'SUBMIT', url: 'https://a.com' },
    ])
    // Simulate retry from failed state by constructing the second submit with key=2
    const stateKey2: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'submitting',
      submissionKey: 2,
      pendingUrl: 'https://b.com',
    }
    const stale = evidenceUploadReducer(stateKey2, { type: 'RESOLVE', submissionKey: 1 })
    expect(stale).toBe(stateKey2) // stale response discarded

    // Correct resolve for key=2 should still land
    const correct = evidenceUploadReducer(stateKey2, { type: 'RESOLVE', submissionKey: 2 })
    expect(correct.status).toBe('submitted')
  })
})

// ── REJECT ────────────────────────────────────────────────────────────────────

describe('REJECT', () => {
  it('transitions submitting → failed with error message on matching key', () => {
    const state = submitState() // key === 1
    const next = evidenceUploadReducer(state, {
      type: 'REJECT',
      submissionKey: 1,
      error: 'Network error',
    })
    expect(next.status).toBe('failed')
    expect(next.error).toBe('Network error')
    expect(next.submissionKey).toBe(1) // key preserved for diagnostics
  })

  it('is a no-op for a stale key (I2)', () => {
    const state = submitState() // key === 1
    const next = evidenceUploadReducer(state, {
      type: 'REJECT',
      submissionKey: 0,
      error: 'old error',
    })
    expect(next).toBe(state)
  })

  it('is a no-op when not submitting (I2)', () => {
    const next = evidenceUploadReducer(INITIAL_STATE, {
      type: 'REJECT',
      submissionKey: 0,
      error: 'phantom',
    })
    expect(next).toBe(INITIAL_STATE)
  })
})

// ── RESET ─────────────────────────────────────────────────────────────────────

describe('RESET', () => {
  it('returns to INITIAL_STATE from failed', () => {
    const failed: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'failed',
      error: 'some error',
      submissionKey: 3,
    }
    const next = evidenceUploadReducer(failed, { type: 'RESET' })
    expect(next).toEqual(INITIAL_STATE)
  })

  it('returns to INITIAL_STATE from submitted', () => {
    const submitted: EvidenceUploadState = {
      ...INITIAL_STATE,
      status: 'submitted',
      submissionKey: 2,
      pendingUrl: 'https://done.com',
    }
    const next = evidenceUploadReducer(submitted, { type: 'RESET' })
    expect(next).toEqual(INITIAL_STATE)
  })

  it('is a no-op while submitting (I4 — cannot cancel in-flight action)', () => {
    const state = submitState()
    const next = evidenceUploadReducer(state, { type: 'RESET' })
    expect(next).toBe(state)
  })
})

// ── Full paths ────────────────────────────────────────────────────────────────

describe('full state paths', () => {
  it('idle → submitting → submitted → idle (success then reset)', () => {
    const states = [
      INITIAL_STATE,
      evidenceUploadReducer(INITIAL_STATE, { type: 'SUBMIT', url: 'https://ex.com' }),
    ]
    states.push(evidenceUploadReducer(states[1], { type: 'RESOLVE', submissionKey: 1 }))
    states.push(evidenceUploadReducer(states[2], { type: 'RESET' }))

    expect(states[0].status).toBe('idle')
    expect(states[1].status).toBe('submitting')
    expect(states[2].status).toBe('submitted')
    expect(states[3]).toEqual(INITIAL_STATE)
  })

  it('idle → submitting → failed → idle → submitting (retry path)', () => {
    const s1 = evidenceUploadReducer(INITIAL_STATE, { type: 'SUBMIT', url: 'https://ex.com' })
    const s2 = evidenceUploadReducer(s1, { type: 'REJECT', submissionKey: 1, error: 'timeout' })
    // User edits URL to retry
    const s3 = evidenceUploadReducer(s2, { type: 'URL_CHANGE', url: 'https://ex.com' })
    const s4 = evidenceUploadReducer(s3, { type: 'SUBMIT', url: 'https://ex.com' })

    expect(s2.status).toBe('failed')
    expect(s3.status).toBe('idle')
    expect(s3.error).toBeNull()
    expect(s4.status).toBe('submitting')
    expect(s4.submissionKey).toBe(2) // fresh key — old rejection cannot interfere
  })

  it('duplicate submit events never stack: key stays at 1 regardless of call count', () => {
    const s1 = evidenceUploadReducer(INITIAL_STATE, { type: 'SUBMIT', url: 'https://ex.com' })
    const s2 = evidenceUploadReducer(s1, { type: 'SUBMIT', url: 'https://ex.com' })
    const s3 = evidenceUploadReducer(s2, { type: 'SUBMIT', url: 'https://ex.com' })
    expect(s1.submissionKey).toBe(s2.submissionKey)
    expect(s2.submissionKey).toBe(s3.submissionKey)
    expect(s3.submissionKey).toBe(1)
  })
})
