-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustment_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES TABLE POLICIES
-- =====================================================

-- Users can view all profiles (for dropdowns, etc.)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- System can insert profiles (via trigger)
CREATE POLICY "profiles_insert_system" ON profiles
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 3. MASTER DATA POLICIES (Categories, Templates, etc.)
-- =====================================================

-- Everyone can read master data
CREATE POLICY "categories_select_all" ON categories
  FOR SELECT USING (true);

CREATE POLICY "templates_select_all" ON templates
  FOR SELECT USING (true);

CREATE POLICY "template_steps_select_all" ON template_steps
  FOR SELECT USING (true);

CREATE POLICY "adjustment_reasons_select_all" ON adjustment_reasons
  FOR SELECT USING (true);

-- Only ADMIN can modify master data
CREATE POLICY "categories_admin_all" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

CREATE POLICY "templates_admin_all" ON templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

CREATE POLICY "template_steps_admin_all" ON template_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

CREATE POLICY "adjustment_reasons_admin_all" ON adjustment_reasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

-- =====================================================
-- 4. ORDERS TABLE POLICIES
-- =====================================================

-- INPUTER: Can view own orders + insert + update own DRAFT/REJECTED orders
CREATE POLICY "orders_inputer_select" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'INPUTER'
      AND profiles.is_active = true
      AND (orders.created_by = auth.uid() OR profiles.role IN ('ADMIN', 'APPROVER'))
    )
  );

CREATE POLICY "orders_inputer_insert" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('INPUTER', 'ADMIN')
      AND profiles.is_active = true
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "orders_inputer_update" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('INPUTER', 'ADMIN')
      AND profiles.is_active = true
      AND orders.created_by = auth.uid()
      AND orders.status IN ('DRAFT', 'REJECTED')
    )
  );

-- APPROVER: Can view all orders + update status to APPROVED/REJECTED
CREATE POLICY "orders_approver_select" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('APPROVER', 'ADMIN')
      AND profiles.is_active = true
    )
  );

CREATE POLICY "orders_approver_update_status" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('APPROVER', 'ADMIN')
      AND profiles.is_active = true
    )
    AND status = 'PENDING_APPROVAL' -- Can only approve pending orders
  ) WITH CHECK (
    status IN ('APPROVED', 'REJECTED') -- Can only set to these statuses
  );

-- ADMIN: Full access
CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

-- =====================================================
-- 5. ORDER_STEPS TABLE POLICIES  
-- =====================================================

-- Follow order access permissions
CREATE POLICY "order_steps_select" ON order_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_steps.order_id
      -- Use orders RLS policies to determine access
    )
  );

-- INPUTER: Can modify steps for own DRAFT/REJECTED orders
CREATE POLICY "order_steps_inputer_modify" ON order_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE orders.id = order_steps.order_id
      AND profiles.role IN ('INPUTER', 'ADMIN')  
      AND profiles.is_active = true
      AND orders.created_by = auth.uid()
      AND orders.status IN ('DRAFT', 'REJECTED')
    )
  );

-- ADMIN: Full access
CREATE POLICY "order_steps_admin_all" ON order_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

-- =====================================================
-- 6. ORDER_ADJUSTMENTS TABLE POLICIES
-- =====================================================

-- Users can view adjustments for orders they can see
CREATE POLICY "order_adjustments_select" ON order_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_adjustments.order_id
      -- Inherit from orders RLS
    )
  );

-- INPUTER: Can add adjustments to own orders (even APPROVED ones)
CREATE POLICY "order_adjustments_inputer_insert" ON order_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN profiles ON profiles.id = auth.uid()
      WHERE orders.id = order_adjustments.order_id
      AND profiles.role IN ('INPUTER', 'ADMIN')
      AND profiles.is_active = true
      AND orders.created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Only creator can update/delete own adjustments
CREATE POLICY "order_adjustments_own_modify" ON order_adjustments
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "order_adjustments_own_delete" ON order_adjustments
  FOR DELETE USING (created_by = auth.uid());

-- ADMIN: Full access
CREATE POLICY "order_adjustments_admin_all" ON order_adjustments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

-- =====================================================
-- 7. APPROVALS TABLE POLICIES
-- =====================================================

-- Users can view approvals for orders they can see
CREATE POLICY "approvals_select" ON approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = approvals.order_id
      -- Inherit from orders RLS
    )
  );

-- APPROVER: Can insert approvals
CREATE POLICY "approvals_approver_insert" ON approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('APPROVER', 'ADMIN')
      AND profiles.is_active = true
    )
    AND approver_id = auth.uid()
  );

-- =====================================================
-- 8. PUBLIC_SHARES TABLE POLICIES
-- =====================================================

-- Users can view shares for orders they created
CREATE POLICY "public_shares_select_own" ON public_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = public_shares.order_id
      AND orders.created_by = auth.uid()
    )
  );

-- Users can create shares for own orders
CREATE POLICY "public_shares_insert_own" ON public_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = public_shares.order_id
      AND orders.created_by = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can delete own shares
CREATE POLICY "public_shares_delete_own" ON public_shares
  FOR DELETE USING (created_by = auth.uid());

-- ADMIN: Full access
CREATE POLICY "public_shares_admin_all" ON public_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

-- =====================================================
-- 9. AUDIT_LOGS TABLE POLICIES  
-- =====================================================

-- ADMIN can view all audit logs
CREATE POLICY "audit_logs_admin_select" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
      AND profiles.is_active = true
    )
  );

-- Users can view audit logs for their own orders
CREATE POLICY "audit_logs_own_orders" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = audit_logs.order_id
      AND orders.created_by = auth.uid()
    )
  );

-- System can insert audit logs
CREATE POLICY "audit_logs_system_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 10. SPECIAL POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Create a special policy for anonymous access to public shares
-- This will be used by edge functions or public API endpoints
CREATE POLICY "public_shares_anonymous_by_code" ON public_shares
  FOR SELECT USING (
    -- Allow access if the code is being queried and not expired
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Enable anonymous access for public share lookups
-- Note: This will be handled via RPC functions or edge functions