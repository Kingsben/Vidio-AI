# Phase 5F — secure AI generation backend foundation

**Review date: 19 October 2026.** This phase adds local, provider-neutral backend logic and production-oriented review SQL. It does not deploy an endpoint, execute SQL, change RLS or Storage, grant an administrator, configure a provider secret, submit inference, create paid resources, commit, or push.

## 1. Repository and existing application audit

The repository root is `C:\Projects\vidio-ai`. The worktree already contained legitimate Phase 4/5 application, documentation, media and test changes; all were preserved. No destructive Git command was used.

The authenticated `/app/studio` route remains protected by the existing Supabase session boundary. Its prompt/settings are local React state, it exposes no Generate action, and it says that generation and cloud saving are not connected. Local MP4 preview still validates the container header and 250 MB limit, uses native playback, reports browser errors/metadata, and revokes object URLs on replacement, clear and unmount. No Studio change was necessary in Phase 5F: adding a generation-looking UI before a deployed endpoint would misstate current functionality.

The browser environment contains only the Supabase URL and public publishable-key configuration. The existing configuration validator rejects secret/service-role/JWT-shaped keys. No provider, worker or service-role secret is referenced from application code. The new backend modules have no frontend imports, and the React entry graph does not import them.

## 2. Confirmed database facts and remaining metadata

The following deployed facts are accepted from the completed audits and were not guessed:

- `public.projects` has UUID `id` and `user_id`; defaults are `gen_random_uuid()` and `auth.uid()` respectively.
- Its text/timestamp columns and defaults match the Phase 5F handoff.
- RLS is enabled and the four authenticated owner policies cover select, insert, update and delete with `user_id = auth.uid()` ownership checks.
- Anonymous select/insert are denied. Authenticated users can insert supported content fields but cannot insert/update `user_id` or update `updated_at` directly.
- The named validation/primary/user foreign-key constraints exist; the user foreign key cascades on Auth-user deletion.
- `vidio_projects_updated_at` maintains timestamps.

The current complete snapshot is still needed for facts that materially affect a safe migration: object/schema owners and collisions; exact index/constraint definitions; complete table/column/sequence grants and default ACLs; the timestamp trigger-function definition, owner, security mode, search path and execute grants; other relevant privileged functions; the `pgcrypto` function schema; current Storage buckets and every applicable `storage.objects` policy; Realtime publication membership; and confirmation that the proposed `vidio_private` schema will not be exposed through PostgREST.

[`phase_5f_database_metadata_json_read_only.sql`](sql/phase_5f_database_metadata_json_read_only.sql) is the single remaining metadata request. It is one read-only statement returning one `vidio_phase_5f_metadata` JSON value. It reads catalog/configuration metadata and bucket settings only—no project rows, Auth-user records, prompts, media objects, passwords, tokens or credentials. Empty arrays are meaningful and should be preserved. The prior multi-result Phase 5E query pack is superseded for this review.

## 3. Review-only generation, storage and administrator proposal

[`phase_5f_generation_admin_storage_migration_review_only.sql`](sql/phase_5f_generation_admin_storage_migration_review_only.sql) is a production-oriented proposal protected by `BEGIN … ROLLBACK`. It is not approved or deployed.

The proposal separates browser-readable owner data from backend-only operations:

- Public owner-scoped tables hold input-asset metadata, generation jobs, validated artifact metadata and append-only safe events.
- `vidio_private` holds provider/model identifiers, leases, internal failures, quota/accounting data, object keys, deletion work, service limits, administrator roles and audit records.
- A composite `(project_id,user_id)` foreign-key chain makes cross-owner project/job/input/artifact associations invalid at the database level.
- Authenticated users receive selected columns from their own public rows and no direct insert/update/delete grants. They cannot set ownership, status, provider, leases, object paths, compute usage or success.
- Per-user idempotency combines a unique key with a server-computed request fingerprint. Admission rechecks after its serialization lock so concurrent duplicates return the existing job rather than creating a second job or leaking a unique-index race.
- One transaction validates ownership and the enabled model profile, reserves daily quota, enforces queue caps, creates the queued job/runtime row and appends the acceptance event.
- Cancellation is owner-checked. A queued job cancels and releases its reservation transactionally; a running job moves to `cancel_requested` until the worker acknowledges the race outcome.
- Status transitions, immutable request fields, terminal timestamps and append-only event/audit records have database checks/triggers.
- No provider/model is enabled, no administrator is assigned, and no browser or worker gets broad table mutation privileges.

The proposal defines worker-private state but intentionally withholds worker mutation functions and grants until worker identity and transport are chosen. The approved migration must add lease-token-scoped claim, heartbeat/progress, provider-submission, finalize/fail/cancel, quota-settlement, expiration and deletion-completion functions. Direct worker table updates are not an acceptable shortcut.

The final review must also confirm rollback sequencing. Intake must be disabled and leases drained before schema rollback; Storage objects must be deleted through the Storage API because dropping database rows does not remove object bytes.

## 4. Implemented provider-neutral backend code

The new [`src/generation/backend`](../src/generation/backend) subtree contains pure TypeScript domain logic and ports. It is usable by a future Edge Function or Node/Deno service, but it does not claim that an endpoint exists.

Implemented behavior:

- Exact request-field allowlisting; plain-object-only input; UUID, prompt, optional negative-prompt, seed and idempotency validation.
- Exact allowlisted generation presets instead of arbitrary model settings.
- Explicit rejection of client attempts to set owner, provider, model, status, artifact, quota, lease or timestamps.
- Bearer-token boundary through an injected verifier that must validate signature, issuer, audience and expiry.
- A project-ownership port that returns the same denial for missing and foreign projects.
- A server-side execution planner; clients do not choose a provider or trusted model identifier.
- An atomic admission-store contract for ownership-bound idempotency, quota/concurrency checks and real persisted jobs.
- Actor-scoped status-transition rules, including cancellation races and terminal-state protection.
- Provider, worker lease/heartbeat/progress/cancellation, quota and private-artifact storage interfaces.
- Artifact metadata validation for UUID, MP4 media type, duration, dimensions, frame rate, allowlisted video/audio codecs, audio requirement, byte limit, SHA-256 and future expiration. A provider URL is never accepted as an artifact.
- Fixed public errors with generic unexpected-failure handling; causes, stack traces, prompts and tokens are not returned.

These modules contain no in-memory fake queue, fake provider, simulated progress, timer completion, database call or network request. Tests use mocks to verify boundaries; they are not presented as hosted integration tests.

## 5. First trusted runtime and job-intake design

Supabase Edge Functions are a good fit for the initial authenticated intake endpoint because the project already uses Supabase Auth and RLS. Current Supabase documentation supports user-authenticated functions that receive an RLS-scoped client and warns that the administrative client bypasses RLS. The function should use verified user auth for ownership reads and a narrow reviewed transaction function for admission. [`Securing Edge Functions`](https://supabase.com/docs/guides/functions/auth)

The intended `POST /generation-jobs` flow is:

1. Require `POST`, JSON, a bounded body, an `Authorization: Bearer` session and an idempotency key; enforce exact application origins.
2. Let the platform/user-auth wrapper verify the JWT. Derive the user from verified claims and never accept a body owner.
3. Parse through the Phase 5F allowlist and check the project through the caller's RLS-scoped client.
4. Resolve a server-configured model profile, then call the single database admission transaction with the verified user.
5. Return `202`/the existing idempotent response with only an opaque Vidio job ID and real persisted status. Log a request ID and safe code, never the token or prompt.

An Edge Function is not the video worker. Hosted limits are currently 256 MB memory, 2 seconds active CPU per request and 150 seconds wall-clock on Free; the Free plan includes 500,000 function invocations. The function must enqueue and return promptly rather than run a model, decode video or wait through a long GPU queue. [`Edge Function limits`](https://supabase.com/docs/guides/functions/limits) · [`Supabase Free quotas`](https://supabase.com/docs/guides/platform/billing-on-supabase)

Deployment still needs a reviewed function implementation, project secret strategy, CORS configuration and approved migration. The service-role/secret key must stay in the hosted runtime, never Vite/browser configuration. Database functions must validate again because an administrative client bypasses RLS.

## 6. Provider and worker strategy

### Experimental path

Keep the official LTX-2.5 ZeroGPU Space as one manual, synthetic, separately authorized experiment. Existing ZeroGPU Spaces are shared demos with daily quota and queue behavior; `xlarge` consumes quota at 2×. This access does not establish an API SLA, unlimited capacity, data-processing terms or permission to expose the demo to arbitrary Vidio users. [`ZeroGPU documentation`](https://huggingface.co/docs/hub/en/spaces-zerogpu)

### Production path

Use a separately deployed worker with a replaceable provider adapter. Start at global concurrency one. The worker claims a lease, submits an allowlisted pinned model/revision, persists the private provider reference, emits only real status/stage information, observes cancellation, validates the complete result, stores it privately and settles reserved versus consumed quota. Timeouts become explicit safe failures; retries are bounded, intentional and idempotent.

LTX Video 0.9.8 remains evidence of a real short video-only experiment; the inspected MP4 has no audio stream. LTX-2.5 generates joint audio/video and the current model page documents synchronized audio/video use, but each output must still pass track/decode inspection and listening. Its exact license remains the LTX-2.x Community License: under-US$10M commercial/production use is subject to its terms; entities at or above the threshold require a commercial agreement. Hosted-demo access is separate from model licensing. [`LTX-2.5 model and license`](https://huggingface.co/Lightricks/LTX-2.5)

The model page currently reports that LTX-2.5 is not deployed by a Hugging Face Inference Provider. Hugging Face routed-provider credits for Free users are currently only $0.10/month and subject to change; dedicated Inference Endpoints require an active paid setup. A reliable production video service therefore needs approved paid GPU/provider capacity or suitable owned GPU infrastructure. The Intel UHD 620 is not that infrastructure. [`Inference Provider pricing`](https://huggingface.co/docs/inference-providers/pricing) · [`Inference Endpoint access`](https://huggingface.co/docs/inference-endpoints/guides/access)

The provider adapter must record model/revision/license provenance, retention/region terms and cost units. Hard server caps must stop dispatch before unapproved spend. No automatic billing upgrade or provider fallback is allowed.

## 7. Private video storage

The proposed Storage buckets are `generation-inputs` and `generation-outputs`, both private. Pilot limits are 10 MiB for validated JPEG/PNG/WebP inputs and 25 MiB for MP4 outputs. Supabase Free currently allows at most 50 MB per file and 1 GB of Storage, so the pilot cap fits but generated video can exhaust the allocation quickly. [`Storage file limits`](https://supabase.com/docs/guides/storage/uploads/file-limits) · [`Supabase Free quotas`](https://supabase.com/docs/guides/platform/billing-on-supabase)

Only the trusted worker uploads, using opaque server-generated object names. There are no anonymous or authenticated `storage.objects` policies in the proposal. Because service-key uploads may not receive normal user ownership, access is based on the owner-checked job/artifact relation, not `storage.objects.owner_id`. An authenticated API rechecks that the artifact belongs to the caller, is succeeded, unexpired and not deleted, then creates a short-lived signed URL (proposed five minutes). Private buckets require RLS-authorized downloads or signed URLs; public buckets bypass download access controls and are unsuitable here. [`Private bucket access`](https://supabase.com/docs/guides/storage/buckets/fundamentals) · [`Storage ownership`](https://supabase.com/docs/guides/storage/security/ownership)

Before publishing success, the worker must verify the MP4/container, full decode, allowed codecs, tracks, duration, dimensions, frame rate, byte count and SHA-256. Audio-capable jobs require both a valid audio stream and audible review during the pilot. Retention defaults to seven days with a 500 MiB per-user pilot ceiling. Cleanup is idempotent and handles expiry, job/account deletion and orphaned temporary/final objects; deleting the database row alone is insufficient.

## 8. Administrator foundation

The proposal places administrator authority in a non-exposed, server-managed table, not `user_metadata`, an editable profile, frontend state or hidden navigation. No assignment is inserted.

The first administrator must be provisioned out of band after identity verification, MFA enrollment and two-person approval with a reason/ticket. Every privileged request must verify the user session, current MFA assurance and a live non-revoked/non-expired role. JWT/app metadata may help presentation but is not sufficient for sensitive authorization because it can be stale.

Permissions are task-scoped: aggregate job/queue/provider health, model disablement, service limits, account state and abuse reports. Administrators do not receive default access to prompts, project briefs, images, videos, object keys or signed URLs. Any later exceptional content access requires a separate time-limited case grant, business authorization, reauthentication/MFA and audit.

Audit rows are append-only and contain actor, effective role, action, target type/ID, reason/ticket, request ID, timestamp, outcome/context from an allowlist, and no prompt/media/token/object path/signed URL. Role grants/revocations, account restrictions, model disablement, exceptional access and audit-write failures require alerts. Activation needs a separately approved migration and an independently authorized first role grant.

## 9. Verification model and results

Automated tests in Phase 5F are mocked local unit tests. They cover missing/invalid authentication, foreign/missing project denial, invalid prompt/settings/mode/provider, protected fields, idempotent duplicate results, quota/idempotency errors, status transitions/cancellation races, invalid artifact metadata and safe error responses. They do not claim live Supabase, Storage, Edge Function, worker or provider success.

Final local verification results are recorded after integration:

- Production build: passed (`tsc -b && vite build`; 110 modules transformed).
- ESLint: passed (`eslint .`).
- Focused backend tests: 19/19 passed.
- Test assertions: all 107 passed across resource-bounded runs. The 60 non-jsdom tests passed in one reused worker; `VideoPreview` passed 5/5 alone; the other UI batch passed 41/42 while `ProjectEditorPage` crossed the five-second timeout under shared load, then that file passed 6/6 alone.
- A monolithic run is not stable on the current host: one run reported four unrelated five-second UI timeouts and could not start two jsdom workers; a one-worker/reused-thread run passed all 60 non-jsdom tests but the grouped jsdom worker timed out during startup. The failures span auth, editor and media components, while the same files pass alone. Vitest also reported about 14.31 seconds of startup per isolated worker and estimated about 200 seconds of avoidable isolation overhead. This establishes process/jsdom startup and host resource contention as the cause; no timeout was raised and no assertion was weakened.
- `git diff --check`: passed. Git emitted only the repository's existing LF-to-CRLF normalization warnings for three tracked CSS files; it reported no whitespace error.
- SQL proposals: static review only; not executed.
- Real authenticated Supabase two-account isolation: pending.
- Hosted inference: not attempted in Phase 5F.

## 10. Files added or updated in Phase 5F

- `src/generation/contracts.ts`
- `src/generation/backend/errors.ts` and tests
- `src/generation/backend/validation.ts` and tests
- `src/generation/backend/transitions.ts` and tests
- `src/generation/backend/ports.ts`
- `src/generation/backend/intake.ts` and tests
- `src/generation/backend/index.ts`
- `docs/sql/phase_5f_database_metadata_json_read_only.sql`
- `docs/sql/phase_5f_generation_admin_storage_migration_review_only.sql`
- `docs/PHASE_5F_COMPLETION_REPORT.md`

## 11. Consolidated remaining request and approvals

The only information request now is: run the complete read-only [`phase_5f_database_metadata_json_read_only.sql`](sql/phase_5f_database_metadata_json_read_only.sql) once in the Supabase SQL Editor and return the single JSON result unchanged. Do not send credentials or project/user data.

After that result is reviewed, one deployment decision can bundle approval of the exact migration/RLS/Storage policy, bucket names and retention/quotas, Edge Function runtime and secret handling, worker identity/transport and provider/model/budget. Administrator activation remains a separate final grant because it changes a person's authority. Any LTX/other GPU inference request remains separately authorized.
