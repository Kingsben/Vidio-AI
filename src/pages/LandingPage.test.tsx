// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { featuredReferenceVideo, inspirationVideos } from '../data/inspirationVideos'
import LandingPage from './LandingPage'

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ session: null }) }))
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
function renderLandingPage() { return render(<MemoryRouter><LandingPage /></MemoryRouter>) }
function gallery() { return screen.getByRole('region', { name: /a world of ideas in motion/i }) }
function openPreview() {
  fireEvent.click(within(gallery()).getByRole('button', { name: /play pico sacro/i }))
  return screen.getByRole('dialog', { name: /pico sacro/i })
}

describe('LandingPage preview discovery', () => {
  it('offers six local videos immediately without preloading the gallery', () => {
    renderLandingPage()
    expect(within(gallery()).getAllByRole('button', { name: /play .* independent reference film/i })).toHaveLength(6)
    expect(inspirationVideos).toHaveLength(6)
    expect(new Set(inspirationVideos.map((video) => video.source)).size).toBe(6)
    expect(inspirationVideos.every((video) => video.source.includes('/videos/') && video.source.endsWith('.mp4'))).toBe(true)
    expect(gallery().querySelectorAll('video')).toHaveLength(0)
    expect(screen.getByLabelText(`${featuredReferenceVideo.title}, independent reference video`)).toHaveAttribute('preload', 'none')
    expect(screen.queryByText(/not playable|playback has not been verified/i)).not.toBeInTheDocument()
  })

  it('plays the selected local preview on demand and restores focus when closed', () => {
    renderLandingPage()
    const opener = within(gallery()).getByRole('button', { name: /play pico sacro/i })
    const dialog = openPreview()
    const player = within(dialog).getByLabelText(/pico sacro.*independent reference video/i)
    expect(player.querySelector('source')).toHaveAttribute('src', expect.stringContaining('videos/pico-sacro-timelapse.mp4'))
    expect(player).toHaveAttribute('controls')
    expect(player).toHaveAttribute('playsinline')
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('keeps the card and Retry available after a media-source error', () => {
    renderLandingPage()
    const dialog = openPreview()
    const failedPlayer = dialog.querySelector('video')!
    fireEvent.error(failedPlayer.querySelector('source')!)
    expect(within(dialog).getByRole('alert')).toHaveTextContent('could not be played')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry video' }))
    expect(dialog.querySelector('video')).not.toBe(failedPlayer)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
    expect(within(gallery()).getByRole('button', { name: /play pico sacro/i })).toBeEnabled()
    openPreview()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not mistake a missing thumbnail for a failed video', () => {
    renderLandingPage()
    const card = within(gallery()).getByRole('button', { name: /play pico sacro/i })
    fireEvent.error(card.querySelector('img')!)
    expect(card).toBeEnabled()
    fireEvent.click(card)
    expect(screen.getByRole('dialog').querySelector('video')).toBeInTheDocument()
  })

  it('shows loading and allows retry after a stalled playback request', () => {
    vi.useFakeTimers()
    renderLandingPage()
    const dialog = openPreview()
    fireEvent.waiting(dialog.querySelector('video')!)
    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading reference video')
    act(() => vi.advanceTimersByTime(20_000))
    expect(within(dialog).getByRole('button', { name: 'Retry video' })).toBeInTheDocument()
  })

  it('clears loading when playback starts and supports native pause/resume', () => {
    renderLandingPage()
    const dialog = openPreview()
    const player = dialog.querySelector('video')!
    fireEvent.waiting(player)
    fireEvent.playing(player)
    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Pause preview' })).toBeInTheDocument()
    fireEvent.pause(player)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Play preview' }))
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
  })

  it('can close one preview and open another while pausing other players', () => {
    renderLandingPage()
    openPreview()
    fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
    fireEvent.click(within(gallery()).getByRole('button', { name: /play abstract motion/i }))
    expect(screen.getByRole('dialog', { name: /abstract motion/i })).toBeInTheDocument()
    expect(document.querySelectorAll('.inspiration-dialog video')).toHaveLength(1)
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('shows Retry when the play promise rejects without a media error event', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('Unsupported media', 'NotSupportedError'))
    renderLandingPage()
    openPreview()
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be played')
    expect(screen.getByRole('button', { name: 'Retry video' })).toBeInTheDocument()
  })

  it('retains an explicit Play button when Chrome requires a direct gesture', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('Gesture required', 'NotAllowedError'))
    renderLandingPage()
    const dialog = openPreview()
    await act(async () => {})
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Play preview' }))
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
  })

  it('preserves broad positioning and functional mobile navigation', () => {
    renderLandingPage()
    expect(screen.getByRole('heading', { name: /make room for the unexpected/i })).toBeInTheDocument()
    expect(screen.getByText(/Video generation and editing are still in development/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /marketing & products/i })).toBeInTheDocument()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('link', { name: 'Explore styles' }))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
