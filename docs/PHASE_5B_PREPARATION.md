# Phase 5B — secure generation integration preparation

**Review date: 19 October 2026.** The Studio remains behind the existing `RequireSession` route. This phase prepares local media handling, app-neutral API types, a review-only schema proposal, and the LTX-2.5 experiment plan. It submits no inference request and makes no database, storage-policy, RLS, role, payment, deployment, or credential changes.

## Studio verification

The route `/app/studio` is a child of the authenticated `/app` route. Supabase auth and project repository code were left as they are. Studio controls are explicitly local planning fields; there is no generation submit handler, provider SDK, fake job/progress/history, or media upload.

The local preview accepts `.mp4` up to 250 MB (250,000,000 bytes). Validation rejects empty files, oversize files, invalid extension/MIME, truncated headers, non-`ftyp` headers, implausible declared `ftyp` box length, and invalid major-brand bytes before creating an object URL. This is a format guard; it is **not** a full MP4 parser, malware scan, or codec/decode guarantee. The browser's video element then performs actual playback/decode; `error` distinguishes decode/corruption, unsupported codec, and generic local read/play failures. Duration and dimensions come from `loadedmetadata`; audio-stream and codec inspection remain explicitly unverified in browser.

The temporary URL is revoked when the selection is replaced or the component unmounts. Stale asynchronous validation results are ignored, including on unmount; cancelling the system picker clears the checking state. A status and the nearby explanatory copy say the media remains on-device and is not uploaded or saved to the account.

Focused tests cover valid headers, bad signature, truncated/mismatched box size, wrong extension, unsupported MIME, empty files, oversize rejection, exact 250 MB boundary, local playback controls and browser metadata, decode error messaging, URL cleanup on replace/unmount, and no-upload messaging. Responsive CSS collapses the builder, side cards, mode options, and experiment actions at 950/640 px; metadata becomes two columns at 640 px. Supporting text is 13–16 px with 15 px prompt input and visible keyboard focus. These styles were inspected at source level; a real-device/mobile-browser rendering pass remains useful before release.

## Provider-independent application boundary

`src/generation/contracts.ts` now describes text-to-video versus image-to-video as a discriminated union. Image conditioning can refer only to a future Vidio-owned `inputAssetId`; it cannot carry a local path, remote URL, provider URL, or credential. The request contains only project/prompt/mode/output settings/seed; there is no client-supplied owner ID or provider selection. Output metadata includes duration, dimensions, audio presence, byte count, checksum, and expiry. Job states distinguish queued, running with optional worker-reported progress, cancellation requested, succeeded, failed, cancelled, and expired. These are types only, not a gateway implementation or simulated job.

The proposed request lifecycle is:

1. The authenticated React client calls only a same-origin Vidio API with its Supabase access token and a bounded request plus an idempotency key.
2. The API verifies the token server-side, derives the owner from the verified subject, confirms the named project belongs to that owner through their normal RLS-scoped access, validates the mode/assets/model allowlist and settings, atomically reserves quotas, and returns a real job ID.
3. The queue admits work under global and per-user concurrency caps. A worker claims a lease, records heartbeat/status events, uses a pinned provider/model revision and server-held credentials, and writes to a private temporary workspace.
4. The worker validates decode, tracks, dimensions, duration, byte ceiling, checksum and policy result. Only then does it publish to private object storage and mark success. A public demo is never called directly by a production browser/user.
5. Status polling or authenticated SSE reads persisted worker events. Progress is reported only from real work emitted by the provider/worker. Cancellation becomes `cancel_requested` until the worker confirms that compute stopped; the worker then records `cancelled` and reconciles quota.
6. A watchdog handles expired leases, timeouts and crashes as explicit failures. Retry is bounded and deliberate; no automatic loop. Downloads, cancellation, retries and deletion all re-check ownership server-side. Expiry deletes both the object and metadata/event records according to retention policy.

Suggested owner-only pilot caps to tune after an actual benchmark: one running job globally; one running job and at most two queued per user; three attempts per user per day; fixed allowlisted model and settings; prompt <=1,000 characters; worker hard timeout <=20 minutes; artifact <=25 MiB; aggregate pilot artifacts <=500 MiB; default retention seven days. Reserve attempts/compute quota before worker dispatch and reconcile failures/cancellation transactionally. These caps must be server-enforced, not presented as UI-only choices.

Keep user prompts out of general logs. Never put Hugging Face, model, service-role, signed-storage, or worker secrets into React, Vite variables, browser storage, or responses. Store an opaque object key privately, return short-lived owner-authorized downloads, and apply retention to both the row and object. Validate/re-encode uploaded images and constrain decoded pixels before adding I2V; reject remote URLs to avoid SSRF. Require upload scanning and output decode checks before any asset can be used by a worker.

### Review-only SQL

The draft at [`docs/sql/phase_5b_generation_jobs_review_only.sql`](sql/phase_5b_generation_jobs_review_only.sql) is for human review and **has not been run**. It proposes job/event tables with owner-only select RLS and no direct authenticated-client writes. `project_id` is text because the repository types establish a string ID but do not establish the underlying Postgres type; the trusted API must verify ownership against `projects` before insert. Confirm actual project schema, Supabase grants/default privileges, role behavior, retention and storage model before turning this into a migration. A transaction-safe create/cancel RPC or restricted backend role still needs a separate reviewed implementation; do not solve it by giving the browser `service_role`.

Before database integration: verify current project policies with two independent accounts; review the draft and the exact authorization boundary; choose the trusted backend runtime and least-privileged database access strategy; approve schema/storage retention and deletion behavior; implement policy/transaction tests for cross-user read, cancel, retry, delete and download. The documented two-account RLS isolation test remains pending. No schema was changed here.

## One proposed LTX-2.5 synthetic A/V test (not submitted)

The official [`Lightricks/LTX-2.5` Space](https://huggingface.co/spaces/Lightricks/LTX-2.5) showed **Running on Zero** at review time. Its current public `app.py` was inspected. It accepts a text prompt, optional image, width/height, duration, seed, decoder, auto-length, randomize-seed and prompt-enhancement toggle. The Space defaults to 24 fps and 2 seconds, snaps frame counts to `8k+1`, uses 8 + 3 distilled stages, has a convolutional decoder by default, and accepts 512-pixel minimum width and height in increments of 64. The current `run` callback's ten inputs and four outputs match the Gradio bindings, and its call to `generate` matches that function's signature; I found no obvious callback mismatch in the published source. This is source inspection only, not proof that live inference succeeds. Enhancement calls a separate prompt-enhancer Space, so disable it for this test. [Space source, settings](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py)

One low-cost settings proposal:

| Input | Proposed value |
| --- | --- |
| Prompt | “A small blue paper boat glides slowly across a shallow rain puddle in soft daylight. Raindrops make gentle visible ripples as it passes. Stationary close camera, realistic water, continuous soft rainfall and subtle water lapping, no speech or music.” |
| Image | None (text-to-video only) |
| Width × height | 512 × 512 (minimum; valid multiples of 64) |
| Duration | 2 seconds; expected 49 frames at 24 fps, about 2.04 seconds after frame-grid snapping |
| Decoder | `conv` (published default / lower-cost path) |
| Seed | 42; randomize disabled |
| Auto length / prompt enhancer | Disabled |
| Requests/retries | Exactly one inference submission; no automatic retry |

For the Space's documented reservation formula, this workload reaches the **60-second minimum GPU reservation**. The GPU is `xlarge`, which is 2× quota cost, so budget **120 GPU quota seconds (2 minutes)**. Hugging Face currently lists 2 minutes/day for anonymous use and 5 minutes/day for Free accounts; the Free account's verified-email/30-day eligibility applies to hosting, while using existing ZeroGPU Spaces is free. Anonymous allowance would be consumed entirely by this minimum, with no margin; an eligible Free account with at least 120 seconds remaining is the safer $0 gate. Do not opt into credits. Actual remaining quota is account-specific and unverified. [ZeroGPU tiers and xlarge cost](https://huggingface.co/docs/hub/en/spaces-zerogpu) · [Space reservation calculation](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py)

The published Space source uses a joint two-stage pipeline: it passes audio latents from stage one into stage two, decodes audio through its audio VAE and vocoder, then passes the resulting waveform and sample rate alongside the frames to its MP4 encoder. This is a genuine synchronized A/V pathway; it is not a guarantee that every prompt yields a non-silent audio track or perfect event-level sound alignment. The model card describes synchronized video/audio generation. [Pipeline audio path](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py) · [LTX-2.5 model card](https://huggingface.co/Lightricks/LTX-2.5)

The model's exact license is the **LTX-2.x Community License Agreement**. The model card says commercial/production use below US$10M annual revenue is available at no cost subject to the community license; entities at or above that threshold need a paid Commercial Use Agreement. The agreement says Lightricks claims no rights in generated output, while making the user accountable for the input, output and subsequent uses under its restrictions. Review the full use, redistribution, notice and derivative restrictions before use beyond this isolated test. Prompt enhancement is disabled, avoiding the separate Gemma enhancer call. Self-hosting requires at least NVIDIA 32 GB VRAM, 32 GB RAM, 100 GB storage, CUDA 12.7 and Python 3.12; this machine's Intel UHD 620 is not an eligible local CUDA host. The hosted ZeroGPU worker avoids that local hardware requirement. [License/model page](https://huggingface.co/Lightricks/LTX-2.5) · [Full license](https://huggingface.co/Lightricks/LTX-2.5/blob/main/LICENSE) · [System requirements](https://docs.ltx.io/open-source-model/getting-started/system-requirements/)

After separate approval only, record the model revision, prompt/settings, request count, start/end times, before/after quota, output size/hash and observed errors. Keep the result local. Verify with FFprobe:

```powershell
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,duration -of json output.mp4
```

Success requires one `codec_type=video` and one `codec_type=audio`, valid H.264/MP4 video and AAC audio (or another supported expected codec), plausible 24-fps frame count, matching audio/video durations, and a full decode pass, for example `ffmpeg -v error -i output.mp4 -f null -`. Listen to the short output and inspect several distinct decoded frames; a listed audio stream alone does not establish audible or synchronized output. If no audio stream exists, record failure and do not retry.

No inference call, prompt submission, account sign-in, upload, credit purchase or other external side effect occurred in this phase.

## Administrator foundation

Provision the first administrator out of band: verify the person's identity, require MFA, have an existing system owner approve the grant, and write it through a restricted operator-only process. Never use user-editable `user_metadata`, a public signup flag, a hidden UI button, or a client-supplied role as authorization. A server-managed role table or trusted `app_metadata`/signed custom claim can represent roles; privileged requests must verify the JWT and check the current role server-side. Because JWT claims can be stale after removal, use short token lifetimes plus live role/revocation checks for sensitive operations.

Use a deny-by-default permission set for platform work: inspect aggregate job/queue health; stop a worker or disable a model; change global service limits; cancel/retry stuck jobs within policy; manage account status; and review abuse reports. Show only the minimum user identifiers/status metadata required. Ordinary user project and artifact access remains owner-only even for administrators. No administrator can browse private prompts, project briefs, images, generated videos, or storage by default. If a concrete support/legal requirement later requires content access, define a separate time-bound, case-reasoned permission with explicit business authorization, user notice where appropriate, MFA/re-authentication, narrow object scope, and immutable audit before implementing it.

Write append-only admin audit events for actor, action, target ID, reason/ticket, timestamp and request ID; exclude project content, prompt text, tokens and signed URLs. Protect audit writes/reads from normal users, prevent administrators from editing history, and alert on role grants, role changes, user suspensions and exceptional access. Test self-escalation denial, token revocation/staleness, least-privilege admin actions, cross-account job/storage denial, and no project-content visibility. Do not grant a role, add an admin route, change RLS, or execute SQL until separately reviewed and approved.

## Files and remaining approvals

Implementation files changed in this phase: `src/generation/LocalVideoImporter.tsx`, `src/generation/localMp4.ts`, `src/generation/localMp4.test.ts`, `src/generation/contracts.ts`, `src/pages/StudioPage.css`, and `src/pages/StudioPage.test.tsx`. Documentation added: this report and the review-only SQL draft. Existing app auth, cloud project, inspiration media, and Supabase code/policies were not changed by this phase. Existing user modifications remain in the worktree; no commit or push was made.

The remaining approvals are separate:

1. **One external LTX-2.5 test:** approve the synthetic prompt/settings above being sent to the public Space; confirm the public third-party handling is acceptable and the account has at least 120 seconds of free quota remaining; accept the applicable license for this isolated evaluation. No paid credits or retry.
2. **Database integration:** review and approve a specific schema/RLS/storage-retention migration and the server authorization/role strategy. Then run two-account isolation tests before enabling any generation requests.
3. **Production worker:** separately approve provider/worker host, secrets and data retention, concurrency/quota limits, and deployment. No public ZeroGPU Space or direct browser-to-provider connection is suitable as the production backend.

## Verification

The focused media suite and the complete project checks are reported in the Phase 5B implementation handoff. Tests exercise local file validation, browser error handling, URL lifecycle and Studio status. CSS breakpoints were reviewed in source; mobile visual QA on an actual browser/device is still pending.
