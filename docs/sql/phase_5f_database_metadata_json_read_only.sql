-- PHASE 5F — CONSOLIDATED DATABASE METADATA SNAPSHOT (READ ONLY)
--
-- Run this entire file once in the Supabase SQL Editor and return the single JSON
-- value from the `vidio_phase_5f_metadata` column. This statement reads catalog
-- metadata and Storage bucket configuration only. It does not read auth users,
-- project rows, prompts, media objects, passwords, tokens, or credentials.
--
-- This is not a migration. It contains no INSERT, UPDATE, DELETE, DDL, RPC call,
-- or provider request. Preserve empty arrays in the result because absence is
-- relevant to the migration review.

with
target_relations(schema_name, relation_name) as (
  values
    ('public', 'projects'),
    ('public', 'generation_jobs'),
    ('public', 'generation_job_events'),
    ('public', 'generation_input_assets'),
    ('public', 'generation_artifacts'),
    ('vidio_private', 'generation_job_runtime'),
    ('vidio_private', 'generation_daily_usage'),
    ('vidio_private', 'generation_storage_usage'),
    ('vidio_private', 'generation_service_limits'),
    ('vidio_private', 'generation_model_allowlist'),
    ('vidio_private', 'generation_artifact_storage'),
    ('vidio_private', 'generation_input_asset_storage'),
    ('vidio_private', 'storage_deletion_queue'),
    ('vidio_private', 'platform_admin_roles'),
    ('vidio_private', 'admin_audit_log'),
    ('storage', 'buckets'),
    ('storage', 'objects')
),
schemas as (
  select
    n.nspname as schema_name,
    pg_get_userbyid(n.nspowner) as owner,
    n.nspacl::text as access_control_list
  from pg_namespace n
  where n.nspname in ('public', 'storage', 'auth', 'vidio_private')
),
extensions as (
  select e.extname as extension_name, e.extversion as version, n.nspname as schema_name
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname in ('pgcrypto', 'uuid-ossp', 'pg_cron', 'pg_net')
),
objects as (
  select
    tr.schema_name,
    tr.relation_name,
    c.relkind::text as relation_kind,
    pg_get_userbyid(c.relowner) as owner,
    c.relpersistence::text as persistence,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced,
    c.relreplident::text as replica_identity,
    c.relacl::text as access_control_list
  from target_relations tr
  left join pg_namespace n on n.nspname = tr.schema_name
  left join pg_class c on c.relnamespace = n.oid and c.relname = tr.relation_name
),
columns as (
  select
    c.table_schema,
    c.table_name,
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.udt_schema,
    c.udt_name,
    c.is_nullable,
    c.column_default,
    c.is_identity,
    c.identity_generation,
    c.is_generated,
    c.generation_expression
  from information_schema.columns c
  join target_relations tr
    on tr.schema_name = c.table_schema and tr.relation_name = c.table_name
),
auth_id_column as (
  select
    c.table_schema,
    c.table_name,
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.udt_schema,
    c.udt_name,
    c.is_nullable,
    c.column_default
  from information_schema.columns c
  where c.table_schema = 'auth' and c.table_name = 'users' and c.column_name = 'id'
),
constraints as (
  select
    n.nspname as schema_name,
    c.relname as table_name,
    con.conname as constraint_name,
    con.contype::text as constraint_type,
    con.condeferrable as is_deferrable,
    con.condeferred as initially_deferred,
    con.convalidated as is_validated,
    pg_get_constraintdef(con.oid, true) as definition
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  join target_relations tr on tr.schema_name = n.nspname and tr.relation_name = c.relname
),
indexes as (
  select
    n.nspname as schema_name,
    c.relname as table_name,
    i.relname as index_name,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary,
    ix.indisvalid as is_valid,
    ix.indisready as is_ready,
    pg_get_indexdef(i.oid) as definition,
    pg_get_expr(ix.indpred, ix.indrelid) as predicate
  from pg_index ix
  join pg_class c on c.oid = ix.indrelid
  join pg_class i on i.oid = ix.indexrelid
  join pg_namespace n on n.oid = c.relnamespace
  join target_relations tr on tr.schema_name = n.nspname and tr.relation_name = c.relname
),
policies as (
  select
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
  from pg_policies p
  where
    (p.schemaname = 'storage' and p.tablename in ('objects', 'buckets'))
    or exists (
      select 1
      from target_relations tr
      where tr.schema_name = p.schemaname and tr.relation_name = p.tablename
    )
),
table_grants as (
  select
    g.grantor,
    g.grantee,
    g.table_schema,
    g.table_name,
    g.privilege_type,
    g.is_grantable,
    g.with_hierarchy
  from information_schema.role_table_grants g
  join target_relations tr
    on tr.schema_name = g.table_schema and tr.relation_name = g.table_name
  where g.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
),
column_grants as (
  select
    g.grantor,
    g.grantee,
    g.table_schema,
    g.table_name,
    g.column_name,
    g.privilege_type,
    g.is_grantable
  from information_schema.column_privileges g
  join target_relations tr
    on tr.schema_name = g.table_schema and tr.relation_name = g.table_name
  where g.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
),
sequence_grants as (
  select
    g.grantor,
    g.grantee,
    g.object_schema,
    g.object_name,
    g.privilege_type,
    g.is_grantable
  from information_schema.role_usage_grants g
  where g.object_schema in ('public', 'vidio_private')
    and g.object_type = 'SEQUENCE'
    and g.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
),
default_privileges as (
  select
    coalesce(n.nspname, '<all schemas>') as schema_name,
    r.rolname as owner_role,
    d.defaclobjtype::text as object_type,
    d.defaclacl::text as access_control_list
  from pg_default_acl d
  left join pg_namespace n on n.oid = d.defaclnamespace
  join pg_roles r on r.oid = d.defaclrole
  where n.nspname in ('public', 'vidio_private') or d.defaclnamespace = 0
),
triggers as (
  select
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    t.tgenabled::text as enabled_mode,
    pn.nspname as function_schema,
    p.proname as function_name,
    pg_get_triggerdef(t.oid, true) as definition,
    pg_get_functiondef(p.oid) as function_definition
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace pn on pn.oid = p.pronamespace
  join target_relations tr on tr.schema_name = n.nspname and tr.relation_name = c.relname
  where not t.tgisinternal
),
relevant_functions as (
  select distinct
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_arguments,
    pg_get_function_result(p.oid) as result_type,
    pg_get_userbyid(p.proowner) as owner,
    p.prosecdef as security_definer,
    p.proleakproof as leakproof,
    p.provolatile::text as volatility,
    p.proparallel::text as parallel_safety,
    p.proconfig as runtime_settings,
    p.proacl::text as access_control_list,
    pg_get_functiondef(p.oid) as definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'vidio_private')
),
function_grants as (
  select
    g.grantor,
    g.grantee,
    g.specific_schema,
    g.routine_name,
    g.specific_name,
    g.privilege_type,
    g.is_grantable
  from information_schema.role_routine_grants g
  where g.specific_schema in ('public', 'vidio_private')
    and g.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role', 'postgres')
),
storage_buckets as (
  select
    b.id,
    b.name,
    b.public,
    b.file_size_limit,
    b.allowed_mime_types
  from storage.buckets b
),
publication_membership as (
  select p.pubname, p.schemaname, p.tablename
  from pg_publication_tables p
  where exists (
    select 1
    from target_relations tr
    where tr.schema_name = p.schemaname and tr.relation_name = p.tablename
  )
)
select jsonb_build_object(
  'snapshot', jsonb_build_object(
    'captured_at', statement_timestamp(),
    'database_name', current_database(),
    'database_role', current_user,
    'server_version', current_setting('server_version'),
    'postgrest_exposed_schemas_setting', current_setting('pgrst.db_schemas', true),
    'gen_random_uuid_available', to_regprocedure('gen_random_uuid()') is not null
  ),
  'schemas', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name) from schemas x), '[]'::jsonb),
  'extensions', coalesce((select jsonb_agg(to_jsonb(x) order by x.extension_name) from extensions x), '[]'::jsonb),
  'objects', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name, x.relation_name) from objects x), '[]'::jsonb),
  'columns', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_schema, x.table_name, x.ordinal_position) from columns x), '[]'::jsonb),
  'auth_users_id_column', coalesce((select jsonb_agg(to_jsonb(x) order by x.ordinal_position) from auth_id_column x), '[]'::jsonb),
  'constraints', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name, x.table_name, x.constraint_name) from constraints x), '[]'::jsonb),
  'indexes', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name, x.table_name, x.index_name) from indexes x), '[]'::jsonb),
  'policies', coalesce((select jsonb_agg(to_jsonb(x) order by x.schemaname, x.tablename, x.cmd, x.policyname) from policies x), '[]'::jsonb),
  'table_grants', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_schema, x.table_name, x.grantee, x.privilege_type) from table_grants x), '[]'::jsonb),
  'column_grants', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_schema, x.table_name, x.column_name, x.grantee, x.privilege_type) from column_grants x), '[]'::jsonb),
  'sequence_grants', coalesce((select jsonb_agg(to_jsonb(x) order by x.object_schema, x.object_name, x.grantee, x.privilege_type) from sequence_grants x), '[]'::jsonb),
  'default_privileges', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name, x.owner_role, x.object_type) from default_privileges x), '[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name, x.table_name, x.trigger_name) from triggers x), '[]'::jsonb),
  'relevant_functions', coalesce((select jsonb_agg(to_jsonb(x) order by x.schema_name, x.function_name, x.identity_arguments) from relevant_functions x), '[]'::jsonb),
  'function_grants', coalesce((select jsonb_agg(to_jsonb(x) order by x.specific_schema, x.routine_name, x.specific_name, x.grantee) from function_grants x), '[]'::jsonb),
  'storage_buckets', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from storage_buckets x), '[]'::jsonb),
  'publication_membership', coalesce((select jsonb_agg(to_jsonb(x) order by x.pubname, x.schemaname, x.tablename) from publication_membership x), '[]'::jsonb)
) as vidio_phase_5f_metadata;
