# Database Table Cleanup Guide

## Current Situation
You have duplicate tables because both the old and new schemas exist in your database.

## Tables Currently in Use (KEEP THESE)

### ✅ Active Tables:
1. **payees** - Vendor/payee information (OLD schema)
2. **disbursements** - Payment requests (OLD schema)
3. **charts_of_account** - Chart of accounts (NEW schema - used in approveDisbursement)
4. **recent_activity** - Activity logs
5. **stats** - Daily statistics

## Tables to Remove (DUPLICATES/UNUSED)

### ❌ Remove These Tables:
1. **vendor** - Duplicate of `payees` (new normalized version, not being used)
2. **request_payment** - Duplicate of `disbursements` (new normalized version, not being used)
3. **payment** - Not used (part of new schema)
4. **approval_workflow** - Not used (part of new schema)
5. **disbursement** - Not used (singular, part of new schema)
6. **report** - Not used (part of new schema)
7. **admin** - Not used (part of new schema)
8. **cashier** - Not used (part of new schema)
9. **chart_of_accounts** - If you have this AND `charts_of_account`, keep only `charts_of_account`

## How to Clean Up

### Option 1: Quick Cleanup (Recommended)
Run the `cleanup-duplicate-tables.sql` script in your Supabase SQL Editor.

### Option 2: Manual Cleanup
1. Go to Supabase → Table Editor
2. For each unused table listed above:
   - Click on the table
   - Click the "..." menu
   - Select "Delete table"
   - Confirm deletion

## After Cleanup

You should have only these tables:
- ✅ payees
- ✅ disbursements
- ✅ charts_of_account (or chart_of_accounts)
- ✅ recent_activity
- ✅ stats

## Important Notes

⚠️ **WARNING**: 
- Dropping tables will DELETE all data in those tables
- Make sure you don't need any data from the tables you're removing
- Consider backing up data first if unsure

## If You Want to Use New Schema Later

If you decide to migrate to the normalized schema later:
1. Run `supabase-schema.sql` to create the new tables
2. Migrate data from old tables to new tables
3. Update the code to use new table names
4. Then you can drop the old tables

## Current Code Status

The code is currently configured to:
- Use `payees` table (old schema) ✅
- Use `disbursements` table (old schema) ✅
- Use `charts_of_account` table (new schema) ✅
- Fallback gracefully if tables don't exist

So you can safely remove the unused normalized tables.

