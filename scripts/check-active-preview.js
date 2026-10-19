// Paste into Chrome DevTools on Vidio AI, select a gallery card, then run:
// await verifyActivePreview()
// This checks the real media element. It is not part of the application bundle.
window.verifyActivePreview = async function verifyActivePreview() {
  const video = document.querySelector('.inspiration-dialog video')
  if (!video) throw new Error('Open a gallery preview first.')
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const frame = () => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    return canvas.toDataURL('image/png')
  }
  const presented = () => video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0
  await video.play()
  await wait(250)
  if (video.error || !video.videoWidth || !video.videoHeight) throw new Error('No decoded video dimensions.')
  const start = video.currentTime
  const initialFrames = presented()
  const firstFrame = frame()
  await wait(2500)
  const elapsed = video.currentTime - start
  const lastFrame = frame()
  const frameCount = presented() - initialFrames
  video.pause()
  const pausedTime = video.currentTime
  await wait(400)
  const pauseWorked = video.paused && Math.abs(video.currentTime - pausedTime) < 0.1
  await video.play()
  await wait(800)
  const resumeWorked = !video.paused && video.currentTime > pausedTime + 0.25
  video.pause()
  const result = {
    title: video.getAttribute('aria-label'), source: video.currentSrc,
    width: video.videoWidth, height: video.videoHeight, elapsed,
    muted: video.muted, volume: video.volume,
    frameCount, framesChanged: firstFrame !== lastFrame,
    pauseWorked, resumeWorked, mediaError: video.error?.code ?? null,
  }
  result.passed = elapsed >= 2 && frameCount > 0 && result.framesChanged && pauseWorked && resumeWorked && !video.error
  console.table(result)
  // Retain actual rendered frames locally for inspection; no data is uploaded.
  window.vidioPreviewEvidence = { result, firstFrame, lastFrame }
  return result
}
