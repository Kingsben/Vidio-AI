// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'

const { repository } = vi.hoisted(() => ({
  repository: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../data/cloudProjects', () => ({ getCloudProjectRepository: () => repository }))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ session: { user: { id: 'user-test' } } }) }))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  repository.list.mockResolvedValue([])
})

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('filters real inspiration videos by the categories that have matching footage', async () => {
    renderDashboard()

    const gallery = screen.getByRole('region', { name: /a world of ideas in motion/i })
    expect(within(gallery).getByRole('button', { name: 'Cinematic' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Animation' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Marketing' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Music & Motion' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Nature' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Educational' })).toBeInTheDocument()
    expect(within(gallery).getByRole('button', { name: 'Social Content' })).toBeInTheDocument()
    expect(within(gallery).getAllByRole('button', { name: /play .* independent reference film/i })).toHaveLength(15)
    expect(gallery.querySelectorAll('video')).toHaveLength(0)

    fireEvent.click(within(gallery).getByRole('button', { name: 'Marketing' }))
    expect(within(gallery).getAllByRole('button', { name: /play .* independent reference film/i })).toHaveLength(2)
    fireEvent.click(within(gallery).getByRole('button', { name: /play biore guard/i }))
    const marketingPlayer = screen.getByLabelText(/biore guard.*independent reference video/i, { selector: 'video' })
    expect(marketingPlayer.querySelector('source')).toHaveAttribute('src', expect.stringContaining('Biore_Guard_'))
    expect(marketingPlayer).toHaveAttribute('preload', 'none')
    fireEvent.click(screen.getByRole('button', { name: 'Close video' }))

    fireEvent.click(within(gallery).getByRole('button', { name: 'Animation' }))
    expect(within(gallery).getAllByRole('button', { name: /play .* independent reference film/i })).toHaveLength(9)
    fireEvent.click(within(gallery).getByRole('button', { name: /play big buck bunny/i }))
    expect(screen.getByLabelText(/big buck bunny.*independent reference video/i, { selector: 'video' }).querySelector('source'))
      .toHaveAttribute('src', expect.stringContaining('.480p.vp9.webm'))
  })

  it('keeps cloud project creation available and clearly labels unfinished tools', async () => {
    renderDashboard()

    expect(await screen.findByText('No project briefs yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create project brief' })).toHaveAttribute('href', '/app/projects/new')
    expect(screen.getByText(/saved to your account/i)).toBeInTheDocument()
    expect(screen.getByText('AI video')).toBeInTheDocument()
    expect(screen.getByText('AI animation')).toBeInTheDocument()
    expect(screen.getByText('Video editing')).toBeInTheDocument()
    expect(screen.getByText('Social publishing')).toBeInTheDocument()
    expect(screen.getAllByText('In development')).toHaveLength(3)
    expect(screen.getByText('Planned')).toBeInTheDocument()
  })

  it('shows a source recovery link when an independent video fails', () => {
    renderDashboard()

    const gallery = screen.getByRole('region', { name: /a world of ideas in motion/i })
    fireEvent.click(within(gallery).getByRole('button', { name: /play artemis iii/i }))
    fireEvent.error(screen.getByLabelText(/artemis iii.*independent reference video/i, { selector: 'video' }))

    expect(screen.getByRole('alert')).toHaveTextContent('could not be played')
    expect(screen.getByRole('link', { name: /open source page/i })).toHaveAttribute(
      'href',
      expect.stringContaining('Artemis_III_Core_Stage'),
    )
  })
})
