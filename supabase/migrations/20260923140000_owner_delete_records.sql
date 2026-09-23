-- The owner needs to remove a bad record (a mis-imported historical row, a
-- duplicate, a mistake) — entries/sales/purchases/expenses previously had
-- no delete policy at all ("can never be deleted by clients", by original
-- design). Scoped to the owner role only, not the original creator, since
-- this is a heavier action than the existing self-correction update
-- policies.

create policy "entries_delete" on entries
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = entries.site_id
    )
  );

create policy "sales_delete" on sales
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = sales.site_id
    )
  );

create policy "purchases_delete" on purchases
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = purchases.site_id
    )
  );

create policy "expenses_delete" on expenses
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'owner' and p.site_id = expenses.site_id
    )
  );
