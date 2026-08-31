import { Link } from 'react-router-dom'
import RandomQuoteGenerator from '../components/RandomQuoteGenerator'

function Landing() {
  return (
    <main
      className="landing-page page-image"
      style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/hero.webp')` }}
    >
      {/* Solid translucent overlay — no blur, no gradient */}
      <div className="hero-overlay" aria-hidden="true" />

      <section className="landing-content" aria-labelledby="landing-title">
        <p className="eyebrow">PERSONAL SYSTEMS / 01</p>
        <h1 id="landing-title">Personal Systems</h1>
        <p className="landing-subtitle">Craps game simulation and stocks dashboard.</p>
        <div className="landing-actions">
          <Link className="action-button" to="/craps">
            Launch Craps Game <span aria-hidden="true">↗</span>
          </Link>
          <Link className="action-button" to="/dashboard">
            Open Stock Dashboard <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <div className="hero-quote" aria-label="Random quote">
        <RandomQuoteGenerator />
      </div>

      <footer className="landing-footer">
        <span>TONILOBA ILESANMI</span>
      </footer>
    </main>
  )
}

export default Landing
