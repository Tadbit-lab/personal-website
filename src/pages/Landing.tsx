import { Link } from 'react-router-dom'
import RandomQuoteGenerator from '../components/RandomQuoteGenerator'

function Landing() {
  return (
    <main className="landing-page page-image" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/nice.jpg')` }}>
      <div className="image-overlay" />
      <section className="landing-content" aria-labelledby="landing-title">
        <p className="eyebrow">PERSONAL SYSTEMS / 01</p>
        <h1 id="landing-title">Personal Systems</h1>
        <p className="landing-subtitle">Interactive simulations and financial dashboards.</p>
        <div className="landing-actions">
          <Link className="action-button" to="/craps">Launch Craps Game <span aria-hidden="true">↗</span></Link>
          <Link className="action-button" to="/dashboard">Open Stock Dashboard <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <div className="hero-quote">
        <RandomQuoteGenerator />
      </div>
      <div className="landing-footer"><span>TONILOBA ILESANMI</span><span>EXPERIMENTAL PRODUCT SUITE</span></div>
    </main>
  )
}

export default Landing
