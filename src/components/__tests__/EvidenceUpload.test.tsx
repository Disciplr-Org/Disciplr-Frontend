import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EvidenceUpload } from '../EvidenceUpload'

describe('EvidenceUpload', () => {
  it('renders an accessible evidence URL field with empty-state guidance', () => {
    render(<EvidenceUpload />)

    expect(screen.getByLabelText('Evidence URL')).toBeInTheDocument()
    expect(screen.getByText(/Attach a public http or https link/)).toBeInTheDocument()
  })

  it('emits trimmed http or https evidence URLs', () => {
    const handleChange = vi.fn()
    render(<EvidenceUpload onChange={handleChange} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: '  https://github.com/org/repo/pull/42  ' },
    })

    expect(handleChange).toHaveBeenLastCalledWith('https://github.com/org/repo/pull/42')
    expect(screen.getByText(/Evidence link accepted/)).toBeInTheDocument()
  })

  it('rejects unsafe URL schemes and marks the field invalid after blur', () => {
    const handleChange = vi.fn()
    render(<EvidenceUpload onChange={handleChange} />)

    const input = screen.getByLabelText('Evidence URL')
    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } })
    fireEvent.blur(input)

    expect(handleChange).toHaveBeenLastCalledWith(undefined)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/starting with http:\/\/ or https:\/\//)).toBeInTheDocument()
  })

  it('submits only validated evidence URLs', () => {
    const handleSubmit = vi.fn()
    render(<EvidenceUpload onSubmit={handleSubmit} />)

    const button = screen.getByRole('button', { name: 'Attach Evidence' })
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    fireEvent.click(button)

    expect(handleSubmit).toHaveBeenCalledWith('https://example.com/proof')
  })

  describe('drag-and-drop', () => {
    it('renders a drop zone with accessible label', () => {
      render(<EvidenceUpload />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      expect(dropZone).toBeInTheDocument()
      expect(dropZone).toHaveAttribute('aria-label', 'Drop evidence file here or click to browse')
      expect(dropZone).toHaveAttribute('role', 'button')
    })

    it('shows drag-over state when dragging over the drop zone', () => {
      render(<EvidenceUpload />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      fireEvent.dragEnter(dropZone)
      expect(screen.getByText(/Drop file to attach/)).toBeInTheDocument()
    })

    it('shows idle state after dragging leaves the drop zone', () => {
      render(<EvidenceUpload />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      fireEvent.dragEnter(dropZone)
      fireEvent.dragLeave(dropZone)
      expect(screen.getByText(/Drag and drop a file here/)).toBeInTheDocument()
    })

    it('accepts a valid file type on drop and calls onFileSelect', () => {
      const handleFileSelect = vi.fn()
      render(<EvidenceUpload onFileSelect={handleFileSelect} />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const file = new File(['content'], 'proof.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      expect(handleFileSelect).toHaveBeenCalledWith(file)
      expect(screen.getByText(/File attached: proof\.pdf/)).toBeInTheDocument()
    })

    it('rejects disallowed file types with an error message', () => {
      const handleFileSelect = vi.fn()
      render(<EvidenceUpload onFileSelect={handleFileSelect} />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const file = new File(['content'], 'malware.exe', { type: 'application/x-msdownload' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      expect(handleFileSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('drag-error')).toBeInTheDocument()
      expect(screen.getByText(/File type not accepted/)).toBeInTheDocument()
    })

    it('rejects multiple files dropped at once', () => {
      render(<EvidenceUpload />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const file1 = new File(['a'], 'proof.pdf', { type: 'application/pdf' })
      const file2 = new File(['b'], 'proof2.pdf', { type: 'application/pdf' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file1, file2] },
      })

      expect(screen.getByText(/Only one file can be attached at a time/)).toBeInTheDocument()
    })

    it('allows removing an attached file', () => {
      render(<EvidenceUpload onFileSelect={vi.fn()} />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const file = new File(['content'], 'proof.png', { type: 'image/png' })

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      expect(screen.getByText(/File attached: proof\.png/)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Remove file' }))
      expect(screen.queryByText(/File attached/)).not.toBeInTheDocument()
      expect(screen.getByText(/Drag and drop a file here/)).toBeInTheDocument()
    })

    it('prevents default drag behavior to enable drop', () => {
      render(<EvidenceUpload />)
      const dropZone = screen.getByTestId('evidence-drop-zone')

      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true })
      dropZone.dispatchEvent(dragOverEvent)

      expect(dragOverEvent.defaultPrevented).toBe(true)
    })
  })

  describe('file type validation', () => {
    const validTypes = [
      { name: 'image.jpg', type: 'image/jpeg' },
      { name: 'image.png', type: 'image/png' },
      { name: 'image.gif', type: 'image/gif' },
      { name: 'image.webp', type: 'image/webp' },
      { name: 'document.pdf', type: 'application/pdf' },
      { name: 'notes.txt', type: 'text/plain' },
      { name: 'video.mp4', type: 'video/mp4' },
      { name: 'video.webm', type: 'video/webm' },
    ]

    validTypes.forEach(({ name, type }) => {
      it(`accepts ${type} files`, () => {
        const handleFileSelect = vi.fn()
        render(<EvidenceUpload onFileSelect={handleFileSelect} />)

        const dropZone = screen.getByTestId('evidence-drop-zone')
        const file = new File(['content'], name, { type })

        fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

        expect(handleFileSelect).toHaveBeenCalledWith(file)
        expect(screen.queryByTestId('drag-error')).not.toBeInTheDocument()
      })
    })

    const invalidTypes = [
      { name: 'script.js', type: 'application/javascript' },
      { name: 'archive.zip', type: 'application/zip' },
      { name: 'binary.exe', type: 'application/x-msdownload' },
    ]

    invalidTypes.forEach(({ name, type }) => {
      it(`rejects ${type} files`, () => {
        const handleFileSelect = vi.fn()
        render(<EvidenceUpload onFileSelect={handleFileSelect} />)

        const dropZone = screen.getByTestId('evidence-drop-zone')
        const file = new File(['content'], name, { type })

        fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

        expect(handleFileSelect).not.toHaveBeenCalled()
        expect(screen.getByTestId('drag-error')).toBeInTheDocument()
      })
    })

    it('accepts custom acceptedFileTypes when provided', () => {
      const handleFileSelect = vi.fn()
      render(
        <EvidenceUpload
          onFileSelect={handleFileSelect}
          acceptedFileTypes={['text/plain']}
        />,
      )

      const dropZone = screen.getByTestId('evidence-drop-zone')

      const txtFile = new File(['content'], 'notes.txt', { type: 'text/plain' })
      fireEvent.drop(dropZone, { dataTransfer: { files: [txtFile] } })
      expect(handleFileSelect).toHaveBeenCalledWith(txtFile)

      handleFileSelect.mockClear()

      const pdfFile = new File(['content'], 'proof.pdf', { type: 'application/pdf' })
      fireEvent.drop(dropZone, { dataTransfer: { files: [pdfFile] } })
      expect(handleFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('file size validation', () => {
    it('accepts a file within the default 50 MB limit', () => {
      const handleFileSelect = vi.fn()
      render(<EvidenceUpload onFileSelect={handleFileSelect} />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const smallFile = new File([new ArrayBuffer(1024 * 1024)], 'proof.pdf', { type: 'application/pdf' })
      fireEvent.drop(dropZone, { dataTransfer: { files: [smallFile] } })

      expect(handleFileSelect).toHaveBeenCalledWith(smallFile)
      expect(screen.queryByTestId('drag-error')).not.toBeInTheDocument()
    })

    it('rejects a file that exceeds the default 50 MB limit', () => {
      const handleFileSelect = vi.fn()
      render(<EvidenceUpload onFileSelect={handleFileSelect} />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const bigFile = Object.defineProperty(
        new File(['x'], 'huge-video.mp4', { type: 'video/mp4' }),
        'size',
        { value: 60 * 1024 * 1024 },
      )
      fireEvent.drop(dropZone, { dataTransfer: { files: [bigFile] } })

      expect(handleFileSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('drag-error')).toBeInTheDocument()
      expect(screen.getByText(/File is too large/)).toBeInTheDocument()
      expect(screen.getByText(/Maximum allowed size is 50 MB/)).toBeInTheDocument()
    })

    it('respects a custom maxFileSizeBytes prop', () => {
      const handleFileSelect = vi.fn()
      render(<EvidenceUpload onFileSelect={handleFileSelect} maxFileSizeBytes={1024} />)

      const dropZone = screen.getByTestId('evidence-drop-zone')
      const tooBig = Object.defineProperty(
        new File(['x'], 'proof.pdf', { type: 'application/pdf' }),
        'size',
        { value: 2048 },
      )
      fireEvent.drop(dropZone, { dataTransfer: { files: [tooBig] } })

      expect(handleFileSelect).not.toHaveBeenCalled()
      expect(screen.getByTestId('drag-error')).toBeInTheDocument()
      expect(screen.getByText(/File is too large/)).toBeInTheDocument()
    })

    it('shows the max file size in the drop zone hint', () => {
      render(<EvidenceUpload maxFileSizeBytes={10 * 1024 * 1024} />)
      expect(screen.getByText(/Max size: 10 MB/)).toBeInTheDocument()
    })
  })
})

// ── State machine integration tests ──────────────────────────────────────────

describe('submission state machine', () => {
  // ── Success path ──────────────────────────────────────────────────────────

  it('shows Attaching… label while onSubmit is in flight', async () => {
    let resolveSubmit!: () => void
    const onSubmit = vi.fn(() => new Promise<void>((res) => { resolveSubmit = res }))

    render(<EvidenceUpload onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))

    expect(screen.getByRole('button', { name: 'Attaching…' })).toBeDisabled()

    await act(async () => { resolveSubmit() })
  })

  it('transitions to Attached and shows success banner after resolution', async () => {
    const onSubmit = vi.fn(() => Promise.resolve())
    render(<EvidenceUpload onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    expect(screen.getByTestId('submission-success')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attached' })).toBeDisabled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  // ── Duplicate-submit guard ────────────────────────────────────────────────

  it('does not call onSubmit a second time when clicked while in flight', async () => {
    let resolveSubmit!: () => void
    const onSubmit = vi.fn(() => new Promise<void>((res) => { resolveSubmit = res }))

    render(<EvidenceUpload onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))

    const btn = screen.getByRole('button', { name: 'Attaching…' })
    fireEvent.click(btn)
    fireEvent.click(btn)

    expect(onSubmit).toHaveBeenCalledTimes(1)

    await act(async () => { resolveSubmit() })
  })

  it('does not call onSubmit again after the submission has already succeeded', async () => {
    const onSubmit = vi.fn(() => Promise.resolve())
    render(<EvidenceUpload onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    fireEvent.click(screen.getByRole('button', { name: 'Attached' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  // ── Failure and retry ─────────────────────────────────────────────────────

  it('shows error banner and allows retry after onSubmit rejects', async () => {
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce(undefined)

    render(<EvidenceUpload onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    expect(screen.getByTestId('submission-error')).toBeInTheDocument()
    expect(screen.getByText('Network timeout')).toBeInTheDocument()

    // Edit clears the error and re-enables submit
    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    expect(screen.queryByTestId('submission-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('submission-success')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('shows a fallback message when onSubmit rejects with a non-Error value', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce('string rejection')
    render(<EvidenceUpload onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    expect(screen.getByTestId('submission-error')).toBeInTheDocument()
    expect(screen.getByText(/The submission could not be completed/)).toBeInTheDocument()
  })

  // ── Reset ─────────────────────────────────────────────────────────────────

  it('resets form to idle after clicking Reset on the success banner', async () => {
    const onReset = vi.fn()
    const onSubmit = vi.fn(() => Promise.resolve())
    render(<EvidenceUpload onSubmit={onSubmit} onReset={onReset} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    expect(screen.getByTestId('submission-success')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset evidence upload form' }))

    expect(screen.queryByTestId('submission-success')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Attach Evidence' })).toBeDisabled()
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  // ── Lock during flight ────────────────────────────────────────────────────

  it('disables URL input and drop zone while submitting', async () => {
    let resolveSubmit!: () => void
    const onSubmit = vi.fn(() => new Promise<void>((res) => { resolveSubmit = res }))
    render(<EvidenceUpload onSubmit={onSubmit} onFileSelect={vi.fn()} />)

    const dropZone = screen.getByTestId('evidence-drop-zone')
    const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))

    expect(screen.getByLabelText('Evidence URL')).toBeDisabled()
    expect(dropZone).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('button', { name: 'Remove file' })).not.toBeInTheDocument()

    await act(async () => { resolveSubmit() })
  })

  it('ignores drop events while the form is locked', async () => {
    let resolveSubmit!: () => void
    const onFileSelect = vi.fn()
    const onSubmit = vi.fn(() => new Promise<void>((res) => { resolveSubmit = res }))
    render(<EvidenceUpload onSubmit={onSubmit} onFileSelect={onFileSelect} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))

    const dropZone = screen.getByTestId('evidence-drop-zone')
    const file = new File(['x'], 'other.pdf', { type: 'application/pdf' })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

    expect(onFileSelect).not.toHaveBeenCalled()

    await act(async () => { resolveSubmit() })
  })

  it('ignores URL changes while the form is locked', async () => {
    let resolveSubmit!: () => void
    const onChange = vi.fn()
    const onSubmit = vi.fn(() => new Promise<void>((res) => { resolveSubmit = res }))
    render(<EvidenceUpload onSubmit={onSubmit} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    onChange.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://attacker.com/hijack' },
    })

    expect(onChange).not.toHaveBeenCalled()

    await act(async () => { resolveSubmit() })
  })

  // ── Controlled value prop ─────────────────────────────────────────────────

  it('does not sync a new controlled value prop while in flight', async () => {
    let resolveSubmit!: () => void
    const onSubmit = vi.fn(() => new Promise<void>((res) => { resolveSubmit = res }))

    const { rerender } = render(
      <EvidenceUpload value="https://example.com/original" onSubmit={onSubmit} />,
    )

    const input = screen.getByLabelText('Evidence URL')
    expect(input).toHaveValue('https://example.com/original')

    fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))

    rerender(
      <EvidenceUpload value="https://example.com/changed-by-parent" onSubmit={onSubmit} />,
    )

    expect(input).toHaveValue('https://example.com/original')

    await act(async () => { resolveSubmit() })
  })

  // ── data-status attribute ─────────────────────────────────────────────────

  it('reflects machine status in data-status attribute', async () => {
    const onSubmit = vi.fn(() => Promise.resolve())
    const { container } = render(<EvidenceUpload onSubmit={onSubmit} />)
    const root = container.firstChild as HTMLElement

    expect(root).toHaveAttribute('data-status', 'idle')

    fireEvent.change(screen.getByLabelText('Evidence URL'), {
      target: { value: 'https://example.com/proof' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Attach Evidence' }))
    })

    expect(root).toHaveAttribute('data-status', 'submitted')

    fireEvent.click(screen.getByRole('button', { name: 'Reset evidence upload form' }))
    expect(root).toHaveAttribute('data-status', 'idle')
  })
})
