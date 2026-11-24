import React from 'react'
import { SafeLink } from '../../components/SafeLink'
import { isSafeEvidenceUrl } from '../../utils/url'
import { makeSlugContext } from '../utils/slugify'

export interface HeadingEntry {
  id: string
  level: 2 | 3
  text: string
}

interface SafeMarkdownProps {
  content: string
  /** If provided, called once after all headings are extracted. */
  onHeadings?: (headings: HeadingEntry[]) => void
}

/**
 * A lightweight, safe renderer for markdown articles without dangerouslySetInnerHTML.
 * Parses headings (###, ##, #), bullet/ordered lists, safe links, bold/inline code, and paragraphs.
 *
 * When `onHeadings` is supplied the component reports all ## and ### headings
 * (with their generated slug ids) so the parent can render a table of contents.
 */
export function SafeMarkdown({ content, onHeadings }: SafeMarkdownProps): React.JSX.Element {
  if (!content) return <div></div>

  const lines = content.split('\n')
  const elements: React.JSX.Element[] = []
  const headings: HeadingEntry[] = []

  let listType: 'ul' | 'ol' | null = null
  let currentListItems: React.JSX.Element[] = []
  let listKey = 0

  const slugContext = makeSlugContext()

  const flushList = () => {
    if (listType && currentListItems.length > 0) {
      const List = listType
      elements.push(
        <List key={`${listType}-${listKey++}`} style={{ paddingLeft: '1.5rem', margin: '0.75rem 0', display: 'grid', gap: '0.35rem' }}>
          {currentListItems}
        </List>,
      )
      currentListItems = []
      listType = null
    }
  }

  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let plainText = ''
    let key = 0

    const flushText = () => {
      if (plainText) {
        parts.push(plainText)
        plainText = ''
      }
    }

    const pushCode = (value: string) => {
      parts.push(
        <code
          key={`code-${key++}`}
          style={{
            background: 'var(--surface-raised, #27272a)',
            padding: '0.15rem 0.4rem',
            borderRadius: 'var(--radius-sm, 4px)',
            fontSize: '0.9em',
            fontFamily: 'monospace',
          }}
        >
          {value}
        </code>,
      )
    }

    let index = 0
    while (index < text.length) {
      if (text[index] === '`') {
        const end = text.indexOf('`', index + 1)
        if (end > index + 1) {
          flushText()
          pushCode(text.slice(index + 1, end))
          index = end + 1
          continue
        }
      }

      if (text.startsWith('**', index)) {
        const end = text.indexOf('**', index + 2)
        if (end > index + 2) {
          flushText()
          parts.push(
            <strong key={`strong-${key++}`} style={{ fontWeight: 700 }}>
              {text.slice(index + 2, end)}
            </strong>,
          )
          index = end + 2
          continue
        }
      }

      if (text[index] === '[') {
        const labelEnd = text.indexOf('](', index + 1)
        if (labelEnd > index + 1) {
          let depth = 1
          let end = labelEnd + 2
          while (end < text.length && depth > 0) {
            if (text[end] === '(') depth += 1
            if (text[end] === ')') depth -= 1
            end += 1
          }
          if (depth === 0) {
            const raw = text.slice(index, end)
            const label = text.slice(index + 1, labelEnd)
            const href = text.slice(labelEnd + 2, end - 1)
            flushText()
            if (isSafeEvidenceUrl(href)) {
              parts.push(
                <SafeLink key={`link-${key++}`} href={href}>
                  {label}
                </SafeLink>,
              )
            } else {
              parts.push(raw)
            }
            index = end
            continue
          }
        }
      }

      plainText += text[index]
      index += 1
    }

    flushText()
    return parts
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      const text = trimmed.slice(4)
      const id = slugContext(text)
      headings.push({ id, level: 3, text })
      elements.push(
        <h3
          key={`h3-${index}`}
          id={id}
          tabIndex={-1}
          style={{ margin: '1.25rem 0 0.5rem', fontSize: '1.2rem', color: 'var(--text)' }}
        >
          {renderInline(text)}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      const text = trimmed.slice(3)
      const id = slugContext(text)
      headings.push({ id, level: 2, text })
      elements.push(
        <h2
          key={`h2-${index}`}
          id={id}
          tabIndex={-1}
          style={{ margin: '1.5rem 0 0.6rem', fontSize: '1.4rem', color: 'var(--text)' }}
        >
          {renderInline(text)}
        </h2>
      )
      return
    }

    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${index}`} style={{ margin: '1.75rem 0 0.75rem', fontSize: '1.75rem', color: 'var(--text)' }}>
          {renderInline(trimmed.slice(2))}
        </h1>
      )
      return
    }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (isBullet || orderedMatch) {
      const nextListType = orderedMatch ? 'ol' : 'ul'
      if (listType && listType !== nextListType) flushList()
      listType = nextListType
      currentListItems.push(
        <li key={`li-${index}`} style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          {renderInline(orderedMatch ? orderedMatch[1] : trimmed.slice(2))}
        </li>
      )
      return
    }

    flushList()
    elements.push(
      <p key={`p-${index}`} style={{ margin: '0.6rem 0', color: 'var(--muted)', lineHeight: 1.65 }}>
        {renderInline(trimmed)}
      </p>
    )
  })

  flushList()

  // Report headings to the parent after render (synchronous — same tick as render).
  if (onHeadings) {
    onHeadings(headings)
  }

  return <div style={{ display: 'grid', gap: '0.5rem' }}>{elements}</div>
}
