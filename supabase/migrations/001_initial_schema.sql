-- =====================================================
-- Order Management System - Complete Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE (User Management)
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'INPUTER' CHECK (role IN ('INPUTER', 'APPROVER', 'ADMIN')),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 2)
);

-- =====================================================
-- 2. CATEGORIES TABLE (Order Categories)
-- =====================================================
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- =====================================================
-- 3. TEMPLATES TABLE (Process Templates)
-- =====================================================
CREATE TABLE templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9_/-]+$')
);

-- =====================================================
-- 4. TEMPLATE_STEPS TABLE (Process Steps)
-- =====================================================
CREATE TABLE template_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('FIXED', 'RATE')),
  order_index INTEGER NOT NULL,
  base_duration_minutes INTEGER DEFAULT 0,
  rate_per_unit_minutes DECIMAL(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'pcs', -- rim, meter, pcs, etc.
  
  UNIQUE(template_id, order_index),
  CONSTRAINT positive_duration CHECK (base_duration_minutes >= 0),
  CONSTRAINT positive_rate CHECK (rate_per_unit_minutes >= 0)
);

-- =====================================================
-- 5. ADJUSTMENT_REASONS TABLE (Delay/Speedup Reasons)
-- =====================================================
CREATE TABLE adjustment_reasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  default_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT code_format CHECK (code ~ '^[A-Z_]+$')
);

-- =====================================================
-- 6. ORDERS TABLE (Main Orders)
-- =====================================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Order Details
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  value_idr NUMERIC(15,2) NOT NULL CHECK (value_idr >= 0),
  
  -- Process Details
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  template_id UUID REFERENCES templates(id) ON DELETE RESTRICT,
  
  -- Status & Timeline
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  eta_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit Fields
  created_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Business Rule: Only orders >= 10M IDR can be submitted for approval
  CONSTRAINT min_value_for_approval CHECK (
    (status = 'PENDING_APPROVAL' AND value_idr >= 10000000) OR 
    status IN ('DRAFT', 'APPROVED', 'REJECTED')
  )
);

-- =====================================================
-- 7. ORDER_STEPS TABLE (Order Process Steps)
-- =====================================================
CREATE TABLE order_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  template_step_id UUID REFERENCES template_steps(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Snapshot of template data (for historical accuracy)
  name_snapshot TEXT NOT NULL,
  type_snapshot TEXT NOT NULL,
  unit_snapshot TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  
  -- Actual values
  qty NUMERIC(10,2), -- NULL for FIXED type
  duration_minutes NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  UNIQUE(order_id, order_index),
  CONSTRAINT positive_qty CHECK (qty IS NULL OR qty > 0),
  CONSTRAINT positive_duration CHECK (duration_minutes >= 0)
);

-- =====================================================
-- 8. ORDER_ADJUSTMENTS TABLE (Time Adjustments)
-- =====================================================
CREATE TABLE order_adjustments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  reason_id UUID REFERENCES adjustment_reasons(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  
  minutes_delta INTEGER NOT NULL, -- Can be negative (speedup) or positive (delay)
  note TEXT,
  
  CONSTRAINT delta_not_zero CHECK (minutes_delta != 0)
);

-- =====================================================
-- 9. APPROVALS TABLE (Approval History)
-- =====================================================
CREATE TABLE approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REJECTED')),
  note TEXT,
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. PUBLIC_SHARES TABLE (Public Access Links)
-- =====================================================
CREATE TABLE public_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
  
  CONSTRAINT code_length CHECK (char_length(code) >= 8)
);

-- =====================================================
-- 11. AUDIT_LOGS TABLE (System Audit Trail)
-- =====================================================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  
  CONSTRAINT action_not_empty CHECK (char_length(action) > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_category ON orders(category_id);
CREATE INDEX idx_orders_value ON orders(value_idr);
CREATE INDEX idx_order_steps_order_id ON order_steps(order_id);
CREATE INDEX idx_order_adjustments_order_id ON order_adjustments(order_id);
CREATE INDEX idx_public_shares_code ON public_shares(code);
CREATE INDEX idx_audit_logs_order_id ON audit_logs(order_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();