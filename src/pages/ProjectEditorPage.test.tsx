// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

afterEach(() => { cleanup(); vi.restoreAllMocks() })
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

function renderNew(path = '/app/projects/new') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/app/projects/new" element={<ProjectEditorPage key="new" />} />
    <Route path="/app/projects/:projectId" element={<ProjectEditorPage key="edit" />} />
  </Routes></MemoryRouter>)
}

describe('ProjectEditorPage', () => {
  it('refreshes the open project details after saving an edit', async () => {
    render(
      <MemoryRouter initialEntries={['/app/projects/draft-1']}>
        <Routes>
          <Route path="/app/projects/:projectId" element={<ProjectEditorPage key="edit" />} />
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
  it('prefills a selected template without creating a project automatically', () => {
    renderNew('/app/projects/new?template=product-ad')
    expect(screen.getByRole('textbox', { name: 'Project title' })).toHaveValue('A product worth noticing')
    expect((screen.getByRole('textbox', { name: 'Project brief' }) as HTMLTextAreaElement).value).toContain('Verified benefit:')
    expect(screen.getByRole('radio', { name: /portrait/i })).toBeChecked()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('ignores unknown templates and never applies templates to existing projects', async () => {
    const view = renderNew('/app/projects/new?template=not-a-template')
    expect(screen.getByRole('textbox', { name: 'Project title' })).toHaveValue('')
    view.unmount()
    renderNew('/app/projects/draft-1?template=product-ad')
    expect(await screen.findByRole('textbox', { name: 'Project title' })).toHaveValue('Original title')
    expect(screen.queryByRole('combobox', { name: 'Optional brief template' })).not.toBeInTheDocument()
  })

  it('protects edits before deliberately applying another template', () => {
    renderNew()
    fireEvent.change(screen.getByRole('textbox', { name: 'Project title' }), { target: { value: 'My own idea' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Optional brief template' }), { target: { value: 'educational' } })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: 'Use template' }))
    expect(screen.getByRole('textbox', { name: 'Project title' })).toHaveValue('My own idea')
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Use template' }))
    expect(screen.getByRole('textbox', { name: 'Project title' })).toHaveValue('An idea made clear')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('saves only the supported fields and reports saving and success', async () => {
    let resolveCreate: ((value: Project) => void) | undefined
    repository.create.mockImplementation(() => new Promise((resolve) => { resolveCreate = resolve }))
    renderNew('/app/projects/new?template=product-ad')
    fireEvent.change(screen.getByRole('textbox', { name: 'Project brief' }), { target: { value: 'My original product idea.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save project' }))
    expect(screen.getByRole('status')).toHaveTextContent('Saving your brief')
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await act(async () => {})
    expect(repository.create).toHaveBeenCalledWith({ title: 'A product worth noticing', brief: 'My original product idea.', format: 'portrait' })
    await act(async () => resolveCreate?.({ ...originalProject, id: 'new-brief' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Project brief saved to your account'))
  })

  it('retries a failed project load', async () => {
    repository.get.mockRejectedValueOnce(new Error('Temporary network failure'))
    renderNew('/app/projects/draft-1')
    expect(await screen.findByRole('alert')).toHaveTextContent('Temporary network failure')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('textbox', { name: 'Project title' })).toHaveValue('Original title')
    expect(repository.get).toHaveBeenCalledTimes(2)
  })

})
