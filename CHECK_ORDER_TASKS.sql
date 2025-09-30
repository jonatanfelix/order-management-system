-- Check if order has tasks in order_tasks table
-- Replace 'your-order-id' with actual order ID

-- Check order details
SELECT 
  id, 
  title, 
  is_task_based,
  created_at,
  (SELECT COUNT(*) FROM order_tasks WHERE order_id = orders.id) as task_count
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check specific order tasks (replace UUID with actual order ID)
-- SELECT * FROM order_tasks WHERE order_id = 'your-order-id-here';

-- Check all task-based orders
SELECT 
  o.id,
  o.title,
  o.is_task_based,
  COUNT(ot.id) as task_count
FROM orders o
LEFT JOIN order_tasks ot ON ot.order_id = o.id
WHERE o.is_task_based = true
GROUP BY o.id, o.title, o.is_task_based
ORDER BY o.created_at DESC;