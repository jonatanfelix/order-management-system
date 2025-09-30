-- Add target field to order_tasks table
-- This represents the target realization/output for each task
-- Example: "20 rim", "1 kali 200 rim", "sesuai plate selesai"

ALTER TABLE order_tasks 
ADD COLUMN IF NOT EXISTS target TEXT;

COMMENT ON COLUMN order_tasks.target IS 'Target realisasi kerja / expected output for the task';

-- Update the create_task_based_order function to support target field
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
    0,
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
      target,
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
      task_item->>'target',
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

-- Update get_order_with_tasks function to include target
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
      'target', ot.target,
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