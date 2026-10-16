import { Brand, Icon } from './Brand'
import { Photo } from './Photo'

const scenes = [
  { photo: 'coast', title: 'The coastline', time: '00:00 — 00:06' },
  { photo: 'forest', title: 'Into the quiet', time: '00:06 — 00:12' },
  { photo: 'dunes', title: 'A slower rhythm', time: '00:12 — 00:18' },
] as const

export function StudioPreview() {
  return (
    <div className="studio-window">
      <div className="studio-topbar">
        <div className="studio-brand"><Brand markOnly /><span>Studio</span></div>
        <span className="studio-project">Between places <span>/ Sample project</span></span>
        <span className="concept-badge">Noninteractive concept</span>
      </div>
      <div className="studio-layout">
        <aside className="studio-sidebar" aria-label="Concept workspace navigation">
          <p className="studio-label">WORKSPACE</p>
          <div className="studio-nav-item selected"><Icon name="edit" /> Editor</div>
          <div className="studio-nav-item"><Icon name="image" /> Scenes</div>
          <div className="studio-nav-item"><Icon name="voice" /> Voice</div>
          <div className="studio-nav-item"><Icon name="captions" /> Subtitles</div>
          <div className="studio-nav-divider" />
          <div className="studio-nav-item"><Icon name="library" /> My Creations</div>
          <div className="studio-nav-item"><Icon name="publish" /> Publishing</div>
          <p className="studio-sidebar-note">A workspace<br />in the making.</p>
        </aside>
        <div className="studio-editing-area">
          <div className="studio-preview-layout">
            <div className="studio-monitor">
              <div className="monitor-heading"><span>Preview</span><span>Landscape · 16:9</span></div>
              <div className="studio-frame">
                <Photo name="coast" sizes="(max-width: 860px) 90vw, 60vw" />
                <div className="frame-title"><span>A VISUAL STUDY</span><p>Between places.</p></div>
                <span className="frame-label">Sample photograph</span>
              </div>
              <div className="monitor-footer">
                <span className="timecode">00:00 <span>/ 00:18</span></span>
                <span>Still frame · Scene 01</span>
              </div>
            </div>
            <aside className="scene-notes" aria-label="Sample creative brief">
              <span className="studio-label">CREATIVE DIRECTION</span>
              <h3>Find a different pace.</h3>
              <p>A short visual journey through open water, quiet forests and shifting sand.</p>
              <dl><div><dt>Format</dt><dd>Short film</dd></div><div><dt>Feeling</dt><dd>Unhurried</dd></div></dl>
              <div className="sample-caption"><Icon name="captions" /><p>“Some places ask you to slow down.”</p><span>Sample subtitle</span></div>
            </aside>
          </div>
          <div className="studio-timeline">
            <div className="timeline-heading"><span><Icon name="video" /> Story sequence</span><span>3 sample scenes</span></div>
            <div className="timeline-ruler" aria-hidden="true"><span>00:00</span><span>00:06</span><span>00:12</span><span>00:18</span></div>
            <ol className="scene-sequence">
              {scenes.map((scene, index) => (
                <li key={scene.photo}>
                  <Photo name={scene.photo} sizes="(max-width: 600px) 30vw, 220px" />
                  <div><span>0{index + 1} <span className="scene-name">{scene.title}</span></span><small>{scene.time}</small></div>
                </li>
              ))}
            </ol>
            <div className="audio-track">
              <span><Icon name="voice" /> Narration</span>
              <div className="audio-wave" aria-hidden="true" />
              <span className="track-note">Sample track</span>
            </div>
          </div>
        </div>
      </div>
      <div className="studio-status"><span>EDITOR CONCEPT / 01</span><span>Licensed photography · No generated video</span></div>
    </div>
  )
}
