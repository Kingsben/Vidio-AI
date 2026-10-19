# Local preview media — 2026-10-18

Six independent third-party works, never Vidio AI output or endorsements. All files are 12-second H.264 Constrained Baseline MP4 excerpts, level 3.1, yuv420p, 24 fps, with the MP4 index moved to the beginning (`faststart`). Posters are real frames extracted from the matching excerpt and encoded as WebP. Original aspect ratios are preserved in the player. No full movies are included.

| File | Work / source | Credit | Licence | Original excerpt interval | Size / dimensions | Source audio |
| --- | --- | --- | --- | --- | --- | --- |
| `sintel-trailer.mp4` and `.webp` | [Sintel · A journey through a fantasy world](https://durian.blender.org/about/) | (c) copyright Blender Foundation — durian.blender.org; director Colin Levy | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 12–24 seconds | 1,748,657 bytes; 960x540 | AAC original audio restored |
| `pico-sacro-timelapse.mp4` and `.webp` | [Pico Sacro · A landscape in time](https://commons.wikimedia.org/wiki/File:Pico_Sacro_(TIMELAPSE).webm) | Endogamia | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | 3–15 seconds | 981,607 bytes; 960x540 | Source track is silent |
| `abstract-motion-graphics.mp4` and `.webp` | [Abstract Motion Graphics](https://commons.wikimedia.org/wiki/File:Abstract_Motion_graphics.webm) | I-Cheng Lee (design and animation); music credited to freeloops.com | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 3–15 seconds | 478,969 bytes; 960x540 | No track in retrieved source |
| `biore-guard-ad.mp4` and `.webp` | [Biore Guard · Barisan Garuk-Garuk](https://commons.wikimedia.org/wiki/File:Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm) | Ren Bramantyo | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 4–16 seconds | 2,241,034 bytes; 960x540 | AAC original audio restored |
| `shrinking-aral-sea.mp4` and `.webp` | [Shrinking Aral Sea · 2000–2018](https://commons.wikimedia.org/wiki/File:Shrinking_Aral_Sea_2000-2018.webm) | NASA Earth Observatory; animation by Wikimedia user Dexxor | [Public domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) | 1–13 seconds | 810,331 bytes; 540x540 | No track in retrieved source |
| `five-minutes-in-orbit.mp4` and `.webp` | [Five Minutes in Orbit](https://commons.wikimedia.org/wiki/File:Five_Minutes_in_Orbit_(154728).webm) | NASA Earth Observatory; imagery by the ISS Expedition 73 crew | [Public domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) | 19–31 seconds | 415,379 bytes; 810x540 | Source track is silent |

## Preparation and permissions

The individual source/licence pages above were retrieved on 2026-10-18, each successfully returning its licence declaration. CC BY 2.0/3.0 permit distribution and adaptations with attribution, licence notices and identification of changes. Changes here: 12-second excerpt, resized, 24 fps, H.264 re-encoding, poster extraction and WebP encoding. Phase 4C restores the synchronized original audio for Sintel and Biore as 96 kb/s AAC-LC, 48 kHz stereo, with video stream-copy. The other four selected source excerpts have no audible audio; none was invented. No share-alike assets were introduced. NASA entries have individual Commons public-domain declarations; no NASA endorsement is implied. Original credits remain below and in source pages.

Sintel is an excerpt of the trailer, not a screening of the complete film. Attribution: (c) copyright Blender Foundation | durian.blender.org, CC BY 3.0. The film itself and project data are licensed at the [official project page](https://durian.blender.org/about/); see also [sharing guidance](https://durian.blender.org/sharing/).

Original silent-video preparation command (FFmpeg 7.1, replace START/INPUT/OUTPUT for each row); Phase 4C adds source audio below where audible:

```text
ffmpeg -ss START -i INPUT -t 12 -an -vf "scale=960:540:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=24" -c:v libx264 -preset medium -crf 25 -profile:v baseline -level 3.1 -pix_fmt yuv420p -movflags +faststart OUTPUT.mp4
```

The small original trailer/short clips were downloaded only to ignored QA storage. No entire feature or short movie was downloaded. The temporary imageio-ffmpeg tool was removed after preparation; no runtime dependency or paid service was added.

## Original media bytes

- `sintel-trailer`: [original source](https://media.w3.org/2010/05/sintel/trailer.mp4).
- `pico-sacro-timelapse`: [original source](https://upload.wikimedia.org/wikipedia/commons/5/5b/Pico_Sacro_%28TIMELAPSE%29.webm).
- `abstract-motion-graphics`: [original source](https://upload.wikimedia.org/wikipedia/commons/7/7a/Abstract_Motion_graphics.webm).
- `biore-guard-ad`: [original source](https://upload.wikimedia.org/wikipedia/commons/e/ef/Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm).
- `shrinking-aral-sea`: [original source](https://upload.wikimedia.org/wikipedia/commons/c/c4/Shrinking_Aral_Sea_2000-2018.webm).
- `five-minutes-in-orbit`: [original source](https://upload.wikimedia.org/wikipedia/commons/5/53/Five_Minutes_in_Orbit_%28154728%29.webm).

## Evidence and limits

Every output was fully decoded by FFmpeg, sampling 12 different frames over 12 seconds. Every output was served by the existing Vite server as `video/mp4`, HTTP 206, for a 4096-byte Range request. Exact sizes and SHA-256 hashes are recorded in `docs/PREVIEW_MEDIA_VALIDATION.json`. These are decoding and delivery checks, not Chrome moving-frame playback certification. Chrome automation was unavailable; manual checks are documented in `docs/VIDEO_PLAYBACK_FIX.md`.

## Phase 4C audio audit

The earlier `-an` preparation stripped every audio stream. It was not an HTML mute/zero-volume problem. Inspection of the exact original source versions found:

- Sintel: AAC-LC, 48 kHz stereo; audible. Original excerpt 12–24 seconds restored as AAC-LC, 96 kb/s, 48 kHz stereo.
- Pico Sacro: Opus, 48 kHz stereo, but the selected 3–15 second excerpt is silent (mean and peak at the signed-16-bit measurement floor of -91 dB).
- Abstract Motion Graphics: no audio stream in the retrieved Commons file. Its source-page description mentions music, but that music is not in this file; no unrelated or unverified soundtrack was added.
- Biore Guard: Opus, 48 kHz stereo; audible. Original excerpt 4–16 seconds restored as AAC-LC, 96 kb/s, 48 kHz stereo.
- Aral Sea: no audio stream in the source.
- Five Minutes in Orbit: Opus, 48 kHz stereo, but the selected 19–31 second excerpt is silent (mean and peak -91 dB).

Video streams were copied unchanged when restoring sound. Source-vs-AAC waveform correlation over the first 3 seconds of each restored excerpt measured a best offset of 0 ms (correlations 0.99855 / 0.99812 at 1 kHz comparison resolution). This is technical alignment evidence, not a listening/browser test. Both complete final files decoded successfully, with measurable nonzero audio levels. Full details: docs/PREVIEW_AUDIO_INSPECTION.json. Current MP4 bytes total 6,675,977 (about 6.68 MB); audio adds 301,548 bytes. The player starts sound only after a Play action, provides mute/volume controls for audible clips, and identifies silent sources.

Audio restoration command (START is the original excerpt start):

```text
ffmpeg -i PREVIEW.mp4 -ss START -i ORIGINAL -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 96k -ar 48000 -ac 2 -af "atrim=duration=12,asetpts=PTS-STARTPTS" -t 12 -movflags +faststart PREVIEW-WITH-AUDIO.mp4
```

The user confirmed moving-frame Chrome playback before Phase 4C. Restored audible playback, perceived synchronization and controls still require the manual browser checks in docs/PHASE_4C_REPORT.md. No browser listening test or screenshot is claimed.
