-- READ ONLY — DATABASE METADATA CHECK — DO NOT MODIFY OR EXECUTE AS A MIGRATION.
-- This query pack reads catalog metadata only. It does not read project, user, or media rows.
-- Run each SELECT separately in a trusted Supabase SQL session and preserve the complete
-- column names and result values for review. Do not paste access tokens or connection strings.

-- 1. Server and extensions used by the draft.
select current_database() as database_name, current_setting('server_version') as server_version;

select extname, extversion
from pg_extension
where extname in ('pgcrypto', 'uuid-ossp')
order by extname;

-- 2. Object existence and owners. Generation objects should not exist before migration.
select
  n.nspname as schema_name,
  c.relname as object_name,
  c.relkind as object_kind,
  pg_get_userbyid(c.relowner) as owner,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relname in ('projects', 'generation_jobs', 'generation_job_events', 'objects', 'buckets')
order by n.nspname, c.relname;

-- 3. Exact column types, defaults, nullability, identity, and generated expressions.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_schema,
  udt_name,
  is_nullable,
  column_default,
  is_identity,
  identity_generation,
  is_generated,
  generation_expression
from information_schema.columns
where table_schema = 'public'
  and table_name in ('projects', 'generation_jobs', 'generation_job_events')
order by table_name, ordinal_position;

-- 4. Primary, foreign, unique, and check constraints, including validation state.
select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type,
  con.convalidated as is_validated,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('projects', 'generation_jobs', 'generation_job_events')
order by c.relname, con.contype, con.conname;

-- 5. Index definitions, uniqueness, validity, and partial-index predicates.
select
  n.nspname as schema_name,
  c.relname as table_name,
  i.relname as index_name,
  ix.indisunique as is_unique,
  ix.indisprimary as is_primary,
  ix.indisvalid as is_valid,
  pg_get_indexdef(i.oid) as definition,
  pg_get_expr(ix.indpred, ix.indrelid) as predicate
from pg_index ix
join pg_class c on c.oid = ix.indrelid
join pg_class i on i.oid = ix.indexrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('projects', 'generation_jobs', 'generation_job_events')
order by c.relname, i.relname;

-- 6. Complete RLS policy definitions. Confirm all four existing projects policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('projects', 'generation_jobs', 'generation_job_events')
order by tablename, cmd, policyname;

-- 7. Explicit table and column grants for browser-facing roles.
select grantee, table_schema, table_name, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('projects', 'generation_jobs', 'generation_job_events')
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

select grantee, table_schema, table_name, column_name, privilege_type, is_grantable
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('projects', 'generation_jobs', 'generation_job_events')
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, grantee, column_name, privilege_type;

-- 8. Default privileges that could silently grant access to newly created tables/sequences.
select
  n.nspname as schema_name,
  r.rolname as owner_role,
  d.defaclobjtype as object_type,
  d.defaclacl as access_control_list
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
join pg_roles r on r.oid = d.defaclrole
where n.nspname = 'public' or d.defaclnamespace = 0
order by schema_name nulls first, owner_role, object_type;

-- 9. Triggers and trigger functions affecting ownership, timestamps, or deletion.
select
  event_object_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_condition,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('projects', 'generation_jobs', 'generation_job_events')
order by event_object_table, trigger_name, event_manipulation;

-- 10. Public functions that may set project ownership or expose privileged write paths.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  r.rolname as owner_role,
  p.proconfig as runtime_settings,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_roles r on r.oid = p.proowner
where n.nspname = 'public'
order by p.proname, arguments;

-- 11. Storage bucket configuration and object policies. This returns bucket metadata only.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;

-- 12. Realtime publication membership, if job status will use Supabase Realtime.
select pubname, schemaname, tablename
from pg_publication_tables
where schemaname = 'public'
  and tablename in ('projects', 'generation_jobs', 'generation_job_events')
order by pubname, tablename;
