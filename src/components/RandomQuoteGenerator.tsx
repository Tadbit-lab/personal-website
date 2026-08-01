import { useState, useEffect, useCallback } from 'react'
import './RandomQuoteGenerator.css'

interface Quote {
  text: string
  author: string
}

export default function RandomQuoteGenerator() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      const apiKey = import.meta.env.VITE_QUOTES_API_KEY
      const headers: Record<string, string> = {}
      if (apiKey) {
        headers['X-Api-Key'] = apiKey
      }

      let res: Response | null = null

      if (apiKey) {
        res = await fetch('https://api.api-ninjas.com/v1/quotes', { headers }).catch(() => null)
      }

      if (!res || !res.ok) {
        res = await fetch('https://api.quotable.io/random').catch(() => null)
      }

      if (!res || !res.ok) {
        res = await fetch('https://dummyjson.com/quotes/random').catch(() => null)
      }

      if (!res || !res.ok) {
        throw new Error('All quote API endpoints failed')
      }

      const data = await res.json()
      let text = ''
      let author = ''

      if (Array.isArray(data) && data.length > 0) {
        text = data[0].quote || data[0].text || ''
        author = data[0].author || 'Unknown'
      } else if (data && typeof data === 'object') {
        text = data.quote || data.content || data.text || ''
        author = data.author || 'Unknown'
      }

      if (!text) {
        throw new Error('Invalid quote payload')
      }

      setQuote({ text, author })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  return (
    <div className="quote-container">
      <div className="quote-content">
        {loading ? (
          <div className="spinner" />
        ) : error ? (
          <p className="quote-error">Unable to fetch quote.</p>
        ) : quote ? (
          <>
            <blockquote className="quote-text">"{quote.text}"</blockquote>
            <p className="quote-author">— {quote.author}</p>
          </>
        ) : null}
      </div>
      <button
        type="button"
        className="quote-button"
        onClick={fetchQuote}
        disabled={loading}
      >
        {loading ? 'Fetching...' : 'New Quote'}
      </button>
    </div>
  )
}
