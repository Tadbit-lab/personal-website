import React from 'react'

type NewsLink = {
  title: string
  link: string
}

type NewsListProps = {
  newsLinks: NewsLink[]
}

/**
 * List of news article links. Plain CSS, no styled-components.
 */
const NewsList: React.FC<NewsListProps> = ({ newsLinks }) => {
  if (!newsLinks || newsLinks.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No news available</div>
  }

  return (
    <div>
      {newsLinks.map((news, index) => (
        <a
          key={index}
          className="news-link-item"
          href={news.link}
          target="_blank"
          rel="noopener noreferrer"
          title={news.title}
        >
          {news.title}
        </a>
      ))}
    </div>
  )
}

export default NewsList