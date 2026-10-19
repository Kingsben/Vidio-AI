import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { validateLocalMp4 } from './localMp4'

const MEDIA_ERR_DECODE = 3
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Unavailable'
  const whole = Math.floor(seconds)
  const fraction = Math.round((seconds - whole) * 10)
  return `${whole}.${fraction} sec`
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function LocalVideoImporter() {
  const [preview, setPreview] = useState<{ file: File; url: string }>()
  const [metadata, setMetadata] = useState<{ width: number; height: number; duration: number }>()
  const [error, setError] = useState<string>()
  const [isChecking, setIsChecking] = useState(false)
  const selectionId = useRef(0)

  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview.url)
  }, [preview])

  useEffect(() => () => { selectionId.current += 1 }, [])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const currentSelection = ++selectionId.current
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) {
      setIsChecking(false)
      return
    }

    setError(undefined)
    setMetadata(undefined)
    setIsChecking(true)
    try {
      await validateLocalMp4(file)
      if (currentSelection !== selectionId.current) return
      setPreview({ file, url: URL.createObjectURL(file) })
    } catch (cause) {
      if (currentSelection !== selectionId.current) return
      setPreview(undefined)
      setError(cause instanceof Error ? cause.message : 'This MP4 could not be inspected.')
    } finally {
      if (currentSelection === selectionId.current) setIsChecking(false)
    }
  }

  function clearPreview() {
    selectionId.current += 1
    setPreview(undefined)
    setMetadata(undefined)
    setError(undefined)
    setIsChecking(false)
  }

  return (
    <section className="studio-importer" aria-labelledby="studio-import-heading">
      <div className="studio-section-heading">
        <div>
          <p className="studio-kicker">LOCAL PREVIEW</p>
          <h2 id="studio-import-heading">Bring in a video</h2>
        </div>
        <span className="studio-local-badge">This device only</span>
      </div>
      <p className="studio-section-description">Preview an MP4 from your computer and inspect its basic playback metadata. The file is not uploaded or saved to your account.</p>
      <label className="studio-file-picker" htmlFor="studio-video-file">
        <span className="studio-file-picker-mark" aria-hidden="true">＋</span>
        <span><strong>{preview ? 'Choose a different MP4' : 'Choose an MP4 file'}</strong><small>MP4 container · maximum 250 MB</small></span>
        <input id="studio-video-file" type="file" accept="video/mp4,.mp4" onChange={(event) => void handleFileChange(event)} aria-describedby="studio-file-hint" />
      </label>
      <p className="studio-visually-hidden" id="studio-file-hint">Selected video is previewed in this browser only and is not uploaded.</p>
      {isChecking && <p className="studio-inline-status" role="status">Checking MP4 file…</p>}
      {error && <p className="studio-inline-error" role="alert">{error}</p>}
      {preview && (
        <div className="studio-video-result">
          <video
            className="studio-local-video"
            src={preview.url}
            controls
            playsInline
            preload="metadata"
            aria-label={`Local preview: ${preview.file.name}`}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget
              setMetadata({ width: video.videoWidth, height: video.videoHeight, duration: video.duration })
            }}
            onError={(event) => {
              const errorCode = event.currentTarget.error?.code
              const message = errorCode === MEDIA_ERR_DECODE
                ? 'The MP4 appears corrupted or uses a codec this browser cannot decode.'
                : errorCode === MEDIA_ERR_SRC_NOT_SUPPORTED
                  ? 'This browser does not support the selected MP4 codec.'
                  : 'This browser could not read or play the selected MP4.'
              setError(message)
            }}
          />
          <div className="studio-video-file-row">
            <strong>{preview.file.name}</strong>
            <span>{formatFileSize(preview.file.size)}</span>
            <button type="button" onClick={clearPreview}>Clear preview</button>
          </div>
          <dl className="studio-video-metadata">
            <div><dt>Duration</dt><dd>{metadata ? formatDuration(metadata.duration) : 'Reading…'}</dd></div>
            <div><dt>Dimensions</dt><dd>{metadata ? `${metadata.width} × ${metadata.height}` : 'Reading…'}</dd></div>
            <div><dt>Container</dt><dd>MP4</dd></div>
            <div><dt>Audio stream</dt><dd>Not verified in browser</dd></div>
          </dl>
          <p className="studio-metadata-note">Browser metadata confirms dimensions and duration after the video loads. Use FFprobe to verify codecs and whether an audio stream is present.</p>
        </div>
      )}
    </section>
  )
}

export default LocalVideoImporter
