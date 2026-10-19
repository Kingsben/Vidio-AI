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

---

## Archived credits for earlier external references

The following original delivery details are preserved from the earlier worktree. Their collection counts and "no edits" descriptions apply to that earlier external-stream version, not to the local excerpts above. Artemis, Coffee Run, Joy & Heron and the two Caminandes entries are not in the current playable collection.

# Workspace inspiration video credits

These videos are independent third-party reference works, not generated, edited, commissioned, or endorsed by Vidio AI. Nothing plays on page load. Selecting a card opens its poster-backed player; playback starts only when the viewer presses the native play control. The player uses `preload="none"`. Most posters and lazy-loaded thumbnails are served by Wikimedia Commons. The featured Sintel trailer and poster are mirrored by W3C's media test archive; the official film page is linked below for attribution and licence information.

| Video | Creator / attribution | Licence | Source and media details |
| --- | --- | --- | --- |
| [Artemis III Core Stage Arrival at KSC Timelapse](https://commons.wikimedia.org/wiki/File:Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_(KSC-20260427-RV-FMX01-M20626).webm) | NASA Kennedy Space Center | Public domain, U.S. Government work | [Wikimedia 240p VP9 WebM transcode](https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9a/Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm/Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm.240p.vp9.webm), 9,660,990 bytes; served as `video/webm`. No edits by Vidio AI. |
| [Biore Guard “Barisan Garuk-Garuk”](https://commons.wikimedia.org/wiki/File:Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm) | Ren Bramantyo; the Commons file page includes the production credits | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Original Commons WebM](https://upload.wikimedia.org/wikipedia/commons/e/ef/Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm), 1920×1080, 9,509,237 bytes. No edits by Vidio AI. |
| [Pico Sacro (Timelapse)](https://commons.wikimedia.org/wiki/File:Pico_Sacro_(TIMELAPSE).webm) | Endogamia | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Original Commons WebM](https://upload.wikimedia.org/wikipedia/commons/5/5b/Pico_Sacro_%28TIMELAPSE%29.webm), 1920×1080, 8,613,401 bytes. No edits by Vidio AI. |
| [Abstract Motion graphics](https://commons.wikimedia.org/wiki/File:Abstract_Motion_graphics.webm) | I-Cheng Lee (design and animation); music credited to freeloops.com | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Original Commons WebM](https://upload.wikimedia.org/wikipedia/commons/7/7a/Abstract_Motion_graphics.webm), 1280×720, 3,754,114 bytes. No edits by Vidio AI. |
| [Shrinking Aral Sea 2000–2018](https://commons.wikimedia.org/wiki/File:Shrinking_Aral_Sea_2000-2018.webm) | NASA Earth Observatory imagery; animation by Wikimedia user Dexxor | Public domain (NASA) | [Original Commons WebM](https://upload.wikimedia.org/wikipedia/commons/c/c4/Shrinking_Aral_Sea_2000-2018.webm), 720×720, 1,682,021 bytes, 19.24 seconds. No edits by Vidio AI. |
| [Five Minutes in Orbit](https://commons.wikimedia.org/wiki/File:Five_Minutes_in_Orbit_(154728).webm) | NASA Earth Observatory; ISS Expedition 73 crew imagery; video by Michala Garrison | Public domain (NASA) | [Original Commons WebM](https://upload.wikimedia.org/wikipedia/commons/5/53/Five_Minutes_in_Orbit_%28154728%29.webm), 1920×1280, 7,973,947 bytes, 31.52 seconds. The NASA source page documents its photo cropping, contrast enhancement, and lens-artifact removal. No edits by Vidio AI. |
| [Coffee Run](https://commons.wikimedia.org/wiki/File:Coffee_Run_-_Blender_Open_Movie-full_movie.webm) | Blender Foundation | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Original: 1920×804, 29,260,881 bytes. [Wikimedia 480p VP9 WebM transcode](https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3f/Coffee_Run_-_Blender_Open_Movie-full_movie.webm/Coffee_Run_-_Blender_Open_Movie-full_movie.webm.480p.vp9.webm), 14,845,306 bytes. No edits by Vidio AI. |
| [Joy & Heron](https://commons.wikimedia.org/wiki/File:Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm) | Passion Pictures; directors Kyra & Constantin; commissioned by JD.com | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Original: 1920×1080, 41,126,379 bytes. [Wikimedia 480p VP9 WebM transcode](https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1c/Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm/Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm.480p.vp9.webm), 13,374,977 bytes. No edits by Vidio AI. |
| [Caminandes: Gran Dillama](https://commons.wikimedia.org/wiki/File:Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm) | Pablo Vazquez, Beorn Leonard, and Francesco Siddi; soundtrack by Jan Morgenstern | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Original: 1920×1080, 43,033,601 bytes. [Wikimedia 480p VP9 WebM transcode](https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm.480p.vp9.webm), 16,072,298 bytes. No edits by Vidio AI. |
| [Caminandes: Llama Drama](https://commons.wikimedia.org/wiki/File:Caminandes-_Llama_Drama_-_Short_Movie.ogv) | Pablo Vazquez, Beorn Leonard, and Francesco Siddi; music and sound by Jan Morgenstern | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Original Ogg video: 1920×1080, 31,428,271 bytes. [Wikimedia 480p VP9 WebM transcode](https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv/Caminandes-_Llama_Drama_-_Short_Movie.ogv.480p.vp9.webm), 4,749,930 bytes. No edits by Vidio AI. |
| [Sintel trailer](https://durian.blender.org/about/) | Blender Foundation; directed by Colin Levy | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [W3C-hosted MP4 trailer](https://media.w3.org/2010/05/sintel/trailer.mp4) and [poster](https://media.w3.org/2010/05/sintel/poster.png). No edits by Vidio AI. |

The Blender Open Movies also documented in [animation-film-credits.md](./animation-film-credits.md) are independent third-party works. The Sintel trailer uses an unedited MP4 mirror hosted by W3C; other Commons media transcodes are provided by Wikimedia Commons. Vidio AI makes no edits to these references.

Only categories with matching reference footage are shown. The current gallery includes Cinematic, Animation, Marketing, Music & Motion, Nature, Educational, and Social Content. The square-format Aral Sea time-lapse is included in Social Content as a real reference for square video framing. This curated gallery is separate from private cloud project briefs.
