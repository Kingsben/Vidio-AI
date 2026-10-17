// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AnimationShowcase from './AnimationShowcase'
import { animationFilms } from './animationFilms'

afterEach(cleanup)

describe('AnimationShowcase', () => {
  it('offers five real Commons films with posters, browser controls, and an explicit playback control', () => {
    render(<AnimationShowcase />)

    const showcase = screen.getByRole('region', { name: /stories in motion/i })
    const video = within(showcase).getByLabelText('Big Buck Bunny, independent animated film', { selector: 'video' })
    const source = video.querySelector('source')

    expect(animationFilms).toHaveLength(5)
    expect(within(showcase).getAllByRole('button', { name: /select .* for the featured player/i })).toHaveLength(5)
    expect(source).toHaveAttribute('src', expect.stringContaining('.480p.vp9.webm'))
    expect(source).toHaveAttribute('type', 'video/webm; codecs="vp9, opus"')
    expect(video).toHaveAttribute('poster', expect.stringContaining('thumb/'))
    expect(video).toHaveAttribute('preload', 'none')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('playsinline')
    expect(video).not.toHaveAttribute('autoplay')
    expect(within(showcase).getByRole('button', { name: /play the featured film/i })).toBeInTheDocument()
    const thumbnails = showcase.querySelectorAll('.animation-film-poster img')
    expect(thumbnails).toHaveLength(5)
    expect([...thumbnails].every((image) => image.getAttribute('src')?.includes('330px--'))).toBe(true)
    expect(animationFilms.every((film) =>
      film.mimeType === 'video/webm; codecs="vp9, opus"' && new URL(film.source).pathname.endsWith('.480p.vp9.webm'),
    )).toBe(true)
    expect(within(showcase).getByRole('link', { name: /film creators, sources & licences/i })).toHaveAttribute('href', expect.stringContaining('animation-film-credits.md'))
  })

  it('switches the single player to the selected Commons film', () => {
    render(<AnimationShowcase />)

    const showcase = screen.getByRole('region', { name: /stories in motion/i })
    fireEvent.click(within(showcase).getByRole('button', { name: /select caminandes 3: llamigos/i }))

    expect(showcase.querySelectorAll('video')).toHaveLength(1)
    expect(
      within(showcase)
        .getByLabelText('Caminandes 3: Llamigos, independent animated film', { selector: 'video' })
        .querySelector('source'),
    ).toHaveAttribute(
      'src',
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ab/Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm/Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm.480p.vp9.webm',
    )
    expect(within(showcase).getByRole('button', { name: /select caminandes 3: llamigos/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('provides a working explicit play and pause control', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    render(<AnimationShowcase />)

    const video = screen.getByLabelText('Big Buck Bunny, independent animated film', { selector: 'video' })
    fireEvent.click(screen.getByRole('button', { name: 'Play the featured film' }))
    expect(play).toHaveBeenCalledOnce()

    Object.defineProperty(video, 'paused', { configurable: true, value: false })
    fireEvent.play(video)
    fireEvent.click(screen.getByRole('button', { name: 'Pause the featured film' }))
    expect(pause).toHaveBeenCalledOnce()

    fireEvent.pause(video)
    expect(screen.getByRole('button', { name: 'Play the featured film' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows an honest recovery link when the selected stream errors', () => {
    render(<AnimationShowcase />)

    const showcase = screen.getByRole('region', { name: /stories in motion/i })
    fireEvent.error(within(showcase).getByLabelText('Big Buck Bunny, independent animated film', { selector: 'video' }))

    expect(within(showcase).getByRole('alert')).toHaveTextContent('could not be played here')
    expect(within(showcase).getByRole('link', { name: /open the film source/i })).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Big_buck_bunny_720p_5mb.webm',
    )
  })
})
