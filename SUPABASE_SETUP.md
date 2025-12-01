# Supabase Setup Instructions

This project is now integrated with Supabase for all CRUD operations. Follow these steps to set up your database:

## 1. Create Database Tables

1. Go to your Supabase project dashboard: https://bruxmzcgchzbelzrzlql.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the SQL Editor
4. Click "Run" to execute the SQL script

This will create the following tables:
- `payees` - Stores payee information
- `disbursements` - Stores disbursement records
- `chart_of_accounts` - Stores chart of accounts for each payee
- `recent_activity` - Stores recent activity logs
- `stats` - Stores daily statistics

## 2. Verify Tables

After running the SQL script, verify that all tables were created:
1. Go to the Table Editor in Supabase
2. You should see all 5 tables listed

## 3. Test the Application

1. Start the development server: `npm run dev`
2. The application will automatically:
   - Load all data from Supabase on startup
   - Sync all CRUD operations with the database
   - Maintain data persistence across sessions

## 4. Database Schema Details

### Payees Table
- `id` (UUID, Primary Key)
- `name` (TEXT, Unique)
- `contact` (TEXT)
- `tin` (TEXT)
- `address` (TEXT)
- `contact_person` (TEXT)
- `account` (TEXT)
- `created_at`, `updated_at` (Timestamps)

### Disbursements Table
- `id` (UUID, Primary Key)
- `name` (TEXT) - Payee name
- `method` (TEXT) - Payment method
- `account_number` (TEXT)
- `manual_account_number` (TEXT)
- `contact` (TEXT)
- `amount` (DECIMAL)
- `date` (DATE)
- `reason` (TEXT)
- `reference` (TEXT, Unique)
- `status` (TEXT) - 'Pending', 'Approved', or 'Failed'
- `created_at`, `updated_at` (Timestamps)

### Chart of Accounts Table
- `id` (UUID, Primary Key)
- `payee_name` (TEXT)
- `section` (TEXT) - 'Assets', 'Liabilities', 'Revenues', or 'Expenses'
- `account_number` (INTEGER)
- `account_name` (TEXT)
- `debit` (DECIMAL)
- `credit` (DECIMAL)
- `created_at`, `updated_at` (Timestamps)
- Unique constraint on (`payee_name`, `section`, `account_number`)

### Recent Activity Table
- `id` (UUID, Primary Key)
- `message` (TEXT)
- `date` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### Stats Table
- `id` (UUID, Primary Key)
- `date` (DATE, Unique)
- `total_disbursed_today` (DECIMAL)
- `pending_disbursements` (INTEGER)
- `failed_transactions` (INTEGER)
- `total_requested` (INTEGER)
- `ref_counter` (INTEGER)
- `updated_at` (TIMESTAMP)

## 5. Row Level Security (RLS)

The schema includes RLS policies that allow all operations. For production, you should:
1. Implement proper authentication
2. Update RLS policies to restrict access based on user roles
3. Never expose the service role key in client-side code

## 6. Important Notes

- The `anon` key is used in the client-side code (safe for public use)
- The `service_role` key should NEVER be used in client-side code
- All data is automatically synced with Supabase
- The application loads all data on startup
- All CRUD operations are now persistent across sessions

## Troubleshooting

If you encounter issues:

1. **Tables not found**: Make sure you ran the SQL script in the SQL Editor
2. **Permission errors**: Check that RLS policies are set correctly
3. **Data not loading**: Check the browser console for errors
4. **Connection issues**: Verify your Supabase URL and anon key in `src/lib/supabase.js`

