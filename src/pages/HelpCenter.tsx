import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

type HelpArticle = {
  title: string
  category: string
  excerpt: string
  keywords: string[]
  url: string
}

const helpArticles: HelpArticle[] = [
  {
    title: 'Create a vault in a few steps',
    category: 'Vaults',
    excerpt: 'Set a target amount, choose a deadline, and review the vault before you publish it.',
    keywords: ['vault', 'create', 'steps'],
    url: '/vaults/create',
  },
  {
    title: 'Track vault progress and milestones',
    category: 'Vaults',
    excerpt: 'Monitor milestone completion, review the vault timeline, and understand what is still pending.',
    keywords: ['vault', 'milestones', 'progress'],
    url: '/vaults',
  },
  {
    title: 'Review analytics trends',
    category: 'Analytics',
    excerpt: 'Use the analytics dashboard to compare growth, capital flow, and benchmark performance over time.',
    keywords: ['analytics', 'trends', 'reports'],
    url: '/analytics',
  },
  {
    title: 'Keep your wallet connected',
    category: 'Wallets',
    excerpt: 'Troubleshoot network mismatch warnings and keep your wallet status consistent across Disciplr.',
    keywords: ['wallet', 'network', 'freighter'],
    url: '/dashboard',
  },
  {
    title: 'Check pending validations and queue status',
    category: 'Verifier',
    excerpt: 'Review vaults waiting for approval, inspect the decision details, and move through the queue faster.',
    keywords: ['verifier', 'validation', 'queue'],
    url: '/verifier/queue',
  },
]

const categories = [
  { label: 'Vaults', description: 'Create, manage, and monitor vault activity.' },
  { label: 'Wallets', description: 'Understand network mismatches and wallet setup.' },
  { label: 'Analytics', description: 'Read trends and benchmark performance.' },
  { label: 'Verifier', description: 'Review pending validations and approvals.' },
]

const supportOptions = [
  { title: 'Live Chat', detail: 'Ask for a quick product walkthrough in real time.' },
  { title: 'Email', detail: 'support@disciplr.app' },
  { title: 'Community Forum', detail: 'Join the Disciplr Discord and discuss setup or troubleshooting.' },
]

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMatch(text: string, query: string) {
  if (!query) return text

  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'ig')
  return text.split(pattern).map((part, index) => {
    const isMatch = part.toLowerCase() === query.toLowerCase()
    return isMatch ? <mark key={`${part}-${index}`} style={{ background: 'var(--accent-transparent)', color: 'inherit' }}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>
  })
}

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q')?.trim() ?? ''
  const [draftQuery, setDraftQuery] = useState(query)

  useEffect(() => {
    setDraftQuery(query)
  }, [query])

  const filteredArticles = useMemo(() => {
    if (!query) return helpArticles

    return helpArticles.filter((article) => {
      const haystack = [article.title, article.category, article.excerpt, article.keywords.join(' ')]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query.toLowerCase())
    })
  }, [query])

  const featuredArticles = helpArticles.slice(0, 3)
  const searchResultsCount = filteredArticles.length

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = draftQuery.trim()
    if (nextQuery) {
      navigate(`/help/search?q=${encodeURIComponent(nextQuery)}`)
      setSearchParams({ q: nextQuery })
      return
    }

    navigate('/help')
    setSearchParams({})
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 700 }}>
              Help Center
            </div>
            <h1 style={{ margin: '0.35rem 0 0.45rem', fontSize: '1.9rem' }}>Get unstuck with fast answers</h1>
            <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '760px' }}>
              Browse a small but complete support MVP for vault setup, wallet troubleshooting, analytics, and verifier workflows.
            </p>
          </div>

          <form onSubmit={submitSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Search help articles"
              style={{
                flex: '1 1 260px',
                minWidth: 0,
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Browse by Category</h2>
          <Link to="/help/search?q=vault" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
            Open search results
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {categories.map((category) => (
            <Link
              key={category.label}
              to={`/help/search?q=${encodeURIComponent(category.label.toLowerCase())}`}
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{category.label}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{category.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Featured Articles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {featuredArticles.map((article) => (
            <article
              key={article.title}
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                display: 'grid',
                gap: '0.6rem',
              }}
            >
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem' }}>{article.category}</div>
              <div style={{ fontWeight: 700 }}>{article.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{article.excerpt}</div>
              <Link to={article.url} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
                Open article
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.45rem' }}>Pro Tip</div>
          <div style={{ color: 'var(--muted)' }}>
            Use the search box above to jump straight to vault, analytics, wallet, or verifier guidance from one place.
          </div>
        </div>
      </section>

      {query ? (
        <section style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{searchResultsCount} result{searchResultsCount === 1 ? '' : 's'} for “{query}”</h2>
            <Link to="/help" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
              Back to Help Center home
            </Link>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredArticles.map((article) => (
              <article
                key={article.title}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}>{article.category}</div>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{highlightMatch(article.title, query)}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>{highlightMatch(article.excerpt, query)}</div>
                <Link to={article.url} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
                  Open article
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Still need help?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {supportOptions.map((support) => (
            <div
              key={support.title}
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                display: 'grid',
                gap: '0.3rem',
              }}
            >
              <div style={{ fontWeight: 700 }}>{support.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{support.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
