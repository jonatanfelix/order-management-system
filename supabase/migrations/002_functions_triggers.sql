-- =====================================================
-- Business Functions & Triggers
-- =====================================================

-- =====================================================
-- 1. FUNCTION: Build Order Steps from Template
-- =====================================================
CREATE OR REPLACE FUNCTION fn_build_order_steps(input_order_id UUID)
RETURNS VOID AS $$
DECLARE
  template_record RECORD;
  step_record RECORD;
BEGIN
  -- Get template from order
  SELECT template_id INTO template_record FROM orders WHERE id = input_order_id;
  
  -- Delete existing steps
  DELETE FROM order_steps WHERE order_id = input_order_id;
  
  -- Insert steps from template
  FOR step_record IN 
    SELECT * FROM template_steps 
    WHERE template_id = template_record.template_id 
    ORDER BY order_index
  LOOP
    INSERT INTO order_steps (
      order_id,
      template_step_id,
      name_snapshot,
      type_snapshot,
      unit_snapshot,
      order_index,
      qty,
      duration_minutes
    ) VALUES (
      input_order_id,
      step_record.id,
      step_record.name,
      step_record.type,
      step_record.unit,
      step_record.order_index,
      CASE WHEN step_record.type = 'RATE' THEN 1 ELSE NULL END, -- Default qty = 1 for RATE steps
      step_record.base_duration_minutes -- Will be recalculated by trigger
    );
  END LOOP;
  
  -- Recalculate ETA
  PERFORM fn_recalc_eta(input_order_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNCTION: Recalculate ETA
-- =====================================================
CREATE OR REPLACE FUNCTION fn_recalc_eta(input_order_id UUID)
RETURNS VOID AS $$
DECLARE
  total_minutes NUMERIC := 0;
  adjustment_minutes INTEGER := 0;
  step_record RECORD;
  baseline_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate total duration from order steps
  FOR step_record IN 
    SELECT * FROM order_steps WHERE order_id = input_order_id ORDER BY order_index
  LOOP
    IF step_record.type_snapshot = 'FIXED' THEN
      -- Get base duration from template_steps
      SELECT base_duration_minutes INTO total_minutes
      FROM template_steps 
      WHERE id = step_record.template_step_id;
      
      -- Update order_steps with calculated duration
      UPDATE order_steps 
      SET duration_minutes = total_minutes
      WHERE id = step_record.id;
      
    ELSIF step_record.type_snapshot = 'RATE' THEN
      -- Calculate: rate_per_unit * qty
      SELECT (rate_per_unit_minutes * COALESCE(step_record.qty, 1)) INTO total_minutes
      FROM template_steps 
      WHERE id = step_record.template_step_id;
      
      -- Update order_steps with calculated duration  
      UPDATE order_steps 
      SET duration_minutes = total_minutes
      WHERE id = step_record.id;
    END IF;
  END LOOP;
  
  -- Sum all step durations
  SELECT COALESCE(SUM(duration_minutes), 0) INTO total_minutes
  FROM order_steps WHERE order_id = input_order_id;
  
  -- Add adjustments
  SELECT COALESCE(SUM(minutes_delta), 0) INTO adjustment_minutes
  FROM order_adjustments WHERE order_id = input_order_id;
  
  -- Calculate ETA (baseline = now for simplicity)
  baseline_time := NOW();
  
  -- Update order ETA
  UPDATE orders 
  SET eta_at = baseline_time + INTERVAL '1 minute' * (total_minutes + adjustment_minutes)
  WHERE id = input_order_id;
  
  -- Log the calculation
  INSERT INTO audit_logs (order_id, actor_id, action, payload) VALUES (
    input_order_id,
    NULL, -- System action
    'ETA_RECALCULATED',
    jsonb_build_object(
      'total_step_minutes', total_minutes,
      'adjustment_minutes', adjustment_minutes,
      'final_eta', baseline_time + INTERVAL '1 minute' * (total_minutes + adjustment_minutes)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNCTION: Generate Public Share Code
-- =====================================================
CREATE OR REPLACE FUNCTION fn_generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Base32-like (no 0,1,I,O)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION: Create Profile on User Signup  
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'INPUTER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recalculate ETA when order_steps change
CREATE OR REPLACE TRIGGER trigger_recalc_eta_on_steps
  AFTER INSERT OR UPDATE OR DELETE ON order_steps
  FOR EACH ROW 
  EXECUTE FUNCTION fn_recalc_eta_wrapper();

-- Recalculate ETA when adjustments change  
CREATE OR REPLACE TRIGGER trigger_recalc_eta_on_adjustments
  AFTER INSERT OR UPDATE OR DELETE ON order_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalc_eta_wrapper();

-- Wrapper function for triggers (handles NEW/OLD)
CREATE OR REPLACE FUNCTION fn_recalc_eta_wrapper()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM fn_recalc_eta(OLD.order_id);
    RETURN OLD;
  ELSE
    PERFORM fn_recalc_eta(NEW.order_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. BUSINESS RULE TRIGGERS
-- =====================================================

-- Prevent editing approved orders (except adjustments)
CREATE OR REPLACE FUNCTION fn_prevent_approved_order_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'APPROVED' AND NEW.status = 'APPROVED' THEN
    -- Only allow eta_at and updated_at changes
    IF (OLD.title, OLD.client_name, OLD.value_idr, OLD.category_id, OLD.template_id) 
       IS DISTINCT FROM (NEW.title, NEW.client_name, NEW.value_idr, NEW.category_id, NEW.template_id) THEN
      RAISE EXCEPTION 'Cannot modify approved order details. Only adjustments are allowed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_prevent_approved_edit
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_approved_order_edit();

-- Auto-update approval timestamps
CREATE OR REPLACE FUNCTION fn_update_approval_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    NEW.approved_at = NOW();
    NEW.rejected_at = NULL;
  ELSIF NEW.status = 'REJECTED' AND OLD.status != 'REJECTED' THEN
    NEW.rejected_at = NOW(); 
    NEW.approved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_approval_timestamps
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_approval_timestamps();

-- =====================================================
-- 7. AUDIT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION fn_audit_order_changes()
RETURNS TRIGGER AS $$
DECLARE
  actor_id UUID;
BEGIN
  -- Try to get current user (might be NULL for system actions)
  actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (order_id, actor_id, action, payload)
    VALUES (NEW.id, actor_id, 'ORDER_CREATED', to_jsonb(NEW));
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes specifically
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (order_id, actor_id, action, payload)
      VALUES (NEW.id, actor_id, 'STATUS_CHANGED', 
        jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
    
    -- Log general updates
    INSERT INTO audit_logs (order_id, actor_id, action, payload)
    VALUES (NEW.id, actor_id, 'ORDER_UPDATED', 
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (order_id, actor_id, action, payload)
    VALUES (OLD.id, actor_id, 'ORDER_DELETED', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_order_changes();