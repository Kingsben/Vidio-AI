import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectFormat } from '../data/projects'
import { projectFormats } from '../data/projects'
import LocalVideoImporter from '../generation/LocalVideoImporter'
import './StudioPage.css'

type GenerationMode = 'text-to-video' | 'image-to-video'

function StudioPage() {
  const [mode, setMode] = useState<GenerationMode>('text-to-video')
  const [prompt, setPrompt] = useState('')
  const [format, setFormat] = useState<ProjectFormat>('landscape')
  const [duration, setDuration] = useState('2')
  const [resolution, setResolution] = useState('512 × 704')
  const [seed, setSeed] = useState('42')
  const [copyStatus, setCopyStatus] = useState('')
  const [copyError, setCopyError] = useState('')

  async function copyPrompt() {
    if (!prompt.trim()) return
    setCopyStatus('')
    setCopyError('')
    try {
      await navigator.clipboard.writeText(prompt.trim())
      setCopyStatus('Prompt copied. Paste it into the external demo if you choose.')
    } catch {
      setCopyError('Clipboard access is unavailable. Select and copy the prompt manually.')
    }
  }

  return (
    <div className="studio-page">
      <header className="studio-header">
        <div>
          <p className="studio-kicker">CREATION WORKSPACE <span>·</span> PRIVATE</p>
          <h1>AI Video Studio</h1>
          <p className="studio-lede">Shape a video prompt, keep your settings in view, and preview a clip from your computer.</p>
        </div>
        <div className="studio-header-actions">
          <a className="studio-return-link" href="#audio-workflow">Explore audio workflow ↓</a>
          <Link className="studio-return-link" to="/app">← Return to project briefs</Link>
        </div>
      </header>

      <div className="studio-connection-notice" role="status">
        <span className="studio-notice-mark" aria-hidden="true">i</span>
        <p><strong>Vidio AI generation is not connected yet.</strong> Nothing on this page submits a generation request or saves a file to cloud storage.</p>
      </div>

      <div className="studio-main-grid">
        <section className="studio-builder" aria-labelledby="studio-builder-heading">
          <div className="studio-builder-heading">
            <div><p className="studio-kicker">01 / PREPARE</p><h2 id="studio-builder-heading">Build your direction</h2></div>
            <span className="studio-plan-badge">Local plan only</span>
          </div>

          <fieldset className="studio-mode-picker">
            <legend>Generation mode</legend>
            <div className="studio-mode-options">
              <button type="button" aria-pressed={mode === 'text-to-video'} onClick={() => setMode('text-to-video')}>
                <span className="studio-mode-glyph" aria-hidden="true">T</span><span><strong>Text to video</strong><small>Start with a written prompt</small></span>
              </button>
              <button type="button" aria-label="Image to video" aria-pressed={mode === 'image-to-video'} onClick={() => setMode('image-to-video')}>
                <span className="studio-mode-glyph studio-mode-image" aria-hidden="true">▧</span><span><strong>Image to video</strong><small>Animate a still image</small></span>
              </button>
            </div>
          </fieldset>

          {mode === 'image-to-video' && (
            <p className="studio-mode-note">Image-to-video is available in the external LTX experiment. This workspace does not accept or transmit a reference image.</p>
          )}

          <label className="studio-prompt-field" htmlFor="studio-prompt">
            <span>Creative prompt</span>
            <textarea id="studio-prompt" aria-label="Creative prompt" value={prompt} maxLength={1000} rows={6} placeholder="Describe the subject, action, setting, visual style, light and camera direction…" onChange={(event) => { setPrompt(event.target.value); setCopyStatus(''); setCopyError('') }} />
            <span className="studio-prompt-footer"><span>Keep one clear action at the centre of the shot.</span><span>{prompt.length} / 1,000</span></span>
          </label>

          <fieldset className="studio-settings">
            <legend>Planned output settings</legend>
            <div className="studio-setting-grid">
              <label>Aspect ratio
                <select value={format} onChange={(event) => setFormat(event.target.value as ProjectFormat)}>
                  {projectFormats.map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </label>
              <label>Duration
                <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                  <option value="2">2 seconds</option><option value="4">4 seconds</option><option value="6">6 seconds</option><option value="8.5">8.5 seconds</option>
                </select>
              </label>
              <label>Resolution
                <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
                  <option>512 × 704</option><option>512 × 512</option><option>704 × 512</option><option>768 × 1280</option>
                </select>
              </label>
              <label>Seed
                <input type="number" min="0" max="4294967295" step="1" value={seed} onChange={(event) => setSeed(event.target.value)} />
              </label>
            </div>
            <p className="studio-settings-note">These selections stay in this page only. They are not persisted or applied to the external demo.</p>
          </fieldset>

          <div className="studio-experiment-card">
            <div className="studio-experiment-copy">
              <span className="studio-experiment-label"><span aria-hidden="true" /> EXTERNAL EXPERIMENT</span>
              <h3>LTX-2.5 · Video with generated audio</h3>
              <p>The public Hugging Face experiment is awaiting a free quota reset and separate approval. Vidio AI does not submit requests, control its queue or store its results.</p>
            </div>
            <div className="studio-experiment-actions">
              <button className="studio-copy-button" type="button" disabled={!prompt.trim()} onClick={() => void copyPrompt()}>Copy prompt for demo</button>
              <a href="https://huggingface.co/spaces/Lightricks/LTX-2.5" target="_blank" rel="noreferrer">Open LTX-2.5 Space <span aria-hidden="true">↗</span></a>
            </div>
            {copyStatus && <p className="studio-copy-status" role="status">{copyStatus}</p>}
            {copyError && <p className="studio-copy-error" role="alert">{copyError}</p>}
          </div>
        </section>

        <aside className="studio-side-column" aria-label="Studio resources">
          <section className="studio-preview-placeholder" aria-labelledby="studio-preview-heading">
            <div className="studio-preview-topline"><span>PREVIEW</span><span>NO CLOUD OUTPUTS</span></div>
            <div className="studio-preview-art" aria-hidden="true"><span className="studio-preview-sun" /><span className="studio-preview-horizon" /><span className="studio-preview-water" /></div>
            <h2 id="studio-preview-heading">Your video preview</h2>
            <p>Imported clips appear here for local review. No generated result is available in this workspace yet.</p>
            <a href="#local-video-import">Import an MP4 from this device <span aria-hidden="true">↓</span></a>
          </section>

          <section className="studio-audio-card" id="audio-workflow" aria-labelledby="studio-audio-heading">
            <p className="studio-kicker">02 / SOUND</p>
            <h2 id="studio-audio-heading">Sound is a separate stage</h2>
            <p>The planned LTX-2.5 test can generate video with audio, but no audio or generation service is connected to this app. Voiceover, mixing and audio export remain unconnected.</p>
            <div className="studio-audio-next"><span>Next foundation</span><strong>Licensed sound → sync → mix → MP4 export</strong></div>
          </section>

          <section className="studio-project-card" aria-labelledby="studio-project-heading">
            <p className="studio-kicker">YOUR PROJECTS</p>
            <h2 id="studio-project-heading">Keep developing the idea</h2>
            <p>Cloud project briefs remain available and private to your account.</p>
            <Link to="/app">View project briefs <span aria-hidden="true">↗</span></Link>
          </section>
        </aside>
      </div>

      <div id="local-video-import" className="studio-import-anchor"><LocalVideoImporter /></div>
      <p className="studio-footnote">Imported media is previewed with a temporary browser object URL. It remains on your device; closing or replacing it releases the preview reference.</p>
    </div>
  )
}

export default StudioPage
