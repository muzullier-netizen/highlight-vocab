-- Scoped to this vocabulary app. Apply after inspecting the selected project's existing schema.
begin;
create schema if not exists vocab_internal;
revoke all on schema vocab_internal from public,anon;
create table if not exists public.vocab_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  payload jsonb not null default '{"version":1,"decks":{},"clips":{}}',
  updated_at timestamptz not null default now()
);
create table if not exists vocab_internal.vocab_sync_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload_hash text not null,
  applied_revision bigint not null,
  created_at timestamptz not null default now(),
  primary key(user_id,request_id)
);
alter table public.vocab_sync_state enable row level security;
alter table vocab_internal.vocab_sync_receipts enable row level security;
revoke all on public.vocab_sync_state,vocab_internal.vocab_sync_receipts from public,anon,authenticated;
grant select on public.vocab_sync_state to authenticated;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='vocab_internal' and tablename='vocab_sync_receipts' and policyname='vocab_receipts_no_direct_access') then
    create policy vocab_receipts_no_direct_access on vocab_internal.vocab_sync_receipts for all to authenticated using(false) with check(false);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='vocab_sync_state' and policyname='vocab_read_own_state') then
    create policy vocab_read_own_state on public.vocab_sync_state for select to authenticated using ((select auth.uid())=user_id);
  end if;
end $$;

create or replace function public.vocab_sync_pull()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select jsonb_build_object('revision',revision,'payload',payload,'updated_at',updated_at) into result
  from public.vocab_sync_state where user_id=auth.uid();
  return coalesce(result,'{"revision":0,"payload":{"version":1,"decks":{},"clips":{}}}'::jsonb);
end $$;

create or replace function vocab_internal.vocab_sync_push(p_expected_revision bigint,p_request_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); current_row public.vocab_sync_state; receipt vocab_internal.vocab_sync_receipts; k text; entry jsonb;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_expected_revision is null or p_expected_revision<0 or p_request_id is null then raise exception 'Invalid sync revision'; end if;
  if p_payload is null or octet_length(p_payload::text)>2097152 or jsonb_typeof(p_payload)<>'object'
     or p_payload->>'version' is distinct from '1' or jsonb_typeof(p_payload->'decks') is distinct from 'object'
     or jsonb_typeof(p_payload->'clips') is distinct from 'object' then raise exception 'Invalid sync payload'; end if;
  for k in select jsonb_object_keys(p_payload->'decks') loop
    if k not in ('highlight','reading','listening') or jsonb_typeof(p_payload->'decks'->k->'items') is distinct from 'object'
       or jsonb_typeof(p_payload->'decks'->k->'days') is distinct from 'object' then raise exception 'Invalid vocabulary deck'; end if;
  end loop;
  for entry in select value from jsonb_each(p_payload->'clips') loop
    if coalesce(entry->>'key','') not like uid::text||'/%' then raise exception 'Invalid audio owner'; end if;
  end loop;
  insert into public.vocab_sync_state(user_id) values(uid) on conflict(user_id) do nothing;
  select * into current_row from public.vocab_sync_state where user_id=uid for update;
  select * into receipt from vocab_internal.vocab_sync_receipts where user_id=uid and request_id=p_request_id;
  if found then
    if receipt.payload_hash<>md5(p_payload::text) then raise exception 'Request ID reused with a different payload'; end if;
    return jsonb_build_object('revision',current_row.revision,'payload',current_row.payload,'updated_at',current_row.updated_at,'conflict',false,'replay',true);
  end if;
  if current_row.revision<>p_expected_revision then
    return jsonb_build_object('revision',current_row.revision,'payload',current_row.payload,'updated_at',current_row.updated_at,'conflict',true);
  end if;
  if current_row.payload is distinct from p_payload then
    update public.vocab_sync_state set revision=revision+1,payload=p_payload,updated_at=now() where user_id=uid returning * into current_row;
  end if;
  insert into vocab_internal.vocab_sync_receipts(user_id,request_id,payload_hash,applied_revision) values(uid,p_request_id,md5(p_payload::text),current_row.revision);
  return jsonb_build_object('revision',current_row.revision,'payload',current_row.payload,'updated_at',current_row.updated_at,'conflict',false,'replay',false);
end $$;
create or replace function public.vocab_sync_push(p_expected_revision bigint,p_request_id uuid,p_payload jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select vocab_internal.vocab_sync_push(p_expected_revision,p_request_id,p_payload);
$$;
revoke all on function public.vocab_sync_pull(),public.vocab_sync_push(bigint,uuid,jsonb),vocab_internal.vocab_sync_push(bigint,uuid,jsonb) from public,anon;
grant usage on schema vocab_internal to authenticated;
grant execute on function public.vocab_sync_pull(),public.vocab_sync_push(bigint,uuid,jsonb),vocab_internal.vocab_sync_push(bigint,uuid,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit)
values('vocab-private-audio','vocab-private-audio',false,26214400)
on conflict(id) do nothing;
do $$ begin
  if exists(select 1 from storage.buckets where id='vocab-private-audio' and public) then raise exception 'Existing vocabulary audio bucket must be private'; end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='vocab_audio_read_own') then
    create policy vocab_audio_read_own on storage.objects for select to authenticated using(bucket_id='vocab-private-audio' and (storage.foldername(name))[1]=(select auth.uid()::text));
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='vocab_audio_insert_own') then
    create policy vocab_audio_insert_own on storage.objects for insert to authenticated with check(bucket_id='vocab-private-audio' and (storage.foldername(name))[1]=(select auth.uid()::text));
  end if;
end $$;
commit;
