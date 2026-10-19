// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudioPage from './StudioPage'

function renderStudioPage() {
  return render(<MemoryRouter><StudioPage /></MemoryRouter>)
}

afterEach(() => cleanup())

describe('StudioPage', () => {
  it('makes the provider boundary explicit and never offers a disconnected generate action', () => {
    renderStudioPage()

    expect(screen.getByText(/Vidio AI generation is not connected yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open ltx-2\.5 space/i })).toHaveAttribute(
      'href',
      'https://huggingface.co/spaces/Lightricks/LTX-2.5',
    )
    expect(screen.queryByRole('button', { name: /^generate/i })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: /planned output settings/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return to project briefs/i })).toHaveAttribute('href', '/app')
  })

  it('switches between the two prompt modes and records setting choices locally', () => {
    renderStudioPage()

    fireEvent.click(screen.getByRole('button', { name: /image to video/i }))
    expect(screen.getByRole('button', { name: /image to video/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/does not accept or transmit a reference image/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Creative prompt'), { target: { value: 'A paper boat crosses a puddle.' } })
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Aspect ratio'), { target: { value: 'portrait' } })
    expect(screen.getByLabelText('Creative prompt')).toHaveValue('A paper boat crosses a puddle.')
    expect(screen.getByLabelText('Duration')).toHaveValue('4')
    expect(screen.getByLabelText('Aspect ratio')).toHaveValue('portrait')
    expect(screen.getByText(/not persisted or applied to the external demo/i)).toBeInTheDocument()
  })

  it('keeps an audio workflow status reachable and explains the pending audio-capable experiment', () => {
    renderStudioPage()

    expect(screen.getByRole('region', { name: /sound is a separate stage/i })).toBeInTheDocument()
    expect(screen.getByText(/planned LTX-2\.5 test can generate video with audio/i)).toBeInTheDocument()
    expect(screen.getByText(/Voiceover, mixing and audio export remain unconnected/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore audio workflow/ })).toHaveAttribute('href', '#audio-workflow')
  })
})

describe('local MP4 import', () => {
  let createObjectUrl: ReturnType<typeof vi.fn>
  let revokeObjectUrl: ReturnType<typeof vi.fn>
  let originalCreate: PropertyDescriptor | undefined
  let originalRevoke: PropertyDescriptor | undefined

  beforeEach(() => {
    originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
    originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
    createObjectUrl = vi.fn(() => 'blob:local-mp4-preview')
    revokeObjectUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl })
  })

  afterEach(() => {
    if (originalCreate) Object.defineProperty(URL, 'createObjectURL', originalCreate)
    else Reflect.deleteProperty(URL, 'createObjectURL')
    if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', originalRevoke)
    else Reflect.deleteProperty(URL, 'revokeObjectURL')
  })

  it('previews a validated local MP4 and displays metadata supplied by the browser', async () => {
    const { unmount } = renderStudioPage()
    const validHeader = new Uint8Array(24)
    new DataView(validHeader.buffer).setUint32(0, 24)
    validHeader.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0x69, 0x73, 0x6f, 0x6d], 4)
    const file = new File([validHeader], 'ltx-generated.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByLabelText(/choose an mp4 file/i), { target: { files: [file] } })

    const video = await screen.findByLabelText('Local preview: ltx-generated.mp4')
    expect(createObjectUrl).toHaveBeenCalledWith(file)
    expect(video).toHaveAttribute('src', 'blob:local-mp4-preview')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('playsinline')

    Object.defineProperties(video, {
      videoWidth: { configurable: true, value: 640 },
      videoHeight: { configurable: true, value: 360 },
      duration: { configurable: true, value: 2.04 },
    })
    fireEvent.loadedMetadata(video)

    expect(screen.getByText('640 × 360')).toBeInTheDocument()
    expect(screen.getByText('2.0 sec')).toBeInTheDocument()
    expect(screen.getByText('Not verified in browser')).toBeInTheDocument()

    unmount()
    await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledWith('blob:local-mp4-preview'))
  })

  it('rejects an MP4 extension whose file signature is invalid', async () => {
    renderStudioPage()
    const file = new File(['not a video'], 'fake.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByLabelText(/choose an mp4 file/i), { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('valid MP4 container header')
    expect(createObjectUrl).not.toHaveBeenCalled()
  })

  it('reports a browser decode failure for a structurally valid but unplayable MP4', async () => {
    renderStudioPage()
    const header = new Uint8Array(24)
    new DataView(header.buffer).setUint32(0, 24)
    header.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0x69, 0x73, 0x6f, 0x6d], 4)
    fireEvent.change(screen.getByLabelText(/choose an mp4 file/i), {
      target: { files: [new File([header], 'truncated-content.mp4', { type: 'video/mp4' })] },
    })
    const video = await screen.findByLabelText('Local preview: truncated-content.mp4')
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 3 } })
    fireEvent.error(video)
    expect(await screen.findByRole('alert')).toHaveTextContent(/appears corrupted or uses a codec/i)
  })

  it('releases a previous object URL when a local file is replaced', async () => {
    createObjectUrl.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    const firstHeader = new Uint8Array(24)
    new DataView(firstHeader.buffer).setUint32(0, 24)
    firstHeader.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0x69, 0x73, 0x6f, 0x6d], 4)
    const secondHeader = firstHeader.slice()
    renderStudioPage()
    const picker = screen.getByLabelText(/choose an mp4 file/i)
    fireEvent.change(picker, { target: { files: [new File([firstHeader], 'first.mp4', { type: 'video/mp4' })] } })
    await screen.findByLabelText('Local preview: first.mp4')
    fireEvent.change(picker, { target: { files: [new File([secondHeader], 'second.mp4', { type: 'video/mp4' })] } })
    await screen.findByLabelText('Local preview: second.mp4')
    await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledWith('blob:first'))
    expect(screen.getByText(/The file is not uploaded or saved to your account/)).toBeInTheDocument()
  })

  it('lets the user clear a local preview and releases its temporary URL', async () => {
    const header = new Uint8Array(24)
    new DataView(header.buffer).setUint32(0, 24)
    header.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0x69, 0x73, 0x6f, 0x6d], 4)
    renderStudioPage()
    fireEvent.change(screen.getByLabelText(/choose an mp4 file/i), {
      target: { files: [new File([header], 'clear-me.mp4', { type: 'video/mp4' })] },
    })

    await screen.findByLabelText('Local preview: clear-me.mp4')
    fireEvent.click(screen.getByRole('button', { name: /clear preview/i }))

    expect(screen.queryByLabelText('Local preview: clear-me.mp4')).not.toBeInTheDocument()
    await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledWith('blob:local-mp4-preview'))
    expect(screen.getByText(/The file is not uploaded or saved to your account/)).toBeInTheDocument()
  })
})
