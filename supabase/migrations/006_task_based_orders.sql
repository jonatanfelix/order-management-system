-- =====================================================
-- Task-Based Orders - Database Schema Extension
-- =====================================================

-- =====================================================
-- 1. ORDER_TASKS TABLE (Task Steps for Orders)
-- =====================================================
CREATE TABLE order_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Task Details
  name TEXT NOT NULL,
  pic TEXT, -- Person in Charge
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 1,
  
  -- Progress & Status
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Task Order & Dependencies
  task_order INTEGER NOT NULL,
  depends_on_tasks UUID[], -- Array of task IDs this depends on
  
  -- Notes
  notes TEXT,
  
  -- Constraints
  UNIQUE(order_id, task_order),
  CONSTRAINT valid_duration CHECK (duration_days >= 0),
  CONSTRAINT milestone_no_duration CHECK (NOT is_milestone OR duration_days = 0),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- =====================================================
-- 2. Extend ORDERS table for task-based orders
-- =====================================================
ALTER TABLE orders 
ADD COLUMN is_task_based BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN total_duration_days INTEGER DEFAULT 0,
ADD COLUMN estimated_start_date DATE,
ADD COLUMN estimated_end_date DATE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_order_tasks_order_id ON order_tasks(order_id);
CREATE INDEX idx_order_tasks_start_date ON order_tasks(start_date);
CREATE INDEX idx_order_tasks_end_date ON order_tasks(end_date);
CREATE INDEX idx_order_tasks_progress ON order_tasks(progress);
CREATE INDEX idx_orders_task_based ON orders(is_task_based);
CREATE INDEX idx_orders_estimated_dates ON orders(estimated_start_date, estimated_end_date);

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Updated at trigger for order_tasks
CREATE TRIGGER update_order_tasks_updated_at BEFORE UPDATE ON order_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate order timeline from tasks
CREATE OR REPLACE FUNCTION calculate_order_timeline(p_order_id UUID)
RETURNS TABLE(
  total_duration INTEGER,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(MAX(ot.end_date) - MIN(ot.start_date) + 1, 0)::INTEGER as total_duration,
    MIN(ot.start_date) as start_date,
    MAX(ot.end_date) as end_date
  FROM order_tasks ot
  WHERE ot.order_id = p_order_id
  AND NOT ot.is_milestone;
END;
$$ LANGUAGE plpgsql;

-- Function to update order timeline when tasks change
CREATE OR REPLACE FUNCTION update_order_timeline()
RETURNS TRIGGER AS $$
DECLARE
  timeline_data RECORD;
BEGIN
  -- Get the order_id from the affected row
  IF TG_OP = 'DELETE' THEN
    SELECT * FROM calculate_order_timeline(OLD.order_id) INTO timeline_data;
    
    UPDATE orders 
    SET 
      total_duration_days = timeline_data.total_duration,
      estimated_start_date = timeline_data.start_date,
      estimated_end_date = timeline_data.end_date,
      updated_at = NOW()
    WHERE id = OLD.order_id;
  ELSE
    SELECT * FROM calculate_order_timeline(NEW.order_id) INTO timeline_data;
    
    UPDATE orders 
    SET 
      total_duration_days = timeline_data.total_duration,
      estimated_start_date = timeline_data.start_date,
      estimated_end_date = timeline_data.end_date,
      updated_at = NOW()
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update order timeline
CREATE TRIGGER update_order_timeline_trigger
  AFTER INSERT OR UPDATE OR DELETE ON order_tasks
  FOR EACH ROW EXECUTE FUNCTION update_order_timeline();

-- =====================================================
-- RPC FUNCTIONS FOR API
-- =====================================================

-- Function to create task-based order with tasks
CREATE OR REPLACE FUNCTION create_task_based_order(
  p_title TEXT,
  p_client_name TEXT,
  p_category_id UUID,
  p_priority TEXT DEFAULT 'normal',
  p_tasks JSONB DEFAULT '[]'::JSONB,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  task_item JSONB;
  task_counter INTEGER := 1;
BEGIN
  -- Create the main order
  INSERT INTO orders (
    title, 
    client_name, 
    category_id, 
    status,
    value_idr,
    is_task_based,
    created_by
  ) VALUES (
    p_title, 
    p_client_name, 
    p_category_id, 
    'DRAFT',
    0, -- Will be updated later if needed
    TRUE,
    p_created_by
  ) RETURNING id INTO new_order_id;
  
  -- Insert tasks
  FOR task_item IN SELECT * FROM jsonb_array_elements(p_tasks)
  LOOP
    INSERT INTO order_tasks (
      order_id,
      name,
      pic,
      quantity,
      unit,
      start_date,
      end_date,
      duration_days,
      progress,
      is_milestone,
      task_order,
      depends_on_tasks,
      notes
    ) VALUES (
      new_order_id,
      task_item->>'name',
      task_item->>'pic',
      COALESCE((task_item->>'quantity')::NUMERIC, 1),
      COALESCE(task_item->>'unit', 'pcs'),
      (task_item->>'startDate')::DATE,
      (task_item->>'endDate')::DATE,
      COALESCE((task_item->>'duration')::INTEGER, 1),
      COALESCE((task_item->>'progress')::INTEGER, 0),
      COALESCE((task_item->>'isMilestone')::BOOLEAN, FALSE),
      task_counter,
      CASE 
        WHEN task_item->'dependsOn' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(task_item->'dependsOn'))::UUID[]
        ELSE ARRAY[]::UUID[]
      END,
      task_item->>'notes'
    );
    
    task_counter := task_counter + 1;
  END LOOP;
  
  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order with tasks
CREATE OR REPLACE FUNCTION get_order_with_tasks(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  order_data JSONB;
  tasks_data JSONB;
BEGIN
  -- Get order data
  SELECT to_jsonb(o.*) INTO order_data
  FROM orders o
  WHERE o.id = p_order_id;
  
  -- Get tasks data
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ot.id,
      'name', ot.name,
      'pic', ot.pic,
      'quantity', ot.quantity,
      'unit', ot.unit,
      'startDate', ot.start_date,
      'endDate', ot.end_date,
      'duration', ot.duration_days,
      'progress', ot.progress,
      'isMilestone', ot.is_milestone,
      'taskOrder', ot.task_order,
      'dependsOn', ot.depends_on_tasks,
      'notes', ot.notes
    ) ORDER BY ot.task_order
  ), '[]'::JSONB) INTO tasks_data
  FROM order_tasks ot
  WHERE ot.order_id = p_order_id;
  
  RETURN jsonb_build_object(
    'order', order_data,
    'tasks', tasks_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;