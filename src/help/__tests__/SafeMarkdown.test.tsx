import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SafeMarkdown } from '../components/SafeMarkdown'

describe('SafeMarkdown heading ids', () => {
  it('renders all heading levels with inline formatting', () => {
    render(<SafeMarkdown content={'# **Title**\n## **Section**\n### `Step`'} />)

    expect(screen.getByRole('heading', { level: 1 }).querySelector('strong')).toHaveTextContent('Title')
    expect(screen.getByRole('heading', { level: 2 }).querySelector('strong')).toHaveTextContent('Section')
    expect(screen.getByRole('heading', { level: 3 }).querySelector('code')).toHaveTextContent('Step')
  })

  it('gives ## headings slug ids', () => {
    render(<SafeMarkdown content={'## Hello World'} />)
    expect(document.getElementById('hello-world')).not.toBeNull()
  })

  it('gives ### headings slug ids', () => {
    render(<SafeMarkdown content={'### Step 1: Connect'} />)
    expect(document.getElementById('step-1-connect')).not.toBeNull()
  })

  it('suffixes duplicate heading ids with -2', () => {
    render(
      <SafeMarkdown
        content={`## Overview\n## Overview`}
      />
    )
    expect(document.getElementById('overview')).not.toBeNull()
    expect(document.getElementById('overview-2')).not.toBeNull()
  })

  it('sets tabIndex={-1} on ## headings', () => {
    render(<SafeMarkdown content={'## Focusable'} />)
    const heading = document.getElementById('focusable')
    expect(heading).not.toBeNull()
    expect(heading?.tabIndex).toBe(-1)
  })

  it('does not set an id on # headings', () => {
    render(<SafeMarkdown content={'# Top Level'} />)
    // h1 rendered by SafeMarkdown has no id attribute
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.id).toBe('')
  })
})

describe('SafeMarkdown onHeadings callback', () => {
  it('calls onHeadings with all ## and ### entries', () => {
    const onHeadings = vi.fn()
    render(
      <SafeMarkdown
        content={`## First\n### Sub\n## Second`}
        onHeadings={onHeadings}
      />
    )
    expect(onHeadings).toHaveBeenCalledOnce()
    const headings = onHeadings.mock.calls[0][0]
    expect(headings).toHaveLength(3)
    expect(headings[0]).toMatchObject({ id: 'first', level: 2, text: 'First' })
    expect(headings[1]).toMatchObject({ id: 'sub', level: 3, text: 'Sub' })
    expect(headings[2]).toMatchObject({ id: 'second', level: 2, text: 'Second' })
  })

  it('calls onHeadings with an empty array when there are no headings', () => {
    const onHeadings = vi.fn()
    render(<SafeMarkdown content={'Just a paragraph.'} onHeadings={onHeadings} />)
    expect(onHeadings).toHaveBeenCalledWith([])
  })

  it('does not include # (h1) headings in the onHeadings list', () => {
    const onHeadings = vi.fn()
    render(
      <SafeMarkdown
        content={`# Title\n## Section`}
        onHeadings={onHeadings}
      />
    )
    const headings = onHeadings.mock.calls[0][0]
    expect(headings).toHaveLength(1)
    expect(headings[0].level).toBe(2)
  })
})

describe('SafeMarkdown lists, links, and inline content', () => {
  it('renders consecutive bullet lines as one list and closes the list at a blank line', () => {
    const { container } = render(<SafeMarkdown content={'- a\n- b\n\npara'} />)

    expect(container.querySelectorAll('ul')).toHaveLength(1)
    expect(container.querySelectorAll('ul li')).toHaveLength(2)
    expect(screen.getByText('para').tagName).toBe('P')
  })

  it('starts a new list after a blank line', () => {
    const { container } = render(<SafeMarkdown content={'- a\n\n- b'} />)

    expect(container.querySelectorAll('ul')).toHaveLength(2)
    expect(container.querySelectorAll('ul li')).toHaveLength(2)
  })

  it('renders consecutive numbered lines as one ordered list', () => {
    render(<SafeMarkdown content={'1. First\n2. Second'} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(list).toHaveTextContent('FirstSecond')
  })

  it('ends an ordered list at the next paragraph', () => {
    render(<SafeMarkdown content={'1. First\n2. Second\nA paragraph'} />)

    expect(screen.getByRole('list')).toHaveTextContent('FirstSecond')
    expect(screen.getByText('A paragraph').tagName).toBe('P')
  })

  it('renders safe HTTPS Markdown links through SafeLink', () => {
    render(<SafeMarkdown content={'Read [the docs](https://example.com/docs).'} />)

    const link = screen.getByRole('link', { name: 'the docs' })
    expect(link).toHaveAttribute('href', 'https://example.com/docs')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//host.example/path',
    'not-a-url',
  ])('renders unsafe Markdown destination %s as literal text', (href) => {
    const markdown = `[a](${href})`
    render(<SafeMarkdown content={markdown} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(markdown)).toBeInTheDocument()
  })

  it('preserves heading, bullet, bold, and inline-code rendering', () => {
    render(<SafeMarkdown content={'## Heading\n- Bullet\n**bold** and ` [x](javascript:alert(1)) `'} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Heading' })).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveTextContent('Bullet')
    expect(screen.getByText('bold')).toBeInTheDocument()
    expect(screen.getByText('[x](javascript:alert(1))').tagName).toBe('CODE')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('leaves malformed Markdown links as plain text', () => {
    const markdown = '[broken](https://example.com'
    render(<SafeMarkdown content={markdown} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(markdown)).toBeInTheDocument()
  })

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
  ])('renders hostile HTML as literal text: %s', (payload) => {
    const { container } = render(<SafeMarkdown content={payload} />)

    expect(screen.getByText(payload)).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders empty content as an empty container', () => {
    const { container } = render(<SafeMarkdown content="" />)

    expect(container.firstElementChild).toBeInTheDocument()
    expect(container.firstElementChild?.childElementCount).toBe(0)
    expect(container.firstElementChild).toBeEmptyDOMElement()
  })

  it('leaves unclosed bold markers and a lone backtick literal', () => {
    const markdown = '**unclosed and `'
    const { container } = render(<SafeMarkdown content={markdown} />)

    expect(screen.getByText(markdown)).toBeInTheDocument()
    expect(container.querySelector('strong')).toBeNull()
    expect(container.querySelector('code')).toBeNull()
  })
})
