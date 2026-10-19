// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inspirationVideos } from '../data/inspirationVideos'
import { VideoPreview } from './VideoPreview'

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('preview audio controls', () => {
  it('does not autoplay the hero or mute audible media by default', () => {
    render(<VideoPreview video={inspirationVideos[0]} />)
    const player = document.querySelector('video')!
    expect(player.muted).toBe(false)
    expect(player.volume).toBe(1)
    expect(player).not.toHaveAttribute('autoplay')
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }))
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
  })

  it('supports mute, unmute and volume adjustments without starting playback', () => {
    render(<VideoPreview video={inspirationVideos[0]} />)
    const player = document.querySelector('video')!
    fireEvent.click(screen.getByRole('button', { name: 'Mute preview audio' }))
    expect(player.muted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Unmute preview audio' }))
    expect(player.muted).toBe(false)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.35' } })
    expect(player.volume).toBe(0.35)
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('recovers from zero volume when the user chooses unmute', () => {
    render(<VideoPreview video={inspirationVideos[0]} />)
    const player = document.querySelector('video')!
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } })
    expect(player.volume).toBe(0)
    expect(player.muted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Unmute preview audio' }))
    expect(player.volume).toBe(1)
    expect(player.muted).toBe(false)
  })

  it('reflects native volume controls in the custom controls', () => {
    render(<VideoPreview video={inspirationVideos[0]} />)
    const player = document.querySelector('video')!
    player.volume = 0.5
    player.muted = true
    fireEvent.volumeChange(player)
    expect(screen.getByRole('slider')).toHaveValue('0.5')
    expect(screen.getByRole('button', { name: 'Unmute preview audio' })).toBeInTheDocument()
  })

  it('identifies silent sources and omits misleading sound controls', () => {
    const silent = inspirationVideos.find((video) => video.id === 'pico-sacro-timelapse')!
    render(<VideoPreview video={silent} />)
    expect(screen.getByText('Source audio track is silent')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mute preview audio' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeEnabled()
  })
})
