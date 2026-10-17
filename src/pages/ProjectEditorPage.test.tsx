// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project, ProjectInput } from '../data/projects'
import ProjectEditorPage from './ProjectEditorPage'

const { repository, originalProject } = vi.hoisted(() => {
  const originalProject: Project = {
    id: 'draft-1',
    title: 'Original title',
    brief: 'An original brief.',
    format: 'landscape',
    createdAt: '2026-10-17T12:00:00.000Z',
    updatedAt: '2026-10-17T12:00:00.000Z',
  }
  return {
    originalProject,
    repository: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
})

vi.mock('../data/cloudProjects', () => ({ getCloudProjectRepository: () => repository }))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ session: { user: { id: 'user-test' } } }) }))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  repository.get.mockResolvedValue(originalProject)
  repository.update.mockImplementation(async (id: string, input: ProjectInput) => ({
    ...originalProject,
    ...input,
    id,
    updatedAt: '2026-10-17T13:00:00.000Z',
  }))
})

describe('ProjectEditorPage', () => {
  it('refreshes the open project details after saving an edit', async () => {
    render(
      <MemoryRouter initialEntries={['/app/projects/draft-1']}>
        <Routes>
          <Route path="/app/projects/:projectId" element={<ProjectEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const title = await screen.findByDisplayValue('Original title')
    fireEvent.change(title, { target: { value: 'Updated title' } })
    fireEvent.change(screen.getByLabelText(/project brief/i), {
      target: { value: 'An updated brief.' },
    })
    fireEvent.click(screen.getByRole('radio', { name: /portrait/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('link', { name: /projects.*updated title/i })).toBeInTheDocument()
    expect(repository.update).toHaveBeenCalledWith('draft-1', {
      title: 'Updated title',
      brief: 'An updated brief.',
      format: 'portrait',
    })
  })
})
