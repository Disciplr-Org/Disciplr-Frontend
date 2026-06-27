import { fireEvent, render, screen } from '@testing-library/react'
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

      // dragover default should be prevented to allow drop
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
        />
      )

      const dropZone = screen.getByTestId('evidence-drop-zone')

      // Accepted type
      const txtFile = new File(['content'], 'notes.txt', { type: 'text/plain' })
      fireEvent.drop(dropZone, { dataTransfer: { files: [txtFile] } })
      expect(handleFileSelect).toHaveBeenCalledWith(txtFile)

      handleFileSelect.mockClear()

      // Now drop a pdf which is not in custom accepted list
      const pdfFile = new File(['content'], 'proof.pdf', { type: 'application/pdf' })
      fireEvent.drop(dropZone, { dataTransfer: { files: [pdfFile] } })
      expect(handleFileSelect).not.toHaveBeenCalled()
    })
  })
})
