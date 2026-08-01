import './AboutMe.css'

function AboutMe() {
  return (
    <div className="about-me-container">
      <div className="about-me-content">
        <div className="about-me-image-wrapper">
          <img src="/aboutmesection/images/nice.jpg" alt="Toniloba" className="about-me-image" />
        </div>
        <div className="about-me-text">
          <h1>Toniloba</h1>
          <p className="subtitle text-accent">15-Year-Old Developer & Creator</p>
          
          <div className="about-me-details">
            <p>
              I am a 15-year-old passionate front-end developer and creator. I thrive on building fast, modern, and accessible web experiences. Currently, I hold a contract position at <strong>Simvo Africa</strong>, where I collaborate on building solid technical solutions.
            </p>
            <p>
              My workflow involves React, TypeScript, and a keen eye for Brutalist Lite aesthetics. Beyond writing code, I actively engage with the developer community, constantly learning and sharing my journey.
            </p>
          </div>

          <div className="about-me-actions">
            <a href="mailto:contact@example.com" className="btn btn-primary">Contact Me</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-ghost">GitHub</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutMe
