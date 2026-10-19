# Phase 5A — real video foundation and audio pipeline

**Checked 19 October 2026.** This report preserves the existing Phase 4 work and records the Phase 5A implementation and current evidence. No commit, push, database migration, RLS/policy edit, hosted worker, billing change, third-party upload, or generation request was made in this phase.

## LTX 0.9.8 clip inspection

The user supplied `C:\Users\KINGSBEN\Downloads\output_29804.mp4` and authorized read-only inspection. The original file was not changed or copied. `ffprobe` is not installed or on PATH in this environment, so the file was inspected with Windows' registered media-property reader and a read-only ISO BMFF box parser. The parser checked box boundaries and extracted the track/sample-table metadata; this is not a full codec decode.

| Property | Result |
| --- | --- |
| File size | 110,316 bytes |
| Container | MP4 / ISO BMFF (`ftyp`, `free`, `mdat`, `moov` boxes) |
| Video | H.264 (`avc1`), 704 × 512, 30 fps, 57 samples |
| Duration | 1.9 seconds from the video media timescale/sample table (Windows rounded display: 1 second) |
| Audio | No audio track (`soun`); one video track only |
| Structural check | Passed: box sizes/bounds and track/sample-table structure parsed |
| Full decode / visible motion | Not independently verified; no FFmpeg/FFprobe decoder was available |
| SHA-256 | `81894118BE3292804524DD49CB2AFDCA4B38BBBC669A9249676756916F083B49` |

This establishes that the supplied file contains a video track with 57 timed samples and no audio track; it does not independently prove the visual content came from a model. The user reports it was generated with LTX 0.9.8. The no-audio finding is consistent with the inspected LTX 0.9.8 demo implementation: its pipeline is video-only and its output writer saves video frames to MP4 without creating or muxing audio. That is the confirmed explanation for this file's silence. A muted player cannot explain the missing audio track. Full decode and visible-motion review remain outstanding.

## Studio and local media work

Added an authenticated-route AI Video Studio at `/app/studio`, linked from the workspace navigation. It provides text-to-video/image-to-video planning modes, a prompt field, and local-only format, duration, resolution, and seed controls. Its status explicitly says generation is not connected; there is no Generate action, fake job state, fake progress, fabricated history, or cloud save. The external LTX demo is labeled as an external experiment and requires the user to open it and submit there themselves. Image-to-video planning does not accept or transmit an image.

The Studio includes a clearly separate sound-workflow status and a direct jump link, plus a return to project briefs. Generated results are described as unavailable; inspiration films remain in their existing separate area and are not presented as outputs.

The local import accepts MP4 files up to 250 MB, checks the extension, browser MIME type when present, and the `ftyp` signature before creating a temporary object URL. The video element provides local playback and browser-reported duration/dimensions. It does not upload the file. Audio-track and codec metadata are explicitly marked unverified in the browser. Object URLs are revoked when replaced/unmounted; out-of-order validation results are ignored. The header check is a format guard, not a full security/decode validation.

The existing provider-independent contracts in `src/generation/contracts.ts` remain a contract only; no provider client or generation backend was added.

## Model and audio choices

### Best next video test: LTX-2.5 ZeroGPU Space

The official [`Lightricks/LTX-2.5` Space](https://huggingface.co/spaces/Lightricks/LTX-2.5) reported **Running on Zero** during this review. Its public Gradio app accepts a prompt, optional image, width/height, duration, seed and decoder choices; the current UI defaults to two seconds and has a prompt-enhancement option. Its published code describes a two-stage distilled audio/video pipeline, with audio latents decoded through an audio VAE/vocoder and muxed with the video. The code comment reports 24.7 seconds cold end-to-end at 768 × 512 × 49 frames using the diffusion decoder; it estimates about 63 seconds of GPU reservation for that workload. This is Space maintainer benchmark data, not a guaranteed latency for another request. [Current app source](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py)

ZeroGPU's current published daily quota is 2 GPU minutes for unauthenticated visitors and 5 GPU minutes for Free accounts; the Free quota requires an account in good standing with verified email and age over 30 days. The quota resets 24 hours after first GPU use. The Space's xlarge allocation doubles quota consumption, so the app's ~63-second benchmark reservation corresponds to about 126 seconds (2.1 quota minutes). That fits within a fresh Free-account allowance but not a fresh anonymous allowance. The user's remaining account quota is not visible here, and operational status does not guarantee queue availability or successful inference. No Phase 5A request was submitted. [ZeroGPU quotas and rules](https://huggingface.co/docs/hub/spaces-zerogpu)

LTX-2.5 is a 22B-class model and the official self-host requirements specify NVIDIA GPU with at least 32 GB VRAM, 32 GB RAM, 100 GB free storage, CUDA 12.7+, and Python 3.12+; A100 80 GB/H100 is recommended. The Intel UHD 620 laptop is not a suitable local CUDA host. The model uses the **LTX-2.x Community License Agreement**, not Apache 2.0. Its terms allow qualifying use without a fee below the $10M annual-revenue threshold, subject to restrictions and obligations; entities at/above that threshold need a paid license. The exact model terms and additional use restrictions must be reviewed before product integration. [Official system requirements](https://docs.ltx.io/open-source-model/getting-started/system-requirements/) · [Model card and license](https://huggingface.co/Lightricks/LTX-2.5)

If a later user-authorized test is approved, use one synthetic prompt-only request at the Space's smallest practical settings, disable prompt enhancement to avoid an extra upstream call, and first confirm remaining ZeroGPU allowance in the account. Do not automatically retry. The target success must be a decoded output with moving frames and a verified audio stream, if the selected prompt/model is expected to produce audio. This Phase 5A plan does not authorize a new external request.

### Audio workflow candidates

| Candidate | Verified fit and terms | Recommendation |
| --- | --- | --- |
| **Kokoro-82M v1.0 TTS** | 82M parameters, Apache 2.0, English and multilingual voice options, with ONNX and PyTorch weights. The official starter uses `kokoro`, `soundfile` and `espeak-ng` for phoneme fallback. Small enough to benchmark on CPU, but speed/quality on this Intel laptop is unmeasured. Review voice/persona rights and require consent for any user-voice feature. [Model card](https://huggingface.co/hexgrad/Kokoro-82M) | Best lightweight voiceover candidate for a later local CPU benchmark; no cloning without explicit speaker rights/consent. |
| **Stable Audio 3 Small SFX** | A 0.6B SFX model under Stability AI Community License, with bundled T5Gemma subject to Google Gemma Terms and prohibited-use policy. Hugging Face access is gated and asks the user to accept terms and provide profile fields. Stability's current revenue cutoff for a separate Enterprise license is $1M, not LTX's $10M. Stability describes Small SFX as suitable for on-device/consumer-grade hardware, but this laptop has not been benchmarked. [Official model card](https://huggingface.co/stabilityai/stable-audio-3-small-sfx) · [Stability license](https://stability.ai/license) | Strong later Foley/SFX candidate after license acceptance and a real laptop/worker benchmark; no weights downloaded in Phase 5A. |
| **TangoFlux** | 515M text-to-audio model, up to 30 seconds at 44.1 kHz; the authors report 3.7 seconds on an A40. Its checkpoint is for **non-commercial research use only**, so it is unsuitable for a commercial Vidio product absent a different license. [Model card](https://huggingface.co/declare-lab/TangoFlux) · [Author benchmark](https://tangoflux.github.io/) | Exclude from production shortlist. |
| **LTX-2.3 Foley V2A LoRA** | Video-to-audio Foley adapter for the 22B LTX-2.3 base. It focuses on synced non-speech/non-music Foley, not dialogue or a music bed. LTX-2 Community License applies, and part of its disclosed FoleyBench training material is CC BY-NC-SA. It needs the large base model and ComfyUI audio workflow. [Model card](https://huggingface.co/Lightricks/LTX-2.3-22b-LoRA-Foley-V2A) · [Official guide](https://docs.ltx.io/open-source-model/feature-guides/audio/video-to-audio-foley) | A possible later Foley experiment, not a practical UHD 620 local option. |

For the first production audio path, use user-owned audio or carefully licensed CC0/CC-BY assets, with source/license/attribution tracked per asset. Generate voice separately with a properly licensed TTS model; mix to a defined loudness target, duck music under narration, mux AAC audio with H.264 MP4, and inspect duration, sync and both streams before marking an artifact successful. Do not use unlicensed music or imply an audio stream exists because a UI player can play the video.

## Secure generation and administration prerequisites

The browser should call only a same-origin Vidio API. The API verifies the Supabase access token server-side, derives the user ID from that verified identity, checks project ownership using the caller's authenticated access, validates settings and prompt length, applies per-user/global limits, and creates an idempotent owner-bound job. The worker claims a queue row with a lease/heartbeat, publishes only completed/validated files to private storage, and emits truthful queued/running/succeeded/failed/cancelled states. Cancellation must stop work and release resources. Recovery must detect expired leases, preserve an honest terminal failure, and permit only bounded, explicit retry. All downloads require owner checks and short-lived access; persist model/version, settings, provenance/license, media metadata and deletion/retention state. Keep provider keys, service-role keys, worker credentials and filesystem paths out of the browser. Never route a production user prompt/image directly to a public demo.

Smallest prerequisites before an authenticated pilot:

1. Pass the pending two-account Supabase project/RLS isolation test; do not relax policies to make Studio work.
2. Select and approve the provider, exact model/version/license, compute budget/quota, data-retention terms, and worker hosting boundary.
3. Implement server-side session/project ownership checks and an owner-bound job store/queue with idempotency, concurrency, rate, output-size and daily limits.
4. Define private storage, signed/owner-checked downloads, delete/expiry behavior, media validation and artifact provenance.
5. Add cancellation, lease recovery, bounded retry, failure codes, monitoring that excludes sensitive prompts, and worker permission isolation.
6. Define prompt/input/output safety review, user notice/consent, and content/report/delete workflow before inviting multiple users.

For administrators, later use a server-side authorization source tied to verified user identity, a narrowly managed role grant path, and deny-by-default server policies. Enforce each admin operation on the server, audit sensitive actions, require re-authentication/MFA where available, and test normal-user/admin behavior across accounts. Do not infer admin from an editable profile field or hidden UI button. No admin role was granted, no admin route/API was created, and the pending RLS isolation test remains a release blocker. No migration is proposed as implemented work.

## Assembly and remaining verification

No audio/video assembly was performed: no audio source with verified usage rights was supplied for mixing. Once supplied, work from copies in a temporary local workspace, retain the original, use FFmpeg to mux/re-encode as needed, and verify the completed MP4's codecs, video/audio durations, sync, resolution, frame rate, loudness and full decode before saving a new artifact.

Validation results for code in this phase:

- Production build (`npm run build -- --configLoader native`): passed (TypeScript and Vite production build).
- ESLint: passed.
- `git diff --check`: passed; only existing LF-to-CRLF notices appeared.
- Full Vitest suite (`npm test -- --configLoader native --pool threads`): **84 tests across 13 files passed**. The default Vite config loading and fork pool hit Windows `spawn EPERM` in the sandbox; native config loading and the thread pool ran successfully without elevation.
- LTX file: structural MP4 parse passed; full decode and visual motion review await an available FFprobe/decoder. The original remains unchanged.

No production provider, queue, storage, generation endpoint, authentication policy, migration, administrator permission, payment, or deployment was implemented.
