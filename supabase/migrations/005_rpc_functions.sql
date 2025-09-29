-- =====================================================
-- RPC Functions for Business Operations
-- =====================================================

-- =====================================================
-- 1. PUBLIC SHARE FUNCTIONS
-- =====================================================

-- Create public share link
CREATE OR REPLACE FUNCTION create_public_share(order_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  share_code TEXT;
  existing_code TEXT;
BEGIN
  -- Check if user can access this order
  IF NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_uuid 
    AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;
  
  -- Check if share already exists
  SELECT code INTO existing_code 
  FROM public_shares 
  WHERE order_id = order_uuid 
  AND (expires_at IS NULL OR expires_at > NOW());
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new share code
  LOOP
    share_code := fn_generate_share_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public_shares WHERE code = share_code);
  END LOOP;
  
  -- Create share record
  INSERT INTO public_shares (order_id, code, created_by)
  VALUES (order_uuid, share_code, auth.uid());
  
  RETURN share_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get public order details (anonymous access)
CREATE OR REPLACE FUNCTION get_public_order(share_code TEXT)
RETURNS JSON AS $$
DECLARE
  order_record RECORD;
  steps_json JSON;
  adjustments_json JSON;
  result JSON;
BEGIN
  -- Find order by share code
  SELECT o.*, c.name as category_name, t.name as template_name,
         ps.expires_at
  INTO order_record
  FROM public_shares ps
  JOIN orders o ON o.id = ps.order_id
  JOIN categories c ON c.id = o.category_id
  JOIN templates t ON t.id = o.template_id
  WHERE ps.code = share_code
  AND (ps.expires_at IS NULL OR ps.expires_at > NOW());
  
  IF order_record IS NULL THEN
    RETURN json_build_object('error', 'Share not found or expired');
  END IF;
  
  -- Get order steps (aggregated, no sensitive details)
  SELECT json_agg(
    json_build_object(
      'name', name_snapshot,
      'type', type_snapshot,
      'duration_hours', ROUND(duration_minutes / 60.0, 1),
      'order_index', order_index
    ) ORDER BY order_index
  ) INTO steps_json
  FROM order_steps
  WHERE order_id = order_record.id;
  
  -- Get adjustments (public version)
  SELECT json_agg(
    json_build_object(
      'reason', ar.label,
      'impact_hours', ROUND(oa.minutes_delta / 60.0, 1),
      'created_at', oa.created_at
    ) ORDER BY oa.created_at DESC
  ) INTO adjustments_json
  FROM order_adjustments oa
  JOIN adjustment_reasons ar ON ar.id = oa.reason_id
  WHERE oa.order_id = order_record.id;
  
  -- Build result
  result := json_build_object(
    'order', json_build_object(
      'id', order_record.id,
      'title', order_record.title,
      'client_name', order_record.client_name,
      'status', order_record.status,
      'category', order_record.category_name,
      'template', order_record.template_name,
      'eta_at', order_record.eta_at,
      'created_at', order_record.created_at
    ),
    'steps', COALESCE(steps_json, '[]'::json),
    'adjustments', COALESCE(adjustments_json, '[]'::json),
    'share_expires_at', order_record.expires_at
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. ORDER MANAGEMENT FUNCTIONS
-- =====================================================

-- Submit order for approval
CREATE OR REPLACE FUNCTION submit_order_for_approval(order_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  order_record RECORD;
BEGIN
  -- Get order details
  SELECT * INTO order_record 
  FROM orders 
  WHERE id = order_uuid 
  AND created_by = auth.uid()
  AND status = 'DRAFT';
  
  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order not found, not yours, or not in DRAFT status';
  END IF;
  
  -- Check minimum value (10M IDR)
  IF order_record.value_idr < 10000000 THEN
    RAISE EXCEPTION 'Order value must be at least Rp 10,000,000 to submit for approval';
  END IF;
  
  -- Update status
  UPDATE orders 
  SET status = 'PENDING_APPROVAL'
  WHERE id = order_uuid;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve/Reject order
CREATE OR REPLACE FUNCTION approve_reject_order(
  order_uuid UUID,
  new_status TEXT,
  approval_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_role TEXT;
BEGIN
  -- Check user role
  SELECT role INTO profile_role 
  FROM profiles 
  WHERE id = auth.uid() 
  AND is_active = true;
  
  IF profile_role NOT IN ('APPROVER', 'ADMIN') THEN
    RAISE EXCEPTION 'Only approvers can approve/reject orders';
  END IF;
  
  IF new_status NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Status must be APPROVED or REJECTED';
  END IF;
  
  -- Check if order exists and is pending
  IF NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_uuid 
    AND status = 'PENDING_APPROVAL'
  ) THEN
    RAISE EXCEPTION 'Order not found or not pending approval';
  END IF;
  
  -- Update order status (triggers will handle timestamps)
  UPDATE orders 
  SET status = new_status
  WHERE id = order_uuid;
  
  -- Record approval decision
  INSERT INTO approvals (order_id, approver_id, status, note)
  VALUES (order_uuid, auth.uid(), new_status, approval_note);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TEMPLATE MANAGEMENT FUNCTIONS
-- =====================================================

-- Get templates by category
CREATE OR REPLACE FUNCTION get_templates_by_category(category_slug TEXT)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  description TEXT,
  steps_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.code, t.name, t.description,
         (SELECT COUNT(*)::INTEGER FROM template_steps ts WHERE ts.template_id = t.id) as steps_count
  FROM templates t
  JOIN categories c ON c.id = t.category_id
  WHERE c.slug = category_slug
  AND t.is_active = true
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get template steps with details
CREATE OR REPLACE FUNCTION get_template_steps(template_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  order_index INTEGER,
  base_duration_minutes INTEGER,
  rate_per_unit_minutes DECIMAL,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ts.id, ts.name, ts.type, ts.order_index,
         ts.base_duration_minutes, ts.rate_per_unit_minutes, ts.unit
  FROM template_steps ts
  WHERE ts.template_id = template_uuid
  ORDER BY ts.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. DASHBOARD FUNCTIONS
-- =====================================================

-- Get order statistics for dashboard
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_role TEXT;
  base_query TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- Base query depends on role
  IF user_role = 'ADMIN' THEN
    base_query := 'FROM orders';
  ELSIF user_role = 'APPROVER' THEN
    base_query := 'FROM orders';  -- Approvers can see all
  ELSE
    base_query := 'FROM orders WHERE created_by = ''' || auth.uid() || '''';
  END IF;
  
  -- Build statistics
  EXECUTE format('
    SELECT json_build_object(
      ''total_orders'', COUNT(*),
      ''draft_orders'', COUNT(*) FILTER (WHERE status = ''DRAFT''),
      ''pending_orders'', COUNT(*) FILTER (WHERE status = ''PENDING_APPROVAL''),
      ''approved_orders'', COUNT(*) FILTER (WHERE status = ''APPROVED''),
      ''rejected_orders'', COUNT(*) FILTER (WHERE status = ''REJECTED''),
      ''total_value'', COALESCE(SUM(value_idr), 0)
    ) %s', base_query) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. UTILITY FUNCTIONS
-- =====================================================

-- Get user profile with role
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS JSON AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT p.*, u.email
  INTO profile_record
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = auth.uid();
  
  IF profile_record IS NULL THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;
  
  RETURN json_build_object(
    'id', profile_record.id,
    'name', profile_record.name,
    'email', profile_record.email,
    'role', profile_record.role,
    'is_active', profile_record.is_active,
    'created_at', profile_record.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search orders with filters
CREATE OR REPLACE FUNCTION search_orders(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  client_name TEXT,
  value_idr NUMERIC,
  status TEXT,
  category_name TEXT,
  template_name TEXT,
  eta_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by_name TEXT
) AS $$
DECLARE
  user_role TEXT;
  base_condition TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- Base condition for access control
  IF user_role IN ('ADMIN', 'APPROVER') THEN
    base_condition := 'TRUE';
  ELSE
    base_condition := 'o.created_by = ''' || auth.uid() || '''';
  END IF;
  
  RETURN QUERY EXECUTE format('
    SELECT o.id, o.title, o.client_name, o.value_idr, o.status,
           c.name as category_name, t.name as template_name,
           o.eta_at, o.created_at, p.name as created_by_name
    FROM orders o
    JOIN categories c ON c.id = o.category_id
    JOIN templates t ON t.id = o.template_id
    JOIN profiles p ON p.id = o.created_by
    WHERE (%s)
    AND ($1 IS NULL OR o.title ILIKE ''%%'' || $1 || ''%%'' OR o.client_name ILIKE ''%%'' || $1 || ''%%'')
    AND ($2 IS NULL OR o.status = $2)
    AND ($3 IS NULL OR c.slug = $3)
    ORDER BY o.created_at DESC
    LIMIT $4 OFFSET $5
  ', base_condition)
  USING search_term, status_filter, category_filter, limit_count, offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;