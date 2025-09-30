-- Cleanup Test/Dummy Data
-- Run this script to remove test orders and keep only user-created data
-- WARNING: This will delete data! Make sure you have backups if needed

-- Delete test orders (orders without proper user assignment or created before specific date)
-- Adjust the date condition based on when you started using the system properly

-- Option 1: Delete all orders that don't have valid user assignments
DELETE FROM order_tasks WHERE order_id IN (
  SELECT id FROM orders WHERE created_by IS NULL
);

DELETE FROM orders WHERE created_by IS NULL;

-- Option 2: Delete orders from specific test accounts (replace with actual test user IDs)
-- DELETE FROM order_tasks WHERE order_id IN (
--   SELECT id FROM orders WHERE created_by = 'test-user-uuid-here'
-- );
-- 
-- DELETE FROM orders WHERE created_by = 'test-user-uuid-here';

-- Option 3: Keep only recent orders (last 7 days)
-- Uncomment if you want to delete old test data
-- DELETE FROM order_tasks WHERE order_id IN (
--   SELECT id FROM orders WHERE created_at < NOW() - INTERVAL '7 days'
-- );
-- 
-- DELETE FROM orders WHERE created_at < NOW() - INTERVAL '7 days';

-- Verify remaining data
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_tasks FROM order_tasks;

-- List all orders to verify
SELECT id, title, client_name, status, created_at, created_by 
FROM orders 
ORDER BY created_at DESC;