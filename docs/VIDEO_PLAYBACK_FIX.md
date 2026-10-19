# Video playback fix — 2026-10-18

Historical Phase 4B report. Audio, file sizes, browser evidence and current controls are updated in [Phase 4C report](PHASE_4C_REPORT.md) and PREVIEW_AUDIO_INSPECTION.json.

## Root cause and implemented solution

The previous `isVideoPlayable` required a hard-coded `playbackStatus: verified`; all ten gallery entries were failed or unverified. That disabled videos before any user attempt. Thumbnail loading also gated Play, and poster/media errors removed it for the remainder of the session. This was a component-logic defect, not evidence that every external URL was broken. All six selected originals were successfully retrieved in this run; Abstract Motion Graphics also served an HTTP 206 byte range.

Removed the saved verification gate and poster-based playback gate. Added a shared VideoPreview player used by hero and gallery, with real native HTML5 controls, explicit play/pause, loading and 20-second stall feedback, source-error handling and retry. Card selection requests playback, with a visible Play button if the browser requires another gesture. Errors never disable the card. Only the selected modal mounts a video; the hero fetches nothing until played. Selecting/playing a preview pauses other videos. Closing pauses/unmounts it and restores keyboard focus. Category filtering, source links and licence links remain functional.

Six genuine 12-second H.264 previews and corresponding frame posters are served locally from public/videos. No external streaming request is required for gallery playback. The existing Vite server was reused. Cards have consistent 16:9 thumbnails in a light responsive gallery. No authentication, Supabase, user data, RLS or protected-route code was changed in this fix.

## Media results

Six previews passed full decoding and local range delivery checks. **Zero previews were newly verified playing in Chrome.** Browser inventory returned no browsers and opening Chrome returned `Browser is not available: chrome`. Browser screenshots were not taken. Extracted source frames were visually inspected; these must not be confused with browser screenshots.

All rows use local MP4 / H.264 Baseline, 24 fps, silent, 12 seconds. In every row, 12 sampled frames had 12 distinct hashes; local delivery was HTTP 206 with video/mp4.

| Preview | Hosting / format | Licence | Size | Verification |
| --- | --- | --- | --- | --- |
| Sintel · A journey through a fantasy world | Local H.264 MP4 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 1.60 MB | Decode + delivery passed; Chrome untested |
| Pico Sacro · A landscape in time | Local H.264 MP4 | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | 0.98 MB | Decode + delivery passed; Chrome untested |
| Abstract Motion Graphics | Local H.264 MP4 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 0.48 MB | Decode + delivery passed; Chrome untested |
| Biore Guard · Barisan Garuk-Garuk | Local H.264 MP4 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 2.09 MB | Decode + delivery passed; Chrome untested |
| Shrinking Aral Sea · 2000–2018 | Local H.264 MP4 | [Public domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) | 0.81 MB | Decode + delivery passed; Chrome untested |
| Five Minutes in Orbit | Local H.264 MP4 | [Public domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) | 0.42 MB | Decode + delivery passed; Chrome untested |

MP4s total 6,374,429 bytes (6.37 MB); posters total 175,194 bytes. Only one selected preview is requested; there is no gallery autoplay/preloading. All audio is removed to reduce bytes. The source clips are independent works; none are fabricated generation results. Per-file sources, authors, changes and licence links are in public/videos/README.md and public/inspiration-video-credits.md.

No final encoded preview failed the decoding or serving checks. Pico Sacro and Orbit originals produced a terminal WebM packet warning during preparation; each selected output fully decodes for 12 seconds without errors. The omitted Artemis, Coffee Run, Joy & Heron and two Caminandes references remain untested in this session and are removed from the playable collection rather than shown as broken cards.

## Checks

- npm.cmd run build: PASS.
- npm.cmd test: PASS, 61 tests in 9 files.
- npm.cmd run lint: PASS.
- git diff --check: PASS.
- Six MP4s: decoded, moving-frame hashes distinct, dimensions nonzero, correct MIME and byte-range delivery.
- Browser playback / pause / resume / close / switching / responsive layout: manual Chrome checks remain.

The regression tests cover immediate Play availability, real local asset paths, poster-failure independence, source errors and retries, stall handling, play/pause state, one selected player, close/focus restoration, switching and category filtering. They use media-method mocks and do not certify real decoding or browser playback.

## Files changed in this fix

- src/data/inspirationVideos.ts
- src/components/CreativeInspiration.tsx and CreativeInspiration.css
- src/components/VideoPreview.tsx (new shared player)
- src/pages/LandingPage.tsx
- src/pages/LandingPage.test.tsx and DashboardPage.test.tsx
- src/DesignSystem.css (targeted thumbnail/grid consistency)
- public/inspiration-video-credits.md
- public/videos/ (six MP4s, six frame posters, README)
- docs/PREVIEW_MEDIA_VALIDATION.json and this report
- scripts/check-active-preview.js (manual Chrome measurement helper)

All earlier unrelated uncommitted work is preserved. No commits or pushes were made.

## Exact remaining Chrome checks

1. Open http://localhost:5173/ in Chrome and refresh. Six cards should have visible Play controls immediately, regardless of poster timing. All video/poster URLs should be same-origin /videos/ paths.
2. Click a card. If Chrome requires another gesture, press Play preview. Confirm moving images, then pause and resume using native controls. Keep the tab in the foreground during measurement.
3. Open DevTools Console, paste scripts/check-active-preview.js, then run `await verifyActivePreview()`. It measures nonzero dimensions, at least two seconds of advancement, changed drawn frames, native decoded-frame count, pause stability and resumed progression. A passing result is real Chrome evidence. It also retains two actual PNG frame data URLs in window.vidioPreviewEvidence; these can be opened/saved for evidence. Run soon after opening a fresh preview so it does not finish during the check.
4. Capture a screenshot of the modal while an actual film frame is visible. Close using X and Escape in separate attempts; verify the card regains focus. Open another card and confirm the previous one is stopped.
5. Repeat steps 2–4 for each of the six titles in the table. Also start the hero and open a gallery card: the hero must pause.
6. Check a narrow/mobile viewport and keyboard Tab navigation. Use DevTools Network request blocking on one /videos/*.mp4 URL, confirm error + Retry, unblock it, and retry successfully. Broken thumbnails must not disable Play.

Only after these checks should the Chrome verification column be marked passed. No successful HTTP request or unit test has been substituted for browser playback evidence.
