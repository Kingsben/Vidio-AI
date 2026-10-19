-- PHASE 5F — GENERATION, PRIVATE STORAGE, QUOTA, AND ADMIN FOUNDATION
-- PRODUCTION-ORIENTED PROPOSAL — REVIEW ONLY — DO NOT EXECUTE
--
-- This file is deliberately terminated with ROLLBACK. It is not approved migration
-- SQL. Review it against the JSON snapshot produced by
-- phase_5f_database_metadata_json_read_only.sql, confirm the Supabase project plan
-- supports the required runtime, and perform a staged/two-account security test before
-- creating a separately approved migration whose final ROLLBACK is changed to COMMIT.
--
-- Confirm before approval:
--   * no proposed relation, constraint, function, policy, schema, or bucket collides;
--   * the migration owner/default privileges are the expected Supabase values;
--   * public.projects retains its four verified owner policies and trigger behavior;
--   * vidio_private is not an exposed PostgREST schema;
--   * the service_role function boundary and worker authentication design are approved;
--   * retention, quota, file-size, provider, model, and admin provisioning values are approved.
--
-- No provider/model row and no administrator assignment is inserted. Consequently this
-- proposal cannot admit a generation request or grant administrator access by itself.

begin;

-- -----------------------------------------------------------------------------
-- Schemas and the existing-project ownership key
-- -----------------------------------------------------------------------------

create schema vidio_private;

revoke all on schema vidio_private from public, anon, authenticated;
grant usage on schema vidio_private to service_role;

-- `projects.id` is already globally unique. This redundant composite key lets every
-- generation foreign key prove project ownership inside PostgreSQL, rather than relying
-- on an application check plus a project-id-only foreign key.
alter table public.projects
  add constraint projects_id_user_id_key unique (id, user_id);

-- -----------------------------------------------------------------------------
-- User-visible generation records. Browser roles may read only their own rows and
-- cannot insert, update, delete, forge status, or provide trusted artifact locations.
-- -----------------------------------------------------------------------------

create table public.generation_input_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_count bigint not null check (byte_count between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  width integer not null check (width between 64 and 8192),
  height integer not null check (height between 64 and 8192),
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'validated', 'rejected', 'deleted')),
  safe_rejection_code text check (
    safe_rejection_code is null or safe_rejection_code ~ '^[A-Z0-9_]{1,64}$'
  ),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  expires_at timestamptz not null,
  unique (id, user_id),
  unique (id, user_id, project_id),
  foreign key (project_id, user_id)
    references public.projects(id, user_id) on delete cascade,
  check (expires_at > created_at),
  check (
    (validation_status = 'validated' and validated_at is not null and safe_rejection_code is null)
    or (validation_status = 'rejected' and safe_rejection_code is not null)
    or (validation_status in ('pending', 'deleted'))
  )
);

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  retry_of_job_id uuid,
  idempotency_key text not null check (
    char_length(idempotency_key) between 16 and 128
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  mode text not null check (mode in ('text-to-video', 'image-to-video')),
  input_asset_id uuid,
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  negative_prompt text check (negative_prompt is null or char_length(negative_prompt) <= 1000),
  model_key text not null check (model_key ~ '^[a-z0-9][a-z0-9._-]{0,95}$'),
  format text not null check (format in ('landscape', 'portrait', 'square')),
  width integer not null check (width between 256 and 2048 and width % 8 = 0),
  height integer not null check (height between 256 and 2048 and height % 8 = 0),
  duration_seconds numeric(7, 3) not null check (duration_seconds > 0 and duration_seconds <= 30),
  seed bigint check (seed is null or seed between 0 and 4294967295),
  settings jsonb not null default '{}'::jsonb check (
    jsonb_typeof(settings) = 'object'
    and not (settings ?| array[
      'userId', 'user_id', 'status', 'provider', 'providerJobId', 'provider_job_id',
      'artifact', 'artifactPath', 'objectKey', 'quota', 'cost', 'worker', 'leaseToken'
    ])
  ),
  status text not null default 'queued' check (
    status in ('queued', 'running', 'cancel_requested', 'succeeded', 'failed', 'cancelled', 'expired')
  ),
  attempt_count smallint not null default 0 check (attempt_count between 0 and 10),
  max_attempts smallint not null default 1 check (max_attempts between 1 and 3),
  quota_reserved_seconds integer not null check (quota_reserved_seconds between 1 and 7200),
  quota_day date not null,
  quota_reconciled_at timestamptz,
  cancel_requested_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  unique (id, user_id),
  foreign key (project_id, user_id)
    references public.projects(id, user_id) on delete cascade,
  foreign key (input_asset_id, user_id, project_id)
    references public.generation_input_assets(id, user_id, project_id) on delete restrict,
  foreign key (retry_of_job_id, user_id)
    references public.generation_jobs(id, user_id) on delete restrict,
  check (
    (mode = 'text-to-video' and input_asset_id is null)
    or (mode = 'image-to-video' and input_asset_id is not null)
  ),
  check (retry_of_job_id is null or retry_of_job_id <> id),
  check (started_at is null or started_at >= created_at),
  check (completed_at is null or completed_at >= created_at),
  check (
    (status in ('queued', 'running', 'cancel_requested') and completed_at is null)
    or (status in ('succeeded', 'failed', 'cancelled', 'expired') and completed_at is not null)
  ),
  check (status <> 'cancel_requested' or cancel_requested_at is not null)
);

create table public.generation_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type = 'video/mp4'),
  byte_count bigint not null check (byte_count between 1 and 26214400),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  duration_seconds numeric(8, 3) not null check (duration_seconds > 0 and duration_seconds <= 60),
  width integer not null check (width between 64 and 8192),
  height integer not null check (height between 64 and 8192),
  frame_rate numeric(8, 3) not null check (frame_rate > 0 and frame_rate <= 240),
  video_codec text not null check (char_length(video_codec) between 1 and 32),
  has_audio boolean not null,
  audio_codec text check (
    (has_audio and audio_codec is not null and char_length(audio_codec) between 1 and 32)
    or (not has_audio and audio_codec is null)
  ),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  deleted_at timestamptz,
  unique (job_id),
  unique (id, user_id),
  foreign key (job_id, user_id)
    references public.generation_jobs(id, user_id) on delete cascade,
  check (expires_at > created_at),
  check (deleted_at is null or deleted_at >= created_at)
);

create table public.generation_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (
    status in ('queued', 'running', 'cancel_requested', 'succeeded', 'failed', 'cancelled', 'expired')
  ),
  event_type text not null check (
    event_type in (
      'accepted', 'claimed', 'progress', 'cancel_requested', 'retry_scheduled',
      'succeeded', 'failed', 'cancelled', 'expired'
    )
  ),
  stage text check (stage is null or char_length(stage) between 1 and 96),
  completed_steps integer check (completed_steps is null or completed_steps >= 0),
  total_steps integer check (total_steps is null or total_steps > 0),
  safe_code text check (safe_code is null or safe_code ~ '^[A-Z0-9_]{1,64}$'),
  safe_message text check (safe_message is null or char_length(safe_message) <= 500),
  created_at timestamptz not null default now(),
  foreign key (job_id, user_id)
    references public.generation_jobs(id, user_id) on delete cascade,
  check (
    (completed_steps is null and total_steps is null)
    or (completed_steps is not null and total_steps is not null and completed_steps <= total_steps)
  )
);

-- -----------------------------------------------------------------------------
-- Backend-only generation state. Provider identifiers, object paths, worker leases,
-- internal failures, and administrative authority never appear in browser-readable rows.
-- -----------------------------------------------------------------------------

create table vidio_private.generation_service_limits (
  singleton boolean primary key default true check (singleton),
  max_jobs_per_user_per_day integer not null check (max_jobs_per_user_per_day between 1 and 100),
  max_reserved_seconds_per_user_per_day integer not null
    check (max_reserved_seconds_per_user_per_day between 1 and 86400),
  max_active_jobs_per_user integer not null check (max_active_jobs_per_user between 1 and 10),
  max_queued_jobs_per_user integer not null check (max_queued_jobs_per_user between 1 and 20),
  max_global_running_jobs integer not null check (max_global_running_jobs between 1 and 100),
  max_global_queued_jobs integer not null check (max_global_queued_jobs between 1 and 1000),
  max_storage_bytes_per_user bigint not null check (max_storage_bytes_per_user > 0),
  default_retention interval not null check (
    default_retention >= interval '1 day' and default_retention <= interval '90 days'
  ),
  updated_at timestamptz not null default now()
);

insert into vidio_private.generation_service_limits (
  singleton,
  max_jobs_per_user_per_day,
  max_reserved_seconds_per_user_per_day,
  max_active_jobs_per_user,
  max_queued_jobs_per_user,
  max_global_running_jobs,
  max_global_queued_jobs,
  max_storage_bytes_per_user,
  default_retention
) values (
  true,
  3,
  360,
  1,
  2,
  1,
  20,
  524288000,
  interval '7 days'
);

create table vidio_private.generation_model_allowlist (
  model_key text primary key check (model_key ~ '^[a-z0-9][a-z0-9._-]{0,95}$'),
  provider_key text not null check (provider_key ~ '^[a-z0-9][a-z0-9._-]{0,95}$'),
  provider_model_id text not null check (char_length(provider_model_id) between 1 and 200),
  enabled boolean not null default false,
  allowed_modes text[] not null check (
    cardinality(allowed_modes) between 1 and 2
    and allowed_modes <@ array['text-to-video', 'image-to-video']::text[]
  ),
  quota_seconds_per_job integer not null check (quota_seconds_per_job between 1 and 7200),
  max_attempts smallint not null default 1 check (max_attempts between 1 and 3),
  min_width integer not null check (min_width >= 64),
  max_width integer not null check (max_width >= min_width),
  min_height integer not null check (min_height >= 64),
  max_height integer not null check (max_height >= min_height),
  max_duration_seconds numeric(7, 3) not null check (max_duration_seconds > 0 and max_duration_seconds <= 60),
  settings_contract jsonb not null default '{}'::jsonb check (jsonb_typeof(settings_contract) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Intentionally no generation_model_allowlist INSERT. Provider authorization,
-- credentials, model licence, retention, pricing, and capacity must be approved first.

create table vidio_private.generation_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  jobs_reserved integer not null default 0 check (jobs_reserved >= 0),
  jobs_started integer not null default 0 check (jobs_started >= 0),
  jobs_succeeded integer not null default 0 check (jobs_succeeded >= 0),
  jobs_failed integer not null default 0 check (jobs_failed >= 0),
  jobs_cancelled integer not null default 0 check (jobs_cancelled >= 0),
  gpu_seconds_reserved integer not null default 0 check (gpu_seconds_reserved >= 0),
  gpu_seconds_consumed numeric(12, 3) not null default 0 check (gpu_seconds_consumed >= 0),
  artifact_bytes_published bigint not null default 0 check (artifact_bytes_published >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_day)
);

create table vidio_private.generation_storage_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stored_bytes bigint not null default 0 check (stored_bytes >= 0),
  updated_at timestamptz not null default now()
);

create table vidio_private.generation_job_runtime (
  job_id uuid primary key references public.generation_jobs(id) on delete cascade,
  provider_key text not null check (char_length(provider_key) between 1 and 96),
  provider_model_id text not null check (char_length(provider_model_id) between 1 and 200),
  provider_job_id text check (provider_job_id is null or char_length(provider_job_id) <= 300),
  lease_token uuid,
  lease_owner text check (lease_owner is null or char_length(lease_owner) between 1 and 128),
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  retry_not_before timestamptz,
  provider_submitted_at timestamptz,
  provider_completed_at timestamptz,
  actual_compute_seconds numeric(12, 3) check (actual_compute_seconds is null or actual_compute_seconds >= 0),
  internal_failure_code text check (
    internal_failure_code is null or internal_failure_code ~ '^[A-Z0-9_]{1,96}$'
  ),
  internal_failure_detail text check (
    internal_failure_detail is null or char_length(internal_failure_detail) <= 2000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (lease_token is null and lease_owner is null and lease_expires_at is null)
    or (lease_token is not null and lease_owner is not null and lease_expires_at is not null)
  )
);

create table vidio_private.generation_input_asset_storage (
  asset_id uuid primary key references public.generation_input_assets(id) on delete cascade,
  bucket_id text not null check (bucket_id = 'generation-inputs'),
  object_name text not null unique check (
    object_name !~ '(^|/)\.\.?(/|$)' and char_length(object_name) between 1 and 512
  ),
  storage_object_id uuid,
  created_at timestamptz not null default now()
);

create table vidio_private.generation_artifact_storage (
  artifact_id uuid primary key references public.generation_artifacts(id) on delete cascade,
  bucket_id text not null check (bucket_id = 'generation-outputs'),
  object_name text not null unique check (
    object_name !~ '(^|/)\.\.?(/|$)' and char_length(object_name) between 1 and 512
  ),
  storage_object_id uuid,
  verified_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table vidio_private.storage_deletion_queue (
  id bigint generated always as identity primary key,
  bucket_id text not null,
  object_name text not null,
  reason text not null check (reason in ('asset_deleted', 'artifact_deleted', 'expired', 'account_deleted')),
  queued_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  attempt_count smallint not null default 0 check (attempt_count between 0 and 20),
  last_error_code text check (last_error_code is null or last_error_code ~ '^[A-Z0-9_]{1,64}$'),
  unique (bucket_id, object_name),
  check (completed_at is null or claimed_at is not null)
);

-- Server-managed administrator authority. No row is inserted here. End users never
-- receive schema usage or table/function privileges for these objects.
create table vidio_private.platform_admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_operator', 'security_admin', 'support_limited')),
  provisioned_by uuid references auth.users(id) on delete restrict,
  provision_reason text not null check (char_length(provision_reason) between 10 and 500),
  provision_ticket text not null check (char_length(provision_ticket) between 3 and 128),
  requires_mfa boolean not null default true check (requires_mfa),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoke_reason text check (revoke_reason is null or char_length(revoke_reason) between 10 and 500),
  check (expires_at is null or expires_at > created_at),
  check (
    (revoked_at is null and revoked_by is null and revoke_reason is null)
    or (revoked_at is not null and revoked_by is not null and revoke_reason is not null)
  )
);

create unique index platform_admin_roles_one_active_per_user_idx
  on vidio_private.platform_admin_roles (user_id)
  where revoked_at is null;

create table vidio_private.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  actor_role text not null,
  action text not null check (action ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  target_type text not null check (target_type ~ '^[a-z][a-z0-9_.-]{1,63}$'),
  target_id text not null check (char_length(target_id) between 1 and 200),
  reason text not null check (char_length(reason) between 10 and 500),
  request_id uuid not null,
  context jsonb not null default '{}'::jsonb check (
    jsonb_typeof(context) = 'object'
    and not (context ?| array[
      'prompt', 'brief', 'token', 'authorization', 'signedUrl', 'signed_url',
      'objectPath', 'object_path', 'media', 'video', 'image'
    ])
  ),
  created_at timestamptz not null default now()
);

comment on table vidio_private.platform_admin_roles is
  'Server-managed role assignments. Never writable from user profile metadata or the browser.';
comment on table vidio_private.admin_audit_log is
  'Append-only operational audit metadata. Private prompts, briefs, media and signed URLs are prohibited.';

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

create index generation_input_assets_owner_created_idx
  on public.generation_input_assets (user_id, created_at desc);
create index generation_input_assets_expiry_idx
  on public.generation_input_assets (expires_at)
  where validation_status <> 'deleted';
create index generation_jobs_owner_created_idx
  on public.generation_jobs (user_id, created_at desc);
create index generation_jobs_project_created_idx
  on public.generation_jobs (project_id, created_at desc);
create index generation_jobs_queue_idx
  on public.generation_jobs (created_at, id)
  where status = 'queued';
create index generation_jobs_active_owner_idx
  on public.generation_jobs (user_id, status)
  where status in ('queued', 'running', 'cancel_requested');
create index generation_artifacts_owner_created_idx
  on public.generation_artifacts (user_id, created_at desc);
create index generation_artifacts_expiry_idx
  on public.generation_artifacts (expires_at)
  where deleted_at is null;
create index generation_job_events_job_time_idx
  on public.generation_job_events (job_id, created_at, id);
create index generation_job_runtime_claim_idx
  on vidio_private.generation_job_runtime (retry_not_before, job_id);
create index generation_job_runtime_lease_idx
  on vidio_private.generation_job_runtime (lease_expires_at)
  where lease_token is not null;
create index storage_deletion_queue_pending_idx
  on vidio_private.storage_deletion_queue (queued_at, id)
  where completed_at is null;
create index admin_audit_log_time_idx
  on vidio_private.admin_audit_log (created_at desc, id desc);
create index admin_audit_log_target_idx
  on vidio_private.admin_audit_log (target_type, target_id, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS and least-privilege browser reads
-- -----------------------------------------------------------------------------

alter table public.generation_input_assets enable row level security;
alter table public.generation_input_assets force row level security;
alter table public.generation_jobs enable row level security;
alter table public.generation_jobs force row level security;
alter table public.generation_artifacts enable row level security;
alter table public.generation_artifacts force row level security;
alter table public.generation_job_events enable row level security;
alter table public.generation_job_events force row level security;

revoke all on public.generation_input_assets from public, anon, authenticated, service_role;
revoke all on public.generation_jobs from public, anon, authenticated, service_role;
revoke all on public.generation_artifacts from public, anon, authenticated, service_role;
revoke all on public.generation_job_events from public, anon, authenticated, service_role;

grant select (
  id, project_id, media_type, byte_count, sha256, width, height,
  validation_status, safe_rejection_code, created_at, validated_at, expires_at
) on public.generation_input_assets to authenticated;

grant select (
  id, project_id, retry_of_job_id, mode, input_asset_id, prompt, negative_prompt,
  model_key, format, width, height, duration_seconds, seed, settings, status,
  attempt_count, max_attempts, cancel_requested_at, started_at, completed_at,
  created_at, updated_at
) on public.generation_jobs to authenticated;

grant select (
  id, job_id, media_type, byte_count, sha256, duration_seconds, width, height,
  frame_rate, video_codec, has_audio, audio_codec, created_at, expires_at, deleted_at
) on public.generation_artifacts to authenticated;

grant select (
  id, job_id, status, event_type, stage, completed_steps, total_steps,
  safe_code, safe_message, created_at
) on public.generation_job_events to authenticated;

create policy generation_input_assets_select_own
  on public.generation_input_assets for select to authenticated
  using (user_id = (select auth.uid()));

create policy generation_jobs_select_own
  on public.generation_jobs for select to authenticated
  using (user_id = (select auth.uid()));

create policy generation_artifacts_select_own
  on public.generation_artifacts for select to authenticated
  using (user_id = (select auth.uid()));

create policy generation_job_events_select_own
  on public.generation_job_events for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on all tables in schema vidio_private from public, anon, authenticated, service_role;
revoke all on all sequences in schema vidio_private from public, anon, authenticated, service_role;

-- Prevent future objects from inheriting an accidental browser-facing grant. Replace
-- `postgres` only if the metadata snapshot proves a different migration owner.
alter default privileges for role postgres in schema vidio_private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema vidio_private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema vidio_private
  revoke execute on functions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Private Storage. Uploads, object paths, signed URLs and deletion are server-only.
-- Do not deploy if the metadata snapshot reveals a permissive bucket-agnostic policy
-- on storage.objects; permissive RLS policies combine with OR and cannot be narrowed
-- by adding another policy.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('generation-inputs', 'generation-inputs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('generation-outputs', 'generation-outputs', false, 26214400, array['video/mp4']);

-- Deliberately no authenticated/anon storage.objects policies. The trusted backend
-- uploads validated files under opaque server-generated names and, after a fresh owner
-- check, returns a short-lived signed URL. A database row never confers object access.

-- -----------------------------------------------------------------------------
-- Invariants and cleanup bookkeeping
-- -----------------------------------------------------------------------------

create function vidio_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create trigger generation_jobs_touch_updated_at
before update on public.generation_jobs
for each row execute function vidio_private.touch_updated_at();

create trigger generation_job_runtime_touch_updated_at
before update on vidio_private.generation_job_runtime
for each row execute function vidio_private.touch_updated_at();

create trigger generation_daily_usage_touch_updated_at
before update on vidio_private.generation_daily_usage
for each row execute function vidio_private.touch_updated_at();

create trigger generation_storage_usage_touch_updated_at
before update on vidio_private.generation_storage_usage
for each row execute function vidio_private.touch_updated_at();

create trigger generation_service_limits_touch_updated_at
before update on vidio_private.generation_service_limits
for each row execute function vidio_private.touch_updated_at();

create trigger generation_model_allowlist_touch_updated_at
before update on vidio_private.generation_model_allowlist
for each row execute function vidio_private.touch_updated_at();

create function vidio_private.enforce_generation_job_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if row(
    new.id, new.user_id, new.project_id, new.retry_of_job_id, new.idempotency_key,
    new.request_fingerprint, new.mode, new.input_asset_id, new.prompt,
    new.negative_prompt, new.model_key, new.format, new.width, new.height,
    new.duration_seconds, new.seed, new.settings, new.max_attempts,
    new.quota_reserved_seconds, new.quota_day, new.created_at
  ) is distinct from row(
    old.id, old.user_id, old.project_id, old.retry_of_job_id, old.idempotency_key,
    old.request_fingerprint, old.mode, old.input_asset_id, old.prompt,
    old.negative_prompt, old.model_key, old.format, old.width, old.height,
    old.duration_seconds, old.seed, old.settings, old.max_attempts,
    old.quota_reserved_seconds, old.quota_day, old.created_at
  ) then
    raise exception using errcode = '23514', message = 'VIDIO_IMMUTABLE_JOB_FIELDS';
  end if;

  if new.status <> old.status and not (
    (old.status = 'queued' and new.status in ('running', 'cancelled', 'failed'))
    or (old.status = 'running' and new.status in ('cancel_requested', 'succeeded', 'failed'))
    or (old.status = 'cancel_requested' and new.status in ('succeeded', 'failed', 'cancelled'))
    or (old.status = 'succeeded' and new.status = 'expired')
  ) then
    raise exception using errcode = '23514', message = 'VIDIO_INVALID_JOB_TRANSITION';
  end if;

  if new.attempt_count < old.attempt_count or new.attempt_count > new.max_attempts then
    raise exception using errcode = '23514', message = 'VIDIO_INVALID_ATTEMPT_COUNT';
  end if;

  return new;
end;
$$;

create trigger generation_jobs_enforce_update
before update on public.generation_jobs
for each row execute function vidio_private.enforce_generation_job_update();

create function vidio_private.prevent_event_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception using errcode = '55000', message = 'VIDIO_APPEND_ONLY_RECORD';
end;
$$;

create trigger generation_job_events_no_update
before update on public.generation_job_events
for each row execute function vidio_private.prevent_event_update();

create trigger admin_audit_log_no_update
before update or delete on vidio_private.admin_audit_log
for each row execute function vidio_private.prevent_event_update();

create function vidio_private.queue_storage_deletion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, vidio_private
as $$
begin
  insert into vidio_private.storage_deletion_queue (bucket_id, object_name, reason)
  values (
    old.bucket_id,
    old.object_name,
    case tg_table_name
      when 'generation_input_asset_storage' then 'asset_deleted'
      else 'artifact_deleted'
    end
  )
  on conflict (bucket_id, object_name) do nothing;
  return old;
end;
$$;

create trigger generation_input_asset_storage_queue_delete
before delete on vidio_private.generation_input_asset_storage
for each row execute function vidio_private.queue_storage_deletion();

create trigger generation_artifact_storage_queue_delete
before delete on vidio_private.generation_artifact_storage
for each row execute function vidio_private.queue_storage_deletion();

-- -----------------------------------------------------------------------------
-- Atomic intake, cancellation, and live administrator-role checks
-- -----------------------------------------------------------------------------

create function vidio_private.request_generation_job(
  p_user_id uuid,
  p_project_id uuid,
  p_idempotency_key text,
  p_mode text,
  p_input_asset_id uuid,
  p_prompt text,
  p_negative_prompt text,
  p_model_key text,
  p_format text,
  p_width integer,
  p_height integer,
  p_duration_seconds numeric,
  p_seed bigint,
  p_settings jsonb,
  p_retry_of_job_id uuid
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = pg_catalog, public, vidio_private, extensions
as $$
declare
  v_existing public.generation_jobs%rowtype;
  v_job public.generation_jobs%rowtype;
  v_limits vidio_private.generation_service_limits%rowtype;
  v_model vidio_private.generation_model_allowlist%rowtype;
  v_usage vidio_private.generation_daily_usage%rowtype;
  v_usage_day date := (statement_timestamp() at time zone 'UTC')::date;
  v_fingerprint text;
  v_count integer;
begin
  if p_user_id is null then
    raise exception using errcode = '22023', message = 'VIDIO_AUTH_REQUIRED';
  end if;

  if p_idempotency_key is null
     or char_length(p_idempotency_key) not between 16 and 128
     or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception using errcode = '22023', message = 'VIDIO_INVALID_IDEMPOTENCY_KEY';
  end if;

  if jsonb_typeof(coalesce(p_settings, '{}'::jsonb)) <> 'object'
     or coalesce(p_settings, '{}'::jsonb) ?| array[
       'userId', 'user_id', 'status', 'provider', 'providerJobId', 'provider_job_id',
       'artifact', 'artifactPath', 'objectKey', 'quota', 'cost', 'worker', 'leaseToken'
     ] then
    raise exception using errcode = '22023', message = 'VIDIO_INVALID_SETTINGS';
  end if;

  v_fingerprint := encode(digest(convert_to(
    jsonb_build_object(
      'projectId', p_project_id,
      'mode', p_mode,
      'inputAssetId', p_input_asset_id,
      'prompt', p_prompt,
      'negativePrompt', nullif(p_negative_prompt, ''),
      'modelKey', p_model_key,
      'format', p_format,
      'width', p_width,
      'height', p_height,
      'durationSeconds', p_duration_seconds,
      'seed', p_seed,
      'settings', coalesce(p_settings, '{}'::jsonb),
      'retryOfJobId', p_retry_of_job_id
    )::text,
    'UTF8'
  ), 'sha256'), 'hex');

  select * into v_existing
  from public.generation_jobs
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception using errcode = '23505', message = 'VIDIO_IDEMPOTENCY_CONFLICT';
    end if;
    return v_existing;
  end if;

  -- Serialize intake so user and global caps cannot be oversubscribed by concurrent calls.
  select * into strict v_limits
  from vidio_private.generation_service_limits
  where singleton
  for update;

  -- The first lookup is the fast path. Recheck after acquiring the admission lock so
  -- two concurrent requests with the same key return one job instead of surfacing the
  -- unique-index error to the second caller.
  select * into v_existing
  from public.generation_jobs
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception using errcode = '23505', message = 'VIDIO_IDEMPOTENCY_CONFLICT';
    end if;
    return v_existing;
  end if;

  select * into strict v_model
  from vidio_private.generation_model_allowlist
  where model_key = p_model_key and enabled
  for share;

  if not (p_mode = any(v_model.allowed_modes))
     or p_width not between v_model.min_width and v_model.max_width
     or p_height not between v_model.min_height and v_model.max_height
     or p_duration_seconds <= 0
     or p_duration_seconds > v_model.max_duration_seconds then
    raise exception using errcode = '22023', message = 'VIDIO_UNSUPPORTED_GENERATION_SETTINGS';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and user_id = p_user_id
  ) then
    raise exception using errcode = '42501', message = 'VIDIO_PROJECT_NOT_OWNED';
  end if;

  if (p_mode = 'text-to-video' and p_input_asset_id is not null)
     or (p_mode = 'image-to-video' and not exists (
       select 1 from public.generation_input_assets
       where id = p_input_asset_id
         and user_id = p_user_id
         and project_id = p_project_id
         and validation_status = 'validated'
         and expires_at > statement_timestamp()
     )) then
    raise exception using errcode = '42501', message = 'VIDIO_INPUT_ASSET_NOT_USABLE';
  end if;

  if p_retry_of_job_id is not null and not exists (
    select 1 from public.generation_jobs
    where id = p_retry_of_job_id
      and user_id = p_user_id
      and status in ('failed', 'cancelled')
  ) then
    raise exception using errcode = '42501', message = 'VIDIO_RETRY_NOT_ALLOWED';
  end if;

  insert into vidio_private.generation_daily_usage (user_id, usage_day)
  values (p_user_id, v_usage_day)
  on conflict (user_id, usage_day) do nothing;

  select * into strict v_usage
  from vidio_private.generation_daily_usage
  where user_id = p_user_id and usage_day = v_usage_day
  for update;

  if v_usage.jobs_reserved >= v_limits.max_jobs_per_user_per_day
     or v_usage.gpu_seconds_reserved + v_model.quota_seconds_per_job
        > v_limits.max_reserved_seconds_per_user_per_day then
    raise exception using errcode = 'P0001', message = 'VIDIO_DAILY_QUOTA_EXHAUSTED';
  end if;

  select count(*) into v_count
  from public.generation_jobs
  where user_id = p_user_id and status = 'queued';
  if v_count >= v_limits.max_queued_jobs_per_user then
    raise exception using errcode = 'P0001', message = 'VIDIO_USER_QUEUE_FULL';
  end if;

  select count(*) into v_count
  from public.generation_jobs
  where status = 'queued';
  if v_count >= v_limits.max_global_queued_jobs then
    raise exception using errcode = 'P0001', message = 'VIDIO_GLOBAL_QUEUE_FULL';
  end if;

  insert into public.generation_jobs (
    user_id, project_id, retry_of_job_id, idempotency_key, request_fingerprint,
    mode, input_asset_id, prompt, negative_prompt, model_key, format, width, height,
    duration_seconds, seed, settings, max_attempts, quota_reserved_seconds, quota_day
  ) values (
    p_user_id, p_project_id, p_retry_of_job_id, p_idempotency_key, v_fingerprint,
    p_mode, p_input_asset_id, btrim(p_prompt), nullif(p_negative_prompt, ''),
    p_model_key, p_format, p_width, p_height, p_duration_seconds, p_seed,
    coalesce(p_settings, '{}'::jsonb), v_model.max_attempts,
    v_model.quota_seconds_per_job, v_usage_day
  ) returning * into v_job;

  insert into vidio_private.generation_job_runtime (
    job_id, provider_key, provider_model_id
  ) values (
    v_job.id, v_model.provider_key, v_model.provider_model_id
  );

  update vidio_private.generation_daily_usage
  set jobs_reserved = jobs_reserved + 1,
      gpu_seconds_reserved = gpu_seconds_reserved + v_model.quota_seconds_per_job
  where user_id = p_user_id and usage_day = v_usage_day;

  insert into public.generation_job_events (
    job_id, user_id, status, event_type, safe_code, safe_message
  ) values (
    v_job.id, p_user_id, 'queued', 'accepted', 'JOB_ACCEPTED', 'Generation request accepted.'
  );

  return v_job;
exception
  when no_data_found then
    raise exception using errcode = 'P0001', message = 'VIDIO_GENERATION_NOT_AVAILABLE';
end;
$$;

create function vidio_private.request_generation_cancellation(
  p_user_id uuid,
  p_job_id uuid
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = pg_catalog, public, vidio_private
as $$
declare
  v_job public.generation_jobs%rowtype;
begin
  select * into strict v_job
  from public.generation_jobs
  where id = p_job_id and user_id = p_user_id
  for update;

  if v_job.status = 'queued' then
    update public.generation_jobs
    set status = 'cancelled',
        cancel_requested_at = statement_timestamp(),
        completed_at = statement_timestamp(),
        quota_reconciled_at = statement_timestamp()
    where id = p_job_id
    returning * into v_job;

    update vidio_private.generation_daily_usage
    set jobs_cancelled = jobs_cancelled + 1,
        gpu_seconds_reserved = greatest(0, gpu_seconds_reserved - v_job.quota_reserved_seconds)
    where user_id = v_job.user_id and usage_day = v_job.quota_day;

    insert into public.generation_job_events (
      job_id, user_id, status, event_type, safe_code, safe_message
    ) values (
      v_job.id, v_job.user_id, 'cancelled', 'cancelled', 'JOB_CANCELLED',
      'Generation cancelled before processing.'
    );
  elsif v_job.status = 'running' then
    update public.generation_jobs
    set status = 'cancel_requested', cancel_requested_at = statement_timestamp()
    where id = p_job_id
    returning * into v_job;

    insert into public.generation_job_events (
      job_id, user_id, status, event_type, safe_code, safe_message
    ) values (
      v_job.id, v_job.user_id, 'cancel_requested', 'cancel_requested',
      'CANCEL_REQUESTED', 'Cancellation requested.'
    );
  elsif v_job.status not in ('cancel_requested', 'cancelled') then
    raise exception using errcode = '55000', message = 'VIDIO_JOB_NOT_CANCELLABLE';
  end if;

  return v_job;
exception
  when no_data_found then
    raise exception using errcode = '42501', message = 'VIDIO_JOB_NOT_OWNED';
end;
$$;

create function vidio_private.has_active_admin_role(
  p_user_id uuid,
  p_allowed_roles text[],
  p_mfa_verified boolean
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, vidio_private
as $$
  select coalesce(p_mfa_verified, false) and exists (
    select 1
    from vidio_private.platform_admin_roles r
    where r.user_id = p_user_id
      and r.role = any(p_allowed_roles)
      and r.revoked_at is null
      and (r.expires_at is null or r.expires_at > statement_timestamp())
  );
$$;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Revoke broadly,
-- then expose only the narrow API operations to the trusted Supabase service role.
revoke all on all functions in schema vidio_private from public, anon, authenticated;
grant execute on function vidio_private.request_generation_job(
  uuid, uuid, text, text, uuid, text, text, text, text, integer, integer,
  numeric, bigint, jsonb, uuid
) to service_role;
grant execute on function vidio_private.request_generation_cancellation(uuid, uuid)
  to service_role;
grant execute on function vidio_private.has_active_admin_role(uuid, text[], boolean)
  to service_role;

-- Worker operations remain intentionally closed until the worker identity and transport
-- are approved. The production migration must add similarly narrow, lease-token-checked
-- functions for claim, heartbeat/progress, retry/failure, cancellation acknowledgement,
-- artifact publication, quota reconciliation, expiry and deletion completion. Do not
-- compensate by granting a worker or browser direct UPDATE/INSERT on these tables.

-- Required storage publication invariant (enforced by the future finalize function):
-- upload to a private temporary object; decode and verify the complete MP4; verify MIME,
-- byte count, SHA-256, dimensions, duration, video/audio tracks and policy result; move to
-- an opaque final object name; atomically insert both artifact rows, mark succeeded, emit
-- the safe event, and reconcile reserved/actual quota. On any failure, queue object cleanup.

-- Rollback implications for the eventual approved migration:
-- drain/disable intake first; cancel or finish active leases; delete bucket objects through
-- the Storage API; confirm the deletion queue is empty; export required audit records;
-- then drop functions/policies/tables and the composite projects key in dependency order.
-- Dropping database rows alone does not delete Storage objects.

-- Safety terminator. This proposal persists nothing even if pasted accidentally.
rollback;
