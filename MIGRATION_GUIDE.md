# Database Migration Guide - Normalized Schema

## Overview
The database schema has been updated to a fully normalized, relational structure based on the ERD. All tables now have proper foreign key relationships.

## Key Changes

### Table Mappings

| Old Table | New Table | Changes |
|-----------|-----------|---------|
| `payees` | `vendor` | Split name into `vendor_fname` and `vendor_lname` |
| `disbursements` | `request_payment` | Now linked to `vendor` via `vendor_id` FK |
| `disbursements` (approved) | `payment` | Approved payments moved to separate table |
| `chart_of_accounts` | `charts_of_account` | Now global (not per vendor), uses `account_id` |
| - | `approval_workflow` | New table for tracking approvals |
| - | `disbursement` | New table linking payments to chart of accounts |
| - | `report` | New table for reports |
| - | `admin` | New table for administrators |
| - | `cashier` | New table for cashiers |

### New Relationships

1. **vendor** → **request_payment** (one-to-many)
   - `vendor.vendor_id` → `request_payment.vendor_id`

2. **vendor** → **payment** (one-to-many)
   - `vendor.vendor_id` → `payment.vendor_id`

3. **request_payment** → **approval_workflow** (one-to-many)
   - `request_payment.request_id` → `approval_workflow.request_id`

4. **admin** → **approval_workflow** (one-to-many)
   - `admin.admin_id` → `approval_workflow.admin_id`

5. **cashier** → **payment** (one-to-many)
   - `cashier.cashier_id` → `payment.cashier_id`

6. **charts_of_account** → **disbursement** (one-to-many)
   - `charts_of_account.account_id` → `disbursement.account_id`

7. **payment** → **disbursement** (one-to-one)
   - `payment.payment_id` → `disbursement.payment_id`

8. **disbursement** → **report** (one-to-many)
   - `disbursement.disbursement_id` → `report.disbursement_id`

9. **cashier** → **report** (one-to-many)
   - `cashier.cashier_id` → `report.cashier_id`

## Migration Steps

### 1. Backup Your Data (if any exists)
Before running the new schema, backup any existing data.

### 2. Run the New Schema
Execute `supabase-schema.sql` in your Supabase SQL Editor. This will:
- Drop old tables (if they exist)
- Create new normalized tables with proper foreign keys
- Insert default chart of accounts
- Insert default admin and cashier records

### 3. Data Migration (if needed)
If you have existing data, you'll need to migrate it:

```sql
-- Example: Migrate payees to vendor
INSERT INTO vendor (vendor_fname, vendor_lname, contact, tin, address, contact_person, account)
SELECT 
  SPLIT_PART(name, ' ', 1) as vendor_fname,
  COALESCE(SUBSTRING(name FROM POSITION(' ' IN name) + 1), 'Unknown') as vendor_lname,
  contact,
  tin,
  address,
  contact_person,
  account
FROM payees;

-- Example: Migrate disbursements to request_payment
INSERT INTO request_payment (vendor_id, date, time, description, reason, payment_amount, method, account_number, manual_account_number, contact, reference, status)
SELECT 
  v.vendor_id,
  d.date,
  CURRENT_TIME,
  d.reason,
  d.reason,
  d.amount,
  d.method,
  d.account_number,
  d.manual_account_number,
  d.contact,
  d.reference,
  d.status
FROM disbursements d
JOIN vendor v ON v.vendor_fname || ' ' || v.vendor_lname = d.name;
```

## Code Changes

### AppContext.jsx
- Updated to use `vendor` table instead of `payees`
- Uses `request_payment` for pending disbursements
- Creates `payment` records when approving
- Creates `disbursement` records linking to chart of accounts
- Creates `approval_workflow` entries for approvals
- Helper functions to map vendor names (fname + lname)

### payees.jsx
- Updated to work with `vendor` table structure
- Handles splitting names into first/last name
- Uses `updatePayeeDetails` from AppContext

### Chart of Accounts
- Now global (not per vendor)
- Uses `charts_of_account` table
- Tracks balance instead of per-vendor debit/credit

## Important Notes

1. **Vendor Names**: The system now stores names as `vendor_fname` and `vendor_lname`. The UI still shows full names for backward compatibility.

2. **Chart of Accounts**: COA is now global. All vendors share the same chart of accounts. Balances are tracked at the account level.

3. **Approval Workflow**: When a payment is approved, an entry is created in `approval_workflow` linking the request to an admin.

4. **Payment vs Request**: 
   - `request_payment` = Pending payment requests
   - `payment` = Approved and processed payments
   - `disbursement` = Links payments to chart of accounts

5. **Default Admin/Cashier**: The schema creates default admin and cashier records. Update these with real data.

## Testing

After migration:
1. Test adding a new vendor/payee
2. Test creating a payment request
3. Test approving a payment request
4. Verify foreign key relationships in Supabase
5. Check that chart of accounts updates correctly

## Rollback

If you need to rollback, you can restore from backup or recreate the old schema structure. However, the new normalized structure is recommended for data integrity.

