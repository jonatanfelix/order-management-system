-- Enable public/guest read access to orders and order_tasks
-- Run this SQL in Supabase SQL Editor

-- Allow anonymous users to read all orders
CREATE POLICY "Public users can view all orders"
ON orders
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read all order tasks
CREATE POLICY "Public users can view all order_tasks"  
ON order_tasks
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read categories (referenced in orders)
CREATE POLICY "Public users can view all categories"
ON categories
FOR SELECT
TO anon
USING (true);

-- Note: These policies allow GUEST (non-authenticated) users to READ ONLY
-- No INSERT, UPDATE, or DELETE permissions for anonymous users
-- Authenticated users still have their role-based access control

-- Verify policies are active:
-- SELECT * FROM pg_policies WHERE tablename IN ('orders', 'order_tasks', 'categories');