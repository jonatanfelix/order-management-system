-- =====================================================
-- Order Management System - Complete Database Setup
-- Run this in your Supabase SQL Editor
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

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert Categories
INSERT INTO categories (name, slug, description) VALUES
('Offset Printing', 'offset-printing', 'Traditional offset printing services including books, brochures, and flyers'),
('Digital Printing', 'digital-printing', 'Quick digital printing for small runs and personalized materials'),
('Large Format', 'large-format', 'Banner, poster, and large format printing services'),
('Packaging', 'packaging', 'Custom packaging and box printing services'),
('Design Services', 'design-services', 'Graphic design and pre-press services'),
('Advertising', 'advertising', 'Marketing materials and promotional products');

-- Insert Templates for Offset Printing
INSERT INTO templates (name, code, category_id, description) VALUES
('Standard Book Printing', 'BOOK_STD', (SELECT id FROM categories WHERE slug = 'offset-printing'), 'Complete book printing process from prepress to binding'),
('Brochure/Flyer Printing', 'BROCHURE_STD', (SELECT id FROM categories WHERE slug = 'offset-printing'), 'Quick turnaround brochure and flyer printing'),
('Business Card Printing', 'BIZCARD_STD', (SELECT id FROM categories WHERE slug = 'offset-printing'), 'High-quality business card printing with various finishes');

-- Insert Templates for Digital Printing
INSERT INTO templates (name, code, category_id, description) VALUES
('Quick Digital Print', 'DIGITAL_QUICK', (SELECT id FROM categories WHERE slug = 'digital-printing'), 'Same-day or next-day digital printing'),
('Personalized Materials', 'DIGITAL_PERSONAL', (SELECT id FROM categories WHERE slug = 'digital-printing'), 'Variable data printing for personalized materials');

-- Insert Templates for Large Format
INSERT INTO templates (name, code, category_id, description) VALUES
('Banner Printing', 'BANNER_STD', (SELECT id FROM categories WHERE slug = 'large-format'), 'Indoor and outdoor banner printing'),
('Poster Printing', 'POSTER_STD', (SELECT id FROM categories WHERE slug = 'large-format'), 'High-quality poster printing in various sizes'),
('Vehicle Wrapping', 'VEHICLE_WRAP', (SELECT id FROM categories WHERE slug = 'large-format'), 'Complete vehicle wrap design and installation');

-- Insert Template Steps for Book Printing
INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, unit) VALUES
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Design Review', 'FIXED', 1, 120, 'job'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Prepress Setup', 'FIXED', 2, 240, 'job'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Proof Creation', 'FIXED', 3, 60, 'job'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Plate Making', 'RATE', 4, 30, 'plates'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Printing', 'RATE', 5, 0, 'pages'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Finishing', 'RATE', 6, 60, 'units'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Binding', 'RATE', 7, 0, 'units'),
((SELECT id FROM templates WHERE code = 'BOOK_STD'), 'Quality Control', 'FIXED', 8, 60, 'job');

-- Set rate values for book printing
UPDATE template_steps SET rate_per_unit_minutes = 10.0 WHERE template_id = (SELECT id FROM templates WHERE code = 'BOOK_STD') AND name = 'Plate Making';
UPDATE template_steps SET rate_per_unit_minutes = 0.5 WHERE template_id = (SELECT id FROM templates WHERE code = 'BOOK_STD') AND name = 'Printing';
UPDATE template_steps SET rate_per_unit_minutes = 2.0 WHERE template_id = (SELECT id FROM templates WHERE code = 'BOOK_STD') AND name = 'Finishing';
UPDATE template_steps SET rate_per_unit_minutes = 3.0 WHERE template_id = (SELECT id FROM templates WHERE code = 'BOOK_STD') AND name = 'Binding';

-- Insert Template Steps for Banner Printing
INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
((SELECT id FROM templates WHERE code = 'BANNER_STD'), 'Design Approval', 'FIXED', 1, 60, 0, 'job'),
((SELECT id FROM templates WHERE code = 'BANNER_STD'), 'Material Preparation', 'FIXED', 2, 30, 0, 'job'),
((SELECT id FROM templates WHERE code = 'BANNER_STD'), 'Printing', 'RATE', 3, 15, 5.0, 'sqm'),
((SELECT id FROM templates WHERE code = 'BANNER_STD'), 'Finishing', 'RATE', 4, 30, 8.0, 'units'),
((SELECT id FROM templates WHERE code = 'BANNER_STD'), 'Quality Check', 'FIXED', 5, 30, 0, 'job');

-- Insert Template Steps for Quick Digital Print
INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
((SELECT id FROM templates WHERE code = 'DIGITAL_QUICK'), 'File Check', 'FIXED', 1, 15, 0, 'job'),
((SELECT id FROM templates WHERE code = 'DIGITAL_QUICK'), 'Digital Printing', 'RATE', 2, 5, 0.2, 'pages'),
((SELECT id FROM templates WHERE code = 'DIGITAL_QUICK'), 'Finishing', 'RATE', 3, 10, 1.5, 'units');

-- Insert Adjustment Reasons
INSERT INTO adjustment_reasons (code, label, default_minutes) VALUES
('PLATE_ERROR', 'Plate misprinted or damaged during printing', 180),
('MACHINE_ERROR', 'Machine malfunction or technical issues', 240),
('CLIENT_REVISION', 'Client requested changes after approval', 120),
('MATERIAL_SHORTAGE', 'Material shortage or quality issues', 360),
('DESIGN_ERROR', 'Design error discovered during production', 150),
('URGENT_REQUEST', 'Client requested expedited processing', -120),
('QUALITY_ISSUE', 'Quality problems requiring rework', 200),
('SUPPLIER_DELAY', 'Supplier delivery delay affecting production', 480),
('WEATHER_DELAY', 'Weather-related delivery or installation delays', 720),
('PROCESS_IMPROVEMENT', 'Process improvement resulting in faster delivery', -90);

-- Enable Row Level Security (RLS)
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

-- Create RLS Policies
-- Allow users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow everyone to view categories and templates (public data)
CREATE POLICY "Everyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view templates" ON templates
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view template steps" ON template_steps
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view adjustment reasons" ON adjustment_reasons
  FOR SELECT USING (true);

-- Orders policies - users can see their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = created_by);

-- Similar policies for related tables
CREATE POLICY "Users can view own order steps" ON order_steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_steps.order_id AND orders.created_by = auth.uid()
  ));

CREATE POLICY "Users can manage own order steps" ON order_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_steps.order_id AND orders.created_by = auth.uid()
  ));

-- Public shares policy - allow access with valid share code
CREATE POLICY "Public access with share code" ON orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public_shares 
    WHERE public_shares.order_id = orders.id 
    AND (public_shares.expires_at IS NULL OR public_shares.expires_at > NOW())
  ));