export const MAX_LOCAL_VIDEO_BYTES = 250 * 1000 * 1000

export type LocalMp4File = Pick<File, 'name' | 'size' | 'type' | 'slice'>

export async function validateLocalMp4(file: LocalMp4File): Promise<void> {
  if (file.size === 0) throw new Error('This file is empty.')
  if (file.size > MAX_LOCAL_VIDEO_BYTES) throw new Error('Choose an MP4 that is 250 MB or smaller.')
  if (!file.name.toLowerCase().endsWith('.mp4')) throw new Error('Choose a file with the .mp4 extension.')
  if (file.type && !['video/mp4', 'application/mp4'].includes(file.type.toLowerCase())) {
    throw new Error('This file is not identified by the browser as an MP4 video.')
  }
  if (file.size < 16) throw new Error('This file does not contain a valid MP4 container header.')

  const header = await file.slice(0, 16).arrayBuffer()
  if (header.byteLength < 16) throw new Error('This file has a truncated MP4 container header.')
  const view = new DataView(header)
  const boxSize = view.getUint32(0)
  const boxType = new TextDecoder().decode(new Uint8Array(header, 4, 4))
  const majorBrand = new TextDecoder().decode(new Uint8Array(header, 8, 4))

  if (
    boxType !== 'ftyp' ||
    boxSize < 16 ||
    boxSize > file.size ||
    !/^[\da-zA-Z ]{4}$/.test(majorBrand)
  ) {
    throw new Error('This file does not contain a valid MP4 container header.')
  }
}
