-- Phase 5: Excel push worker.

-- Tracks whether an entry has been pushed to the owner's Excel file yet.
-- Null = not pushed. The worker retries anything still null.
alter table entries add column if not exists excel_synced_at timestamptz;

-- Holds the OAuth tokens and target-file config for the owner's connected
-- Microsoft account. One row per site. This table is intentionally NOT
-- exposed to any client role: RLS is enabled with no policies at all, so
-- only the service_role key (used exclusively by Edge Functions) can ever
-- read or write it. Never add a policy here for 'authenticated' or 'anon'.
create table if not exists integrations_microsoft (
  site_id uuid primary key,
  connected_by uuid references auth.users(id),
  connected_at timestamptz not null default now(),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  drive_id text,
  item_id text,
  table_name text,
  updated_at timestamptz not null default now()
);

alter table integrations_microsoft enable row level security;
-- No policies: default-deny for every client role. Service role bypasses
-- RLS entirely, which is how the Edge Functions will read/write this.
