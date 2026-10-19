-- REVIEW ONLY — DO NOT EXECUTE.
-- Prepared for the Phase 5B schema/security review. No Supabase changes have been made.
-- Confirm the deployed projects table, grants/default privileges, Supabase role behavior,
-- quotas, retention and private Storage design before adapting this into a migration.
-- A previous live audit established that public.projects.id and user_id are UUIDs.
-- A current metadata snapshot is still required before adding the project foreign key or
-- approving this draft. The trusted API must verify project ownership before creating a job.

begin;

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  idempotency_key text not null check (length(idempotency_key) between 16 and 128),
  mode text not null check (mode in ('text-to-video', 'image-to-video')),
  prompt text not null check (length(prompt) between 1 and 1000),
  model_key text not null check (length(model_key) between 1 and 96),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'cancel_requested', 'succeeded', 'failed', 'cancelled', 'expired')),
  attempt_count smallint not null default 0 check (attempt_count between 0 and 3),
  quota_reserved_seconds integer not null default 0 check (quota_reserved_seconds between 0 and 1200),
  worker_lease_expires_at timestamptz,
  artifact_object_key text,
  artifact_bytes bigint check (artifact_bytes is null or artifact_bytes between 1 and 26214400),
  artifact_sha256 text check (artifact_sha256 is null or artifact_sha256 ~ '^[0-9a-f]{64}$'),
  artifact_duration_seconds numeric(8, 3) check (artifact_duration_seconds is null or artifact_duration_seconds > 0),
  artifact_width integer check (artifact_width is null or artifact_width > 0),
  artifact_height integer check (artifact_height is null or artifact_height > 0),
  artifact_has_audio boolean,
  failure_code text check (failure_code is null or length(failure_code) <= 96),
  failure_message text check (failure_message is null or length(failure_message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, idempotency_key),
  unique (id, user_id)
);

create index generation_jobs_owner_created_idx
  on public.generation_jobs (user_id, created_at desc);
create index generation_jobs_queue_idx
  on public.generation_jobs (created_at)
  where status = 'queued';
create index generation_jobs_lease_idx
  on public.generation_jobs (worker_lease_expires_at)
  where status in ('running', 'cancel_requested');

create table public.generation_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null
    check (status in ('queued', 'running', 'cancel_requested', 'succeeded', 'failed', 'cancelled', 'expired')),
  stage text check (stage is null or length(stage) <= 96),
  safe_message text check (safe_message is null or length(safe_message) <= 500),
  created_at timestamptz not null default now(),
  foreign key (job_id, user_id)
    references public.generation_jobs(id, user_id) on delete cascade
);

create index generation_job_events_owner_time_idx
  on public.generation_job_events (user_id, job_id, created_at);

alter table public.generation_jobs enable row level security;
alter table public.generation_job_events enable row level security;

revoke all on public.generation_jobs from public, anon, authenticated;
revoke all on public.generation_job_events from public, anon, authenticated;
grant select on public.generation_jobs to authenticated;
grant select on public.generation_job_events to authenticated;

create policy generation_jobs_select_own
  on public.generation_jobs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy generation_job_events_select_own
  on public.generation_job_events
  for select to authenticated
  using (user_id = (select auth.uid()));

-- No authenticated-client INSERT/UPDATE/DELETE policy is defined. A separately reviewed
-- API/transaction RPC and worker database role must own writes, quotas, event ordering,
-- lease transitions, cancellation, retention, and output cleanup. Never expose service_role.
-- A corresponding private Storage bucket and object policies are intentionally omitted.
-- Before approval, add a project_id foreign key using the verified projects constraint and
-- an explicitly reviewed ON DELETE action. Also define an atomic quota ledger/reservation
-- mechanism; quota_reserved_seconds on a job cannot enforce per-user limits by itself.

commit;
