Supabase integration steps for IMProject

1. Run the SQL in Supabase SQL editor

- Open Supabase project -> SQL editor.
- Paste the `supabase-schema.sql` contents or run the specific statements below to ensure the `stats`, `payees`, `disbursements`, and `recent_activity` tables exist and the `get_next_reference` function is created.

-- Minimal tables (already added by you)
-- stats, payees, disbursements, recent_activity

2. Register the RPC function (if not yet run)

Run this SQL in the SQL editor:

CREATE OR REPLACE FUNCTION public.get_next_reference(\_date date)
RETURNS TABLE(reference text, ref_counter integer) LANGUAGE plpgsql AS $$
BEGIN
INSERT INTO public.stats(date, ref_counter, total_requested)
VALUES (\_date, 1, 0)
ON CONFLICT (date) DO UPDATE
SET ref_counter = public.stats.ref_counter + 1
RETURNING ref_counter INTO ref_counter;

reference := format('DISB-%s-%s', to_char(\_date, 'YYYYMMDD'), lpad(ref_counter::text,5,'0'));
RETURN;
END;

$$
;

3) How the app uses the RPC

- When creating a disbursement the app calls:

  const { data, error } = await supabase.rpc('get_next_reference', { _date: today })

- The RPC returns an array like: [{ reference: 'DISB-20251229-00001', ref_counter: 1 }]
- The app uses the returned `reference` when inserting into `disbursements` so references are generated atomically and are unique.

4) Verify the setup

- Create a test disbursement from the app and confirm the row in `disbursements` has a `reference` like `DISB-20251229-00001`.
- Check `stats` row for today's date and verify `ref_counter` increased.

7) Chart of Accounts (transfer from local to DB)

- The app will now load Chart of Accounts from the `charts_of_account` table. If the table is empty, the app will insert default accounts from the local `src/chartOfAccounts.js` file on first load.
- To pre-populate manually, you can run INSERT statements in the SQL editor or rely on the app to add defaults on first run — I have added a migration that inserts the Chart of Accounts entries into `supabase-schema.sql` so you can copy/paste or run it directly.

- Example manual insert (single):

  INSERT INTO charts_of_account (account_number, account_name, section, description) VALUES (501, 'Amortization expense', 'Expenses', 'Amortization expense');

- When using the app UI (`Chart of Accounts` page), adding, editing, or deleting accounts will persist changes to the `charts_of_account` table.

5) Optional: secure your RPC usage

- If you don't want to expose the RPC to anonymous clients, call it from a server-side function (Supabase Edge Function or your own backend) using the `service_role` key and then return the reference to the client or perform the insert server-side.

6) Troubleshooting

- If `supabase.rpc('get_next_reference')` returns an error, check the SQL editor for function errors and ensure the function was saved.
- If references skip numbers, check for concurrent calls or manual edits to `stats`. The RPC uses `ON CONFLICT` update to increment atomically to prevent duplicates.
$$
