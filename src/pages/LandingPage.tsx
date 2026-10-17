import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CreativeInspiration from '../components/CreativeInspiration'
import { Brand, Icon } from '../components/Brand'
import { useAuth } from '../auth/AuthContext'
import '../App.css'
import './LandingPage.css'

const creativeDirections = [
  {
    title: 'Text to video',
    detail: 'PROMPT-LED CREATION',
  },
  {
    title: 'Image to video',
    detail: 'STILLS INTO MOTION',
  },
  {
    title: 'Cinematic stories',
    detail: 'REALISM & ATMOSPHERE',
  },
  {
    title: 'Cartoons & animation',
    detail: '2D, 3D & CHARACTER',
  },
  {
    title: 'Marketing & products',
    detail: 'CAMPAIGNS WITH IMPACT',
  },
  {
    title: 'Music & motion',
    detail: 'VISUAL RHYTHM',
  },
  {
    title: 'Learning & education',
    detail: 'IDEAS MADE CLEAR',
  },
  {
    title: 'Social shorts',
    detail: 'MADE FOR EVERY FEED',
  },
]

function LandingPage() {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeMenu = () => setMenuOpen(false)
  const primaryHref = session ? '/app' : '/auth/register'

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main" onClick={closeMenu}>Skip to content</a>
      <header
        className="site-header"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && menuOpen) {
            closeMenu()
            menuButton.current?.focus()
          }
        }}
      >
        <div className="container header-inner">
          <Link to="/" aria-label="Vidio AI home" className="brand-link" onClick={closeMenu}><Brand /></Link>
          <button
            ref={menuButton}
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <nav id="main-navigation" aria-label="Main navigation" className={menuOpen ? 'navigation is-open' : 'navigation'}>
            <a href="#inspiration" onClick={closeMenu}>Explore styles</a>
            <a href="#creative-direction" onClick={closeMenu}>What we’re building</a>
            <a href="#available-now" onClick={closeMenu}>Your workspace</a>
            <Link to={primaryHref} className="nav-cta" onClick={closeMenu}>
              {session ? 'Open workspace' : 'Create a brief'} <Icon name="arrow" />
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="cartoon-hero container" aria-labelledby="hero-title">
          <div className="cartoon-hero-copy">
            <p className="eyebrow"><span className="status-dot" /> AN AI VIDEO STUDIO IN DEVELOPMENT</p>
            <h1 id="hero-title">Ideas, in <span>motion.</span></h1>
            <p className="cartoon-hero-description">
              Explore independent film and reference footage for cinematic stories, animation, products, nature, and more.
            </p>
            <div className="cartoon-hero-actions">
              <Link className="button button-primary" to={primaryHref} onClick={closeMenu}>
                {session ? 'Open your workspace' : 'Create a project brief'} <Icon name="arrow" />
              </Link>
              <a className="text-link" href="#inspiration" onClick={closeMenu}>Explore video styles <Icon name="down" /></a>
            </div>
            <p className="cartoon-hero-note">Create a project brief today. AI generation, editing, and publishing remain in development.</p>
          </div>
        </section>

        <div className="container">
          <CreativeInspiration />
        </div>

        <section id="creative-direction" className="container creative-direction-section" aria-labelledby="vision-title">
          <div className="section-heading">
            <div><p className="eyebrow">A STUDIO FOR EVERY SCREEN</p><h2 id="vision-title">One idea.<br />Many ways to move.</h2></div>
            <p>Children’s animation is one of our creative pillars — alongside cinematic films, image-led storytelling, product campaigns, music visuals, education, and social video.</p>
          </div>
          <div className="creative-direction-list">
            {creativeDirections.map((direction, index) => (
              <article className="creative-direction-item" key={direction.title}>
                <span className="creative-direction-number">0{index + 1}</span>
                <h3>{direction.title}</h3>
                <span>{direction.detail}</span>
              </article>
            ))}
          </div>
          <p className="creative-direction-note">These creative tools are planned and are not yet available. The films in the reference room are independent works, not Vidio AI generations.</p>
        </section>

        <section id="available-now" className="container current-product-section" aria-labelledby="current-product-title">
          <div className="current-product-copy">
            <p className="eyebrow"><span className="status-dot" /> AVAILABLE NOW</p>
            <h2 id="current-product-title">Give your next idea<br />a place to begin.</h2>
            <p>Create a project brief with a title, creative direction, and intended format. Your briefs are saved to your private account. Nothing is generated or sent to an AI service.</p>
            <Link className="button button-primary" to={primaryHref}>
              {session ? 'Open your workspace' : 'Create a free account'} <Icon name="arrow" />
            </Link>
          </div>
          <div className="current-product-card">
            <span className="current-product-card-icon" aria-hidden="true">✎</span>
            <span className="current-product-card-label">YOUR CREATIVE WORKSPACE</span>
            <h3>Cloud project briefs</h3>
            <p>Create, revisit, update, and delete briefs saved privately to your signed-in account. Existing browser drafts are kept separate.</p>
            <Link to={primaryHref}>Go to project briefs <Icon name="arrow" /></Link>
          </div>
        </section>
      </main>

      <footer className="container site-footer cartoon-footer">
        <Link to="/" className="brand-link" aria-label="Vidio AI home"><Brand /></Link>
        <p>Video ideas, brought to life.</p>
        <div>
          <Link to={session ? '/app' : '/auth/login'}>{session ? 'Workspace' : 'Sign in'}</Link>
          <a href={`${import.meta.env.BASE_URL}animation-film-credits.md`}>Film credits</a>
          <span>© {new Date().getFullYear()} Vidio AI</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
