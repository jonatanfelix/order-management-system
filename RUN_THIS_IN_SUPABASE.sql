-- =====================================================
-- JALANKAN SCRIPT INI DI SUPABASE SQL EDITOR
-- =====================================================
-- Copy semua isi file ini, paste di SQL Editor, lalu Run
-- =====================================================

-- 1. Check if migration already run
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'is_task_based'
    ) THEN
        RAISE NOTICE 'Migration already run! Skipping...';
    ELSE
        RAISE NOTICE 'Running migration...';
        
        -- Add columns to orders table
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS is_task_based BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS total_duration_days INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS estimated_start_date DATE,
        ADD COLUMN IF NOT EXISTS estimated_end_date DATE;
        
        RAISE NOTICE 'Orders table updated successfully!';
    END IF;
END $$;

-- 2. Create order_tasks table if not exists
CREATE TABLE IF NOT EXISTS order_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Task Details
  name TEXT NOT NULL,
  pic TEXT,
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
  depends_on_tasks UUID[],
  
  -- Notes
  notes TEXT,
  
  -- Constraints
  UNIQUE(order_id, task_order),
  CONSTRAINT valid_duration CHECK (duration_days >= 0),
  CONSTRAINT milestone_no_duration CHECK (NOT is_milestone OR duration_days = 0),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_order_tasks_order_id ON order_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tasks_start_date ON order_tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_order_tasks_end_date ON order_tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_order_tasks_progress ON order_tasks(progress);
CREATE INDEX IF NOT EXISTS idx_orders_task_based ON orders(is_task_based);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_dates ON orders(estimated_start_date, estimated_end_date);

-- 4. Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_order_tasks_updated_at ON order_tasks;
CREATE TRIGGER update_order_tasks_updated_at 
BEFORE UPDATE ON order_tasks 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 5. Verify migration
DO $$ 
DECLARE
    orders_column_count INTEGER;
    table_exists BOOLEAN;
BEGIN
    -- Check orders columns
    SELECT COUNT(*) INTO orders_column_count
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name IN ('is_task_based', 'total_duration_days', 'estimated_start_date', 'estimated_end_date');
    
    -- Check order_tasks table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'order_tasks'
    ) INTO table_exists;
    
    -- Report results
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION:';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Orders new columns: % of 4', orders_column_count;
    RAISE NOTICE 'Order_tasks table exists: %', table_exists;
    
    IF orders_column_count = 4 AND table_exists THEN
        RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
    ELSE
        RAISE WARNING '❌ MIGRATION INCOMPLETE - Please check errors above';
    END IF;
    RAISE NOTICE '=========================================';
END $$;

-- Done!
SELECT 'Migration script executed. Check messages above for results.' as status;