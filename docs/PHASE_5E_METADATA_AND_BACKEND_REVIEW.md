# Phase 5E — database metadata and backend boundary review

**Review date: 19 October 2026.** This phase is local and review-only. No Supabase connection, SQL execution, migration, policy change, external inference request, administrator action, commit, or push occurred.

## Generation SQL review

The prior live audit established two facts: `public.projects.id` and `public.projects.user_id` are UUID columns, and four owner-scoped RLS policies exist on `public.projects`. The review-only generation draft now uses `uuid` for `generation_jobs.project_id`; its prior `text` type was inconsistent with the confirmed project identifier type. It also explicitly revokes table privileges from `PUBLIC` as well as `anon` and `authenticated` before granting owner-readable `select` access.

The draft has sound foundations: server-derived UUID ownership, per-owner idempotency, bounded values, explicit job states, a composite job/owner key that prevents cross-owner events, owner-only read policies, and no authenticated browser writes. It remains intentionally unapproved because these material gaps are unresolved:

- `project_id` has no foreign key. Add one only after confirming the exact `projects` primary/unique constraint and choosing an intentional `ON DELETE` action. A trusted API must still verify that the authenticated owner owns the project; a foreign key alone proves existence, not ownership.
- `quota_reserved_seconds` records a value but cannot atomically enforce daily, concurrent, or aggregate quotas. A quota ledger/counter and transaction boundary are required.
- The writer boundary is unspecified. A browser must not receive `service_role`; the intake API and worker need narrowly defined server-side database operations, with exact grants and function ownership reviewed.
- `updated_at` has only an insert default. Either every trusted transition must update it atomically or a reviewed trigger must maintain it.
- Events are described as append-only but the draft does not enforce append-only behavior for the future writer. Restrict the writer to an insert function or explicitly deny event update/delete.
- Cancellation/recovery needs a server-only provider reference, request/started/finished timestamps, lease owner/heartbeat semantics, and an exact transition matrix. Do not return provider identifiers to clients.
- Image-to-video input ownership and lifecycle are absent. Keep the first backend text-only, or add an owner-checked private input-asset relation after its schema is approved.
- Private output storage, retention deletion, signed-download authorization, object-size accounting, and storage RLS are deliberately absent.
- Terminal-state consistency is not constrained: success should require validated artifact metadata; failure should require a safe failure code; expired/cancelled jobs should not retain a downloadable artifact unintentionally.

The SQL remains a design draft, not an executable migration.

## Exact deployed-metadata comparison checklist

Use [`phase_5e_database_metadata_read_only.sql`](sql/phase_5e_database_metadata_read_only.sql) to collect catalog metadata only. Preserve complete results, including empty result sets. Compare them with the draft as follows:

| Area | Deployed facts to capture | Draft decision that depends on it |
| --- | --- | --- |
| Server/extensions | PostgreSQL version; `pgcrypto` and `uuid-ossp` availability | Confirm `gen_random_uuid()` source and supported DDL |
| Object collisions | Existence, kind, owner and RLS flags for both proposed generation tables | Ensure migration names are unused and owned by the intended migration role |
| `projects` identifiers | Exact UUID type, nullability, defaults, PK/unique constraints for `id`; nullability/default for `user_id` | Add a type-correct project FK and validate server-derived ownership |
| Project ownership FK | Exact FK from `projects.user_id`, referenced key and `ON UPDATE`/`ON DELETE` actions | Choose consistent account-deletion behavior for jobs/events/artifacts |
| Project insert ownership | `user_id` default, trigger or RPC behavior because the current client insert omits `user_id` | Avoid copying an assumption that weakens generation ownership |
| Other project columns | Types, defaults, checks, generated values and length limits | Keep project validation and generation references compatible |
| Project indexes | Full definitions, validity, uniqueness and predicates | Confirm owner/project lookup is indexed and avoid duplicates |
| Project RLS | `relrowsecurity`, `relforcerowsecurity`; all four policy names, roles, commands, permissive mode, `USING`, `WITH CHECK` | Compare exact owner rules, including insert/update checks, rather than relying on policy count |
| Grants | Table and column grants for `PUBLIC`, `anon`, `authenticated`, `service_role` | Ensure RLS is paired with least-privilege grants and no inherited public write path |
| Default privileges | Table and sequence ACL defaults for the migration owner/schema | Prevent new generation tables or identity sequences from receiving unintended access |
| Triggers/functions | Trigger definitions; relevant public function names, owners, `SECURITY DEFINER`, configuration and result types | Identify implicit ownership/timestamp logic and privileged RPC paths; separately inspect approved function bodies if relevant |
| Storage | Existing bucket names, public flag, file-size/MIME limits, and all `storage.objects` policies | Choose a non-colliding private bucket and owner-authorized object-key policy |
| Realtime | Publication membership for project/generation tables | Decide whether status uses authenticated polling/SSE or reviewed Realtime publication |

Approval also requires a two-account behavioral test: account A cannot select, update, delete, cancel, retry, or download account B's project/job/output; each account can perform its own allowed operations; anonymous access is denied. Catalog metadata describes policy text but does not prove isolation behavior.

## Parallel test investigation

The Phase 5D failing run launched build, lint, the default Vitest suite, and `git diff --check` concurrently. Vitest isolated 13 test files in 13 workers; that run reported roughly 9.57 seconds of startup per worker. Three unrelated asynchronous UI tests failed while the machine was also compiling/bundling/linting. Their operations pass in the serial full run. The fourth failure, in the Studio suite, was a real stale text assertion after the LTX copy changed and was corrected.

For this review, the unchanged default command `npm.cmd test` was run alone with normal file parallelism. All **13 files and 88 tests passed** in 26.83 seconds; Vitest again spawned 13 isolated workers and reported about 8.54 seconds of startup per worker. The earlier serial run also passed all 88 tests. There are no repository overrides for Vitest test timeout, Testing Library async timeout, worker count, or file parallelism.

The evidence does not reproduce an application or test isolation race. It supports resource contention from running three Node toolchains at once on Windows, amplified by short Testing Library async waits. Keep normal parallel Vitest behavior, but run build, lint and tests as sequential validation stages locally and in CI. If a constrained runner later reproduces failures when tests run alone, cap Vitest workers for that runner and capture the failing test's timing; do not increase timeouts pre-emptively because that can hide real hangs.

## Smallest secure backend component

The first backend component should be one authenticated **generation job intake service**, implemented in a trusted server runtime such as a Supabase Edge Function or a small same-origin API. It is a narrow command boundary, not a general provider proxy.

For `POST /generation-jobs`, it must:

1. Accept a Supabase bearer token plus the existing provider-independent request contract and an idempotency key. It must reject client fields for owner ID, provider credentials, provider job ID, status, artifact key, or quota values.
2. Validate the token server-side against Supabase Auth and derive `user_id` from the verified subject. Never trust decoded browser claims without server verification.
3. Validate the allowlisted text-to-video mode, project UUID, prompt and exact pilot settings; then prove that the project belongs to that user.
4. In one database transaction, enforce per-user/global queue and daily quota limits, reserve quota, create the queued job and initial event, and return the existing job for a repeated idempotency key.
5. Return only an opaque Vidio job ID and its real persisted status. It must not call a public Hugging Face demo from the browser or report simulated progress.

That intake endpoint is the smallest safe component to implement first, but it cannot produce a video alone. A genuine end-to-end submission additionally requires an approved job schema/quota transaction, a durable queue claim mechanism, and a separate worker/provider adapter holding server-side credentials. The worker must submit the allowlisted model/settings, persist real provider state, validate the returned media, write it to private storage and finalize quota/status. A status/download endpoint must recheck ownership and mint only short-lived access to the owner's artifact.

The next implementation gate is the complete current metadata result plus approval of a concrete migration, RLS/storage design, backend runtime and secret strategy. Provider choice, paid access, deployment and external inference remain separately authorized actions.

## Verification

- Default parallel test run: 13 files passed, 88 tests passed.
- SQL and metadata query pack: inspected only; neither was executed.
- `git diff --check`: run after the documentation changes in this phase.
- No application code or test configuration changed.
