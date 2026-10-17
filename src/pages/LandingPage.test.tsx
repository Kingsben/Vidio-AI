// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LandingPage from './LandingPage'

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ session: null }),
}))

afterEach(cleanup)

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('puts a multi-video, filterable reference gallery near the compact introduction', () => {
    renderLandingPage()

    const gallery = screen.getByRole('region', { name: /a world of ideas in motion/i })
    expect(screen.getByRole('heading', { name: /ideas, in motion/i })).toBeInTheDocument()
    expect(within(gallery).getAllByRole('button', { name: /play .* independent reference film/i })).toHaveLength(15)
    expect(gallery.querySelectorAll('video')).toHaveLength(0)
    expect(within(gallery).getByRole('button', { name: 'Cinematic' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Animation' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Social Content' })).toBeInTheDocument()
    expect(within(gallery).getByRole('link', { name: /sources & licences/i })).toHaveAttribute(
      'href',
      expect.stringContaining('inspiration-video-credits.md'),
    )
  })

  it('opens one selected video on demand and restores focus after closing', () => {
    renderLandingPage()
    const gallery = screen.getByRole('region', { name: /a world of ideas in motion/i })
    const opener = within(gallery).getByRole('button', { name: /play big buck bunny/i })
    fireEvent.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Big Buck Bunny' })
    const player = within(dialog).getByLabelText('Big Buck Bunny, independent reference video', { selector: 'video' })
    expect(player.querySelector('source')).toHaveAttribute('src', expect.stringContaining('.480p.vp9.webm'))
    expect(player).toHaveAttribute('poster', expect.stringContaining('thumb/'))
    expect(player).toHaveAttribute('controls')
    expect(player).toHaveAttribute('autoplay')
    expect(player).toHaveAttribute('playsinline')
    expect(player).toHaveAttribute('preload', 'none')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('positions Vidio AI for broad video creation without claiming generation is available', () => {
    renderLandingPage()

    expect(screen.getByRole('heading', { name: /ideas, in motion/i })).toBeInTheDocument()
    expect(screen.getByText(/AI generation, editing, and publishing remain in development/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /cartoons & animation/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /marketing & products/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create a project brief/i })).toHaveAttribute('href', '/auth/register')
    expect(screen.getByRole('link', { name: /your workspace/i })).toHaveAttribute('href', '#available-now')
  })

  it('keeps mobile navigation keyboard-accessible and closes it after choosing a destination', () => {
    renderLandingPage()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    fireEvent.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass('is-open')

    fireEvent.click(screen.getByRole('link', { name: 'Explore styles' }))

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Explore styles' })).toHaveAttribute('href', '#inspiration')
  })
})
