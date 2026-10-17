import { useEffect, useRef, useState } from 'react'
import { animationFilms, type AnimationFilm } from './animationFilms'
import './AnimationShowcase.css'

function getAutoplayAllowed() {
  if (typeof window.matchMedia !== 'function') return false

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const desktopViewport = window.matchMedia('(min-width: 1024px)').matches
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  const slowConnection = connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')

  return desktopViewport && !reducedMotion && !slowConnection
}

function AnimationShowcase() {
  const [activeId, setActiveId] = useState(animationFilms[0].id)
  const [playbackError, setPlaybackError] = useState(false)
  const [autoplayAllowed, setAutoplayAllowed] = useState(getAutoplayAllowed)
  const [isPlaying, setIsPlaying] = useState(false)
  const player = useRef<HTMLVideoElement>(null)
  const activeFilm = animationFilms.find((film) => film.id === activeId) ?? animationFilms[0]

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktopViewport = window.matchMedia('(min-width: 1024px)')
    const updatePlaybackPreference = () => {
      const allowed = getAutoplayAllowed()
      setAutoplayAllowed(allowed)
      if (!allowed) player.current?.pause()
    }

    reducedMotion.addEventListener('change', updatePlaybackPreference)
    desktopViewport.addEventListener('change', updatePlaybackPreference)

    return () => {
      reducedMotion.removeEventListener('change', updatePlaybackPreference)
      desktopViewport.removeEventListener('change', updatePlaybackPreference)
    }
  }, [])

  const selectFilm = (film: AnimationFilm) => {
    if (film.id === activeId) return
    setPlaybackError(false)
    setIsPlaying(false)
    setActiveId(film.id)
  }

  const togglePlayback = () => {
    if (!player.current) return

    if (player.current.paused) {
      void player.current.play().catch(() => setPlaybackError(true))
    } else {
      player.current.pause()
    }
  }

  return (
    <section id="film-showcase" className="animation-showcase" aria-labelledby="animation-showcase-title">
      <header className="animation-showcase-heading">
        <div>
          <p className="eyebrow">THE OPEN REEL <span>—</span> INDEPENDENT ANIMATION</p>
          <h2 id="animation-showcase-title">Stories in motion.</h2>
        </div>
        <p className="animation-showcase-intro">Five acclaimed films. Original artists. A glimpse at the stories that move us.</p>
      </header>

      <div className="animation-feature">
        <div className="animation-player-frame">
          {playbackError ? (
            <div className="animation-player-error" role="alert">
              <p>This film could not be played here. Check your connection or open it on Wikimedia Commons.</p>
              <a href={activeFilm.commons} target="_blank" rel="noreferrer">
                Open the film source <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : (
            <>
              <video
                key={activeFilm.id}
                ref={player}
                className="animation-player"
                poster={activeFilm.poster}
                controls
                autoPlay={autoplayAllowed}
                muted={autoplayAllowed}
                loop={autoplayAllowed}
                playsInline
                preload={autoplayAllowed ? 'metadata' : 'none'}
                aria-label={`${activeFilm.title}, independent animated film`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setPlaybackError(true)}
              >
                <source src={activeFilm.source} type={activeFilm.mimeType} />
                Your browser does not support HTML video.{' '}
                <a href={activeFilm.commons} target="_blank" rel="noreferrer">Open this film on Wikimedia Commons.</a>
              </video>
              <button
                className="animation-play-toggle"
                type="button"
                aria-label={isPlaying ? 'Pause the featured film' : 'Play the featured film'}
                aria-pressed={isPlaying}
                onClick={togglePlayback}
              >
                <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
                {isPlaying ? 'Pause' : 'Play film'}
              </button>
            </>
          )}
        </div>
        <div className="animation-feature-caption" aria-live="polite" aria-atomic="true">
          <div>
            <p className="animation-film-style">{activeFilm.style} <span>·</span> INDEPENDENT FILM</p>
            <h3>{activeFilm.title}</h3>
            <p>{activeFilm.description}</p>
          </div>
          <span className="animation-film-duration">{activeFilm.duration}</span>
        </div>
      </div>

      <div className="animation-film-list" role="group" aria-label="Choose an independent film">
          {animationFilms.map((film, index) => (
            <button
              className={`animation-film-option${film.id === activeFilm.id ? ' is-active' : ''}`}
              key={film.id}
              type="button"
              aria-label={`Select ${film.title} for the featured player`}
              aria-pressed={film.id === activeFilm.id}
              onClick={() => selectFilm(film)}
            >
              <span className="animation-film-poster">
                <img src={film.thumbnail} alt="" loading="lazy" decoding="async" />
                <span className="animation-film-select" aria-hidden="true">{film.id === activeFilm.id ? 'SELECTED' : 'VIEW FILM'}</span>
              </span>
              <span className="animation-film-option-copy">
                <span className="animation-film-number">0{index + 1} / {film.style}</span>
                <span className="animation-film-option-title">{film.title}</span>
                <span className="animation-film-option-duration">{film.duration}</span>
              </span>
            </button>
          ))}
      </div>

      <footer className="animation-showcase-footer">
        <p>Independent films, streamed from Wikimedia Commons. Not Vidio AI creations.</p>
        <a href={`${import.meta.env.BASE_URL}animation-film-credits.md`}>Film creators, sources &amp; licences <span aria-hidden="true">↗</span></a>
      </footer>
    </section>
  )
}

export default AnimationShowcase
