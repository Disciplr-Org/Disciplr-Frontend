import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HelpCenter from '../HelpCenter'

describe('HelpCenter', () => {
  it('renders the Help Center home view with category navigation and featured articles', () => {
    render(
      <MemoryRouter initialEntries={['/help']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Help Center/i)).toBeInTheDocument()
    expect(screen.getByText(/Browse by Category/i)).toBeInTheDocument()
    expect(screen.getByText(/Featured Articles/i)).toBeInTheDocument()
    expect(screen.getByText(/Still need help/i)).toBeInTheDocument()
  })

  it('renders a keyword search results page when a query is present', () => {
    render(
      <MemoryRouter initialEntries={['/help/search?q=vault']}>
        <Routes>
          <Route path="/help/search" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /3 results for “vault”/i })).toBeInTheDocument()
    expect(screen.getByText(/Create a vault in a few steps/i)).toBeInTheDocument()
    expect(screen.getByText(/Back to Help Center home/i)).toBeInTheDocument()
  })
})
