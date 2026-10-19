import { describe, expect, it } from 'vitest'
import { MAX_LOCAL_VIDEO_BYTES, validateLocalMp4, type LocalMp4File } from './localMp4'

function mp4(name = 'generated.mp4', type = 'video/mp4', boxSize = 24) {
  const header = new Uint8Array(24)
  new DataView(header.buffer).setUint32(0, boxSize)
  header.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0x69, 0x73, 0x6f, 0x6d], 4)
  return new File([header], name, { type })
}

describe('validateLocalMp4', () => {
  it('accepts an MP4 with an ftyp container signature', async () => {
    await expect(validateLocalMp4(mp4())).resolves.toBeUndefined()
  })

  it('rejects files with a misleading extension or invalid container header', async () => {
    await expect(validateLocalMp4(mp4('clip.mov'))).rejects.toThrow('.mp4 extension')
    await expect(validateLocalMp4(new File(['not an mp4 file'], 'clip.mp4', { type: 'video/mp4' })))
      .rejects.toThrow('valid MP4 container header')
    await expect(validateLocalMp4(mp4('truncated.mp4', 'video/mp4', 128)))
      .rejects.toThrow('valid MP4 container header')
  })

  it('rejects unsupported browser media types and files over the local limit', async () => {
    await expect(validateLocalMp4(mp4('clip.mp4', 'video/webm')))
      .rejects.toThrow('not identified by the browser as an MP4')
    const source = mp4()
    const oversized: LocalMp4File = {
      name: source.name,
      size: MAX_LOCAL_VIDEO_BYTES + 1,
      type: source.type,
      slice: source.slice.bind(source),
    }
    await expect(validateLocalMp4(oversized)).rejects.toThrow('250 MB or smaller')
  })

  it('allows a file exactly at the 250 MB boundary', async () => {
    const source = mp4()
    const boundary: LocalMp4File = {
      name: source.name,
      size: MAX_LOCAL_VIDEO_BYTES,
      type: source.type,
      slice: source.slice.bind(source),
    }
    await expect(validateLocalMp4(boundary)).resolves.toBeUndefined()
  })

  it('rejects empty files', async () => {
    await expect(validateLocalMp4(new File([], 'empty.mp4', { type: 'video/mp4' })))
      .rejects.toThrow('empty')
  })
})
