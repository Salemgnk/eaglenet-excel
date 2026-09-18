-- Phase 4: the owner dashboard subscribes to live changes on entries.
-- Realtime is opt-in per table in Supabase; entries isn't in the
-- publication by default.
alter publication supabase_realtime add table entries;
