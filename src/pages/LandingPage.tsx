import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brand, Icon } from '../components/Brand'
import { Photo } from '../components/Photo'
import { StudioPreview } from '../components/StudioPreview'
import '../App.css'

const photoCredits = `${import.meta.env.BASE_URL}photography-credits.md`

const capabilityGroups = [
  {
    number: '01',
    title: 'Find your starting point.',
    description: 'A few words. A still image. The beginning of a story.',
    features: [
      ['AI Video Generation', 'Develop scripts and turn text prompts into video scenes.'],
      ['Image-to-Video', 'Explore movement and atmosphere from a still image.'],
    ],
  },
  {
    number: '02',
    title: 'Make the details yours.',
    description: 'Shape the rhythm, the voice and everything in between.',
    features: [
      ['Video Editor', 'Arrange scenes, refine your cuts and set the pace.'],
      ['AI Voice Studio', 'Write narration and find the voice for your story.'],
      ['Subtitles', 'Create and refine captions that carry your message.'],
    ],
  },
  {
    number: '03',
    title: 'Give your story a home.',
    description: 'Keep your work together. Decide when the world sees it.',
    features: [
      ['My Creations', 'Organize your videos, assets and works in progress.'],
      ['Social Publishing', 'Publish to YouTube and Facebook, or schedule for later.'],
    ],
  },
]

const workflow = [
  ['Idea', 'A prompt, script or image.'],
  ['Create', 'Scenes and narration.'],
  ['Edit', 'The cut, sound and captions.'],
  ['Review', 'A final look at every detail.'],
  ['Publish', 'Share now or plan ahead.'],
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
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
            <a href="#studio" onClick={closeMenu}>The studio</a>
            <a href="#capabilities" onClick={closeMenu}>Capabilities</a>
            <a href="#workflow" onClick={closeMenu}>The process</a>
            <Link to="/app" className="nav-cta" onClick={closeMenu}>Open workspace <Icon name="arrow" /></Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">A NEW PERSPECTIVE ON VIDEO</p>
            <h1 id="hero-title">Stories start<br />with a point<br />of <span>view.</span></h1>
            <p className="hero-description">
              An AI video studio in development. Bring words and images into motion,
              shape every scene, and take your story from first thought to published video.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#studio" onClick={closeMenu}>
                Explore the studio <Icon name="arrow" />
              </a>
              <Link className="text-link" to="/app/projects/new" onClick={closeMenu}>Start a project <Icon name="arrow" /></Link>
              <a className="text-link" href="#capabilities" onClick={closeMenu}>What we’re building <Icon name="down" /></a>
            </div>
            <p className="hero-note"><span className="status-dot" /> In development. A first look, not a live tool.</p>
          </div>
          <figure className="hero-visual">
            <Photo name="coast" priority sizes="(max-width: 700px) 100vw, 55vw" />
            <div className="hero-image-top"><span>FIELD NOTES</span><span>01 / THE COAST</span></div>
            <figcaption className="hero-image-caption">
              <div><span>A STUDY IN MOVEMENT</span><p>Follow a different current.</p></div>
              <span className="image-caption-icon" aria-hidden="true"><Icon name="arrow" /></span>
            </figcaption>
            <span className="hero-image-credit">Illustrative photography · Fran Bertucci / Pexels</span>
          </figure>
        </section>

        <div className="container introduction">
          <p>From a passing thought<br />to something worth watching.</p>
          <span>CREATE. EDIT. SHARE.<br /><span>One connected vision for video.</span></span>
        </div>

        <section id="studio" className="studio-section container section" aria-labelledby="studio-title">
          <div className="section-heading">
            <div><p className="eyebrow">01 / THE WORKSPACE</p><h2 id="studio-title">A place for the<br />whole picture.</h2></div>
            <p>Your scenes, voice and final cut, considered together.
              This is an early concept of the Vidio AI studio—not a functioning editor.</p>
          </div>
          <StudioPreview />
          <p className="studio-disclaimer">Sample photographs show a creative direction. They are not AI-generated results.</p>
        </section>

        <section id="capabilities" className="capabilities-section container section" aria-labelledby="capabilities-title">
          <div className="section-heading">
            <div><p className="eyebrow">02 / THE POSSIBILITIES</p><h2 id="capabilities-title">Different stories.<br />Your way of seeing.</h2></div>
            <p>Document a place. Explore an idea. Tell a brand’s story.
              We’re planning the tools to help you find your own visual language.</p>
          </div>
          <div className="visual-studies" aria-label="Photographic studies for different creative directions">
            <figure className="study study-city">
              <Photo name="city" sizes="(max-width: 600px) 45vw, 30vw" />
              <figcaption><span>01 / DOCUMENTARY</span><span>Life, unscripted.</span></figcaption>
            </figure>
            <figure className="study study-architecture">
              <Photo name="architecture" sizes="(max-width: 600px) 90vw, 40vw" />
              <figcaption><span>02 / ARCHITECTURE</span><span>A sense of space.</span></figcaption>
            </figure>
            <figure className="study study-forest">
              <Photo name="forest" sizes="(max-width: 600px) 45vw, 30vw" />
              <figcaption><span>03 / EXPLORATION</span><span>Outside the everyday.</span></figcaption>
            </figure>
          </div>
          <div className="studies-caption"><span>Licensed photographic studies. Not generated with Vidio AI.</span><a href={photoCredits}>Image credits <Icon name="arrow" /></a></div>
          <div className="toolkit-heading"><h3>The planned toolkit</h3><span>All capabilities below are in development</span></div>
          <div className="capability-groups">
            {capabilityGroups.map((group) => (
              <article className="capability-group" key={group.number}>
                <span className="group-number">{group.number}</span>
                <h3>{group.title}</h3>
                <p className="group-description">{group.description}</p>
                <dl>
                  {group.features.map(([title, description]) => (
                    <div key={title}><dt>{title}</dt><dd>{description}</dd></div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="workflow-section" aria-labelledby="workflow-title">
          <div className="container section">
            <div className="section-heading">
              <div><p className="eyebrow">03 / THE PROCESS</p><h2 id="workflow-title">Keep the story moving.</h2></div>
              <p>The planned journey, from the first note to the final review.
                Your creative decisions stay at the center.</p>
            </div>
            <ol className="workflow-list">
              {workflow.map(([title, description], index) => (
                <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="development" className="container closing section" aria-labelledby="development-title">
          <div><p className="eyebrow"><span className="status-dot" /> CURRENTLY IN DEVELOPMENT</p><h2 id="development-title">The next chapter<br />is taking shape.</h2></div>
          <div className="closing-copy">
            <p>We’re building Vidio AI one considered step at a time.</p>
            <p>Generation, editing, personal libraries and social publishing are planned.
              They aren’t available yet, and there’s no public launch date.</p>
            <a className="text-link" href="#studio" onClick={closeMenu}>Take another look at the studio <Icon name="arrow" /></a>
          </div>
        </section>
      </main>

      <footer className="container site-footer">
        <a href="#" className="brand-link" aria-label="Vidio AI back to top" onClick={closeMenu}><Brand /></a>
        <p>A little perspective changes the story.</p>
        <div><a href={photoCredits}>Photography credits</a><span>© {new Date().getFullYear()} Vidio AI</span></div>
      </footer>
    </>
  )
}

export default App
