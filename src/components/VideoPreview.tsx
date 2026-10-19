import { useEffect, useRef, useState } from 'react'
import type { InspirationVideo } from '../data/inspirationVideos'

function pauseOtherVideos(current: HTMLVideoElement) {
  document.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
    if (video !== current) video.pause()
  })
}

function isGestureOrAbortError(reason: unknown) {
  return typeof reason === 'object' && reason !== null && 'name' in reason &&
    (reason.name === 'NotAllowedError' || reason.name === 'AbortError')
}

/** Only the explicitly selected modal starts playback. Other previews fetch nothing. */
export function VideoPreview({ video, startOnMount = false }: { video: InspirationVideo; startOnMount?: boolean }) {
  const player = useRef<HTMLVideoElement>(null)
  const timeout = useRef<number | undefined>(undefined)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)

  function stopLoading() {
    window.clearTimeout(timeout.current)
    setLoading(false)
  }

  function fail() {
    stopLoading()
    setPlaying(false)
    setError(true)
  }

  function startLoading() {
    window.clearTimeout(timeout.current)
    setLoading(true)
    timeout.current = window.setTimeout(fail, 20_000)
  }

  function play() {
    const element = player.current
    if (!element) return
    pauseOtherVideos(element)
    startLoading()
    void element.play().catch((reason: unknown) => {
      // A browser may require a second explicit gesture; retain native controls.
      if (isGestureOrAbortError(reason)) stopLoading()
      else fail()
    })
  }

  useEffect(() => {
    const element = player.current
    let cancelled = false
    if (startOnMount || attempt > 0) {
      if (element) {
        pauseOtherVideos(element)
        void element.play().catch((reason: unknown) => {
          if (cancelled) return
          window.clearTimeout(timeout.current)
          setLoading(false)
          setPlaying(false)
          // Keep Play available for browsers requiring a direct gesture.
          if (!isGestureOrAbortError(reason)) setError(true)
        })
      }
    }
    return () => {
      cancelled = true
      window.clearTimeout(timeout.current)
      element?.pause()
    }
  }, [attempt, startOnMount])

  return (
    <div className="video-preview">
      {error ? (
        <div className="inspiration-playback-error" role="alert">
          <p>This preview could not be played. Check your connection and retry.</p>
          <button className="inspiration-retry" type="button" onClick={() => {
            setError(false)
            setAttempt((current) => current + 1)
          }}>Retry video</button>
          <a href={video.sourcePage} target="_blank" rel="noreferrer">Open original source ↗</a>
        </div>
      ) : (
        <>
          <video
            key={attempt}
            ref={player}
            poster={video.poster}
            controls
            muted={muted}
            onLoadedMetadata={(event) => { event.currentTarget.volume = volume }}
            onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted || event.currentTarget.volume === 0) }}
            playsInline
            preload="none"
            aria-label={`${video.title}, independent reference video`}
            onPlay={(event) => { pauseOtherVideos(event.currentTarget); setPlaying(true); startLoading() }}
            onPlaying={() => { stopLoading(); setPlaying(true) }}
            onPause={() => { stopLoading(); setPlaying(false) }}
            onEnded={() => { stopLoading(); setPlaying(false) }}
            onWaiting={startLoading}
            onError={fail}
          >
            <source src={video.source} type={video.mimeType} onError={fail} />
            Your browser does not support HTML video. <a href={video.sourcePage}>Open the source.</a>
          </video>
          <div className="video-preview-audio">
          <button className="video-preview-toggle" type="button" aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={() => {
            if (player.current?.paused) play()
            else player.current?.pause()
          }}>{playing ? 'Ⅱ Pause' : '▶ Play preview'}</button>
          {video.hasAudio && <>
            <button type="button" aria-label={muted ? 'Unmute preview audio' : 'Mute preview audio'} aria-pressed={muted} onClick={() => {
              if (!player.current) return
              const nextMuted = !muted
              player.current.muted = nextMuted
              if (!nextMuted && player.current.volume === 0) {
                player.current.volume = 1
                setVolume(1)
              }
              setMuted(nextMuted)
            }}>{muted ? 'Unmute' : 'Mute'}</button>
            <label>Volume <input className="video-preview-volume" type="range" min="0" max="1" step="0.05" value={volume}
              aria-label={`${video.title} volume`} onChange={(event) => {
                const amount = Number(event.currentTarget.value)
                if (player.current) {
                  player.current.volume = amount
                  player.current.muted = amount === 0
                }
                setVolume(amount)
                setMuted(amount === 0)
              }} /></label>
          </>}
          <span className="video-preview-audio-note">{video.audioNote}</span>
          </div>
        </>
      )}
      {loading && !error && <p className="inspiration-loading" role="status">Loading reference video…</p>}
    </div>
  )
}
