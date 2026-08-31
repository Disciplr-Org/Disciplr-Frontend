import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { Field } from './Field'
import { Text } from './Text'
import { normalizeEvidenceUrl } from '../utils/url'
import {
  evidenceUploadReducer,
  INITIAL_STATE,
} from '../utils/evidenceUploadMachine'

// ── Constants ─────────────────────────────────────────────────────────────────

type EvidenceUrlStatus = 'empty' | 'invalid' | 'valid'

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'video/mp4',
  'video/webm',
]

const ACCEPTED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.mp4',
  '.webm',
]

/** Default maximum file size: 50 MB */
const DEFAULT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EvidenceUploadProps {
  id?: string
  label?: string
  /** Controlled value for the URL input. */
  value?: string
  required?: boolean
  /** Fires when the URL input changes; receives the normalized URL or undefined. */
  onChange?: (evidenceUrl: string | undefined) => void
  /**
   * Async submit handler. Return a resolved promise on success or throw / return
   * a rejected promise on failure. The component transitions to `submitting`
   * while the promise is in flight and to `submitted` or `failed` when it
   * settles, preventing duplicate submissions and surfacing errors inline.
   */
  onSubmit?: (evidenceUrl: string) => Promise<void> | void
  /** Fires when a valid, within-limit file is dropped or browsed. */
  onFileSelect?: (file: File) => void
  /**
   * Called when the component resets to idle after a submission outcome.
   * Useful for parents to clear their own submission state.
   */
  onReset?: () => void
  acceptedFileTypes?: string[]
  /** Maximum allowed file size in bytes. Defaults to 50 MB. */
  maxFileSizeBytes?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvidenceUpload({
  id,
  label = 'Evidence URL',
  value = '',
  required = false,
  onChange,
  onSubmit,
  onFileSelect,
  onReset,
  acceptedFileTypes = ACCEPTED_FILE_TYPES,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
}: EvidenceUploadProps) {
  const generatedId = useId()
  const fieldId = id || `evidence-upload-${generatedId}`

  // ── Submission state machine ───────────────────────────────────────────────
  const [machine, dispatch] = useReducer(evidenceUploadReducer, INITIAL_STATE)
  const isSubmitting = machine.status === 'submitting'
  const isSubmitted = machine.status === 'submitted'
  const isLocked = isSubmitting || isSubmitted

  // ── URL field state ────────────────────────────────────────────────────────
  const [rawValue, setRawValue] = useState(value)
  const [touched, setTouched] = useState(false)

  // ── Drop zone state ────────────────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragError, setDragError] = useState<string | undefined>(undefined)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync controlled `value` prop into local state, but never while the machine
  // is mid-flight — the URL committed on-chain must not silently change.
  useEffect(() => {
    if (!isLocked) {
      setRawValue(value)
    }
  }, [value, isLocked])

  const normalizedUrl = useMemo(() => normalizeEvidenceUrl(rawValue), [rawValue])
  const hasInput = rawValue.trim().length > 0
  const urlStatus: EvidenceUrlStatus = !hasInput
    ? 'empty'
    : normalizedUrl
    ? 'valid'
    : 'invalid'

  const urlError =
    touched && urlStatus === 'invalid'
      ? 'Enter a safe evidence URL starting with http:// or https://.'
      : undefined

  // ── URL field handlers ─────────────────────────────────────────────────────

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isLocked) return
      const nextValue = event.target.value
      const nextUrl = normalizeEvidenceUrl(nextValue)
      setRawValue(nextValue)
      setDroppedFile(null)
      setDragError(undefined)
      dispatch({ type: 'URL_CHANGE', url: nextUrl ?? null })
      onChange?.(nextUrl ?? undefined)
    },
    [isLocked, onChange],
  )

  // ── Submission ─────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    // Guard: do not re-enter if already locked.
    if (isLocked || !normalizedUrl) return

    setTouched(true)

    // Move the machine into `submitting` and capture the key for this flight.
    dispatch({ type: 'SUBMIT', url: normalizedUrl })
  }, [isLocked, normalizedUrl])

  // Stable ref so the submission effect can read the latest onSubmit prop
  // without being listed as a reactive dependency — we never want a prop
  // change to re-fire an already-started submission.
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  })

  // Effect watches for the machine entering `submitting` and fires the async
  // handler. This separation keeps the reducer pure and allows the key-based
  // stale-response guard to work correctly across retries.
  useEffect(() => {
    if (machine.status !== 'submitting') return

    // Capture the key for this flight so the closure can match it on settle.
    const key = machine.submissionKey

    // If no handler is provided, resolve immediately — the machine still
    // transitions to `submitted` so the button is locked until RESET.
    const handler = onSubmitRef.current
    const work = handler ? handler(machine.pendingUrl!) : Promise.resolve()

    Promise.resolve(work).then(
      () => {
        dispatch({ type: 'RESOLVE', submissionKey: key })
      },
      (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'The submission could not be completed. Please try again.'
        dispatch({ type: 'REJECT', submissionKey: key, error: message })
      },
    )
    // No cleanup that dispatches — an unmounted component should not alter
    // state. The key guard in the reducer handles stale responses correctly.
  }, [machine.status, machine.submissionKey])

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (isSubmitting) return
    dispatch({ type: 'RESET' })
    setRawValue('')
    setTouched(false)
    setDroppedFile(null)
    setDragError(undefined)
    onChange?.(undefined)
    onReset?.()
  }, [isSubmitting, onChange, onReset])

  // ── File handlers ──────────────────────────────────────────────────────────

  const processFile = useCallback(
    (file: File) => {
      if (isLocked) return

      if (!acceptedFileTypes.includes(file.type)) {
        setDragError(
          `File type not accepted. Allowed types: ${ACCEPTED_FILE_EXTENSIONS.join(', ')}.`,
        )
        setDroppedFile(null)
        return
      }

      if (file.size > maxFileSizeBytes) {
        const limitMb = (maxFileSizeBytes / (1024 * 1024)).toFixed(0)
        const fileMb = (file.size / (1024 * 1024)).toFixed(1)
        setDragError(
          `File is too large (${fileMb} MB). Maximum allowed size is ${limitMb} MB.`,
        )
        setDroppedFile(null)
        return
      }

      setDragError(undefined)
      setDroppedFile(file)
      dispatch({ type: 'FILE_CHANGE', file })
      onFileSelect?.(file)
    },
    [isLocked, acceptedFileTypes, maxFileSizeBytes, onFileSelect],
  )

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isLocked) setIsDragOver(true)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isLocked) setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    if (isLocked) return

    const files = event.dataTransfer.files
    if (files.length === 0) return

    if (files.length > 1) {
      setDragError('Only one file can be attached at a time.')
      return
    }

    processFile(files[0])
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    processFile(files[0])
    event.target.value = ''
  }

  const handleBrowseClick = () => {
    if (!isLocked) fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    if (isLocked) return
    setDroppedFile(null)
    setDragError(undefined)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const dropZoneStyles: CSSProperties = {
    border: `2px dashed ${
      isLocked
        ? 'var(--border)'
        : isDragOver
        ? 'var(--accent)'
        : dragError
        ? 'var(--danger)'
        : 'var(--border)'
    }`,
    borderRadius: 'var(--radius)',
    padding: 'var(--spacing-4)',
    textAlign: 'center' as const,
    background: isDragOver && !isLocked ? 'var(--surface-raised)' : 'var(--surface)',
    transition: 'border-color 0.15s ease, background 0.15s ease',
    cursor: isLocked ? 'not-allowed' : 'pointer',
    opacity: isLocked ? 'var(--opacity-disabled, 0.55)' : undefined,
  }

  // ── Derived labels for submit button ──────────────────────────────────────

  const submitLabel = isSubmitting
    ? 'Attaching…'
    : isSubmitted
    ? 'Attached'
    : 'Attach Evidence'

  const submitDisabled = isLocked || !normalizedUrl

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      data-status={machine.status}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
      }}
    >
      <Field
        id={fieldId}
        label={label}
        type="url"
        inputMode="url"
        value={rawValue}
        onChange={handleChange}
        onBlur={() => !isLocked && setTouched(true)}
        placeholder="https://github.com/org/repo/pull/42"
        required={required}
        error={urlError}
        hint={
          urlStatus === 'empty'
            ? 'Attach a public http or https link to milestone evidence.'
            : undefined
        }
        disabled={isLocked}
        aria-busy={isSubmitting ? 'true' : undefined}
      />

      {urlStatus === 'valid' && normalizedUrl && !isSubmitted && (
        <Text role="caption" as="span" style={{ color: 'var(--success)' }}>
          Evidence link accepted: {normalizedUrl}
        </Text>
      )}

      {/* Submission success banner */}
      {isSubmitted && (
        <div
          role="status"
          aria-live="polite"
          data-testid="submission-success"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
          }}
        >
          <Text role="caption" as="span">
            Evidence submitted successfully.
          </Text>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
              textDecoration: 'underline',
            }}
            aria-label="Reset evidence upload form"
          >
            Reset
          </button>
        </div>
      )}

      {/* Submission error banner */}
      {machine.status === 'failed' && machine.error && (
        <div
          role="alert"
          data-testid="submission-error"
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
          }}
        >
          <Text role="caption" as="span">
            {machine.error}
          </Text>
        </div>
      )}

      {/* Drag-and-drop zone */}
      <div
        data-testid="evidence-drop-zone"
        aria-label="Drop evidence file here or click to browse"
        aria-disabled={isLocked}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-dropeffect="copy"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        onKeyDown={(e) => {
          if (isLocked) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleBrowseClick()
          }
        }}
        style={dropZoneStyles}
      >
        {isDragOver && !isLocked ? (
          <Text role="caption" as="span" style={{ color: 'var(--accent)' }}>
            Drop file to attach
          </Text>
        ) : droppedFile ? (
          <Text role="caption" as="span" style={{ color: 'var(--success)' }}>
            File attached: {droppedFile.name}
          </Text>
        ) : (
          <Text role="caption" as="span" style={{ color: 'var(--muted)' }}>
            Drag and drop a file here, or{' '}
            <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              browse
            </span>
            <br />
            Accepted types: {ACCEPTED_FILE_EXTENSIONS.join(', ')}
            <br />
            Max size: {(maxFileSizeBytes / (1024 * 1024)).toFixed(0)} MB
          </Text>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
        disabled={isLocked}
      />

      {dragError && (
        <Text
          role="caption"
          as="span"
          style={{ color: 'var(--danger)' }}
          data-testid="drag-error"
        >
          {dragError}
        </Text>
      )}

      {droppedFile && !isLocked && (
        <button
          type="button"
          onClick={handleRemoveFile}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Remove file
        </button>
      )}

      {onSubmit && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitDisabled}
          aria-busy={isSubmitting}
          style={{
            alignSelf: 'flex-start',
            background: submitDisabled
              ? 'var(--surface-raised)'
              : 'var(--accent)',
            border: 'var(--border-width-1) solid var(--border)',
            borderRadius: 'var(--radius)',
            color: submitDisabled ? 'var(--muted)' : 'var(--bg)',
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            minHeight: 'var(--touch-target)',
            padding: 'var(--spacing-2) var(--spacing-4)',
          }}
        >
          {submitLabel}
        </button>
      )}
    </div>
  )
}
