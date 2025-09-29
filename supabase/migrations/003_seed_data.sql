-- =====================================================
-- Seed Data for Order Management System
-- =====================================================

-- =====================================================
-- 1. CATEGORIES
-- =====================================================
INSERT INTO categories (id, name, slug, description) VALUES
  (uuid_generate_v4(), 'Offset Printing', 'offset', 'Percetakan offset untuk volume besar'),
  (uuid_generate_v4(), 'Advertising', 'advertising', 'Produk iklan seperti banner, stiker, neonbox'),
  (uuid_generate_v4(), 'Desain Grafis', 'desain', 'Layanan desain baju, banner, kemasan'),
  (uuid_generate_v4(), 'Konveksi', 'konveksi', 'Produksi pakaian dan tekstil');

-- =====================================================
-- 2. TEMPLATES - OFFSET PRINTING
-- =====================================================
DO $$
DECLARE
  offset_category_id UUID;
  gto52_template_id UUID;
BEGIN
  -- Get offset category ID
  SELECT id INTO offset_category_id FROM categories WHERE slug = 'offset';
  
  -- Create GTO52 4W/1W template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), offset_category_id, 'GTO52_4W1W', 'GTO52 4W/1W', 'Mesin offset GTO52 4 warna 1 sisi')
  RETURNING id INTO gto52_template_id;
  
  -- Add steps for GTO52
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (gto52_template_id, 'Prepress & Plate Making', 'FIXED', 1, 120, 0, 'pcs'),
    (gto52_template_id, 'Setup Mesin', 'FIXED', 2, 60, 0, 'pcs'),
    (gto52_template_id, 'Printing Process', 'RATE', 3, 0, 5.0, 'rim'),
    (gto52_template_id, 'Cutting & Finishing', 'FIXED', 4, 45, 0, 'pcs'),
    (gto52_template_id, 'Quality Check & Packing', 'FIXED', 5, 30, 0, 'pcs');
END $$;

-- =====================================================
-- 3. TEMPLATES - ADVERTISING  
-- =====================================================
DO $$
DECLARE
  advertising_category_id UUID;
  banner_template_id UUID;
  stiker_template_id UUID;
  neonbox_template_id UUID;
BEGIN
  -- Get advertising category ID
  SELECT id INTO advertising_category_id FROM categories WHERE slug = 'advertising';
  
  -- Banner 440gr Template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), advertising_category_id, 'BANNER_440', 'Banner 440gr', 'Banner outdoor 440gr + finishing')
  RETURNING id INTO banner_template_id;
  
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (banner_template_id, 'Design Approval', 'FIXED', 1, 60, 0, 'pcs'),
    (banner_template_id, 'Large Format Printing', 'RATE', 2, 0, 2.5, 'meter'),
    (banner_template_id, 'Laminating & Finishing', 'FIXED', 3, 30, 0, 'pcs'),
    (banner_template_id, 'Cutting & Eyelet', 'FIXED', 4, 45, 0, 'pcs');
  
  -- Stiker UV Template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), advertising_category_id, 'STIKER_UV', 'Stiker UV Outdoor', 'Stiker vinyl UV resistant + cutting')
  RETURNING id INTO stiker_template_id;
  
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (stiker_template_id, 'File Preparation', 'FIXED', 1, 30, 0, 'pcs'),
    (stiker_template_id, 'UV Printing', 'RATE', 2, 0, 1.8, 'meter'),
    (stiker_template_id, 'Cutting & Weeding', 'RATE', 3, 0, 3.2, 'meter'),
    (stiker_template_id, 'Application Tape', 'FIXED', 4, 20, 0, 'pcs');
    
  -- Neonbox Template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), advertising_category_id, 'NEONBOX', 'Neonbox LED', 'Neonbox LED + pemasangan')
  RETURNING id INTO neonbox_template_id;
  
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (neonbox_template_id, 'Survey & Measurement', 'FIXED', 1, 120, 0, 'pcs'),
    (neonbox_template_id, 'Frame Manufacturing', 'RATE', 2, 0, 45.0, 'meter'),
    (neonbox_template_id, 'Acrylic Cutting & Print', 'FIXED', 3, 180, 0, 'pcs'),
    (neonbox_template_id, 'LED Installation', 'FIXED', 4, 90, 0, 'pcs'),
    (neonbox_template_id, 'Site Installation', 'FIXED', 5, 240, 0, 'pcs');
END $$;

-- =====================================================
-- 4. TEMPLATES - DESAIN GRAFIS
-- =====================================================
DO $$
DECLARE
  desain_category_id UUID;
  baju_template_id UUID;
  kemasan_template_id UUID;
BEGIN
  -- Get design category ID
  SELECT id INTO desain_category_id FROM categories WHERE slug = 'desain';
  
  -- Desain Baju Template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), desain_category_id, 'DESAIN_BAJU', 'Desain Baju Custom', 'Desain kaos/kemeja custom + revisi')
  RETURNING id INTO baju_template_id;
  
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (baju_template_id, 'Brief & Konsep', 'FIXED', 1, 60, 0, 'pcs'),
    (baju_template_id, 'Sketsa & Layout', 'RATE', 2, 0, 90.0, 'desain'),
    (baju_template_id, 'Revisi Client', 'FIXED', 3, 45, 0, 'pcs'),
    (baju_template_id, 'Finalisasi File', 'FIXED', 4, 30, 0, 'pcs');
    
  -- Desain Kemasan Template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), desain_category_id, 'DESAIN_KEMASAN', 'Desain Kemasan Produk', 'Desain box/kemasan + die cut')
  RETURNING id INTO kemasan_template_id;
  
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (kemasan_template_id, 'Research & Brief', 'FIXED', 1, 120, 0, 'pcs'),
    (kemasan_template_id, 'Konsep & Mockup', 'RATE', 2, 0, 180.0, 'varian'),
    (kemasan_template_id, 'Die Cut Design', 'FIXED', 3, 90, 0, 'pcs'),
    (kemasan_template_id, 'Prototype & Test', 'FIXED', 4, 240, 0, 'pcs');
END $$;

-- =====================================================
-- 5. TEMPLATES - KONVEKSI
-- =====================================================
DO $$
DECLARE
  konveksi_category_id UUID;
  kaos_template_id UUID;
BEGIN
  -- Get konveksi category ID
  SELECT id INTO konveksi_category_id FROM categories WHERE slug = 'konveksi';
  
  -- Produksi Kaos Template
  INSERT INTO templates (id, category_id, code, name, description)
  VALUES (uuid_generate_v4(), konveksi_category_id, 'KAOS_SABLON', 'Kaos Sablon Custom', 'Produksi kaos dengan sablon manual')
  RETURNING id INTO kaos_template_id;
  
  INSERT INTO template_steps (template_id, name, type, order_index, base_duration_minutes, rate_per_unit_minutes, unit) VALUES
    (kaos_template_id, 'Pattern & Cutting', 'RATE', 1, 0, 2.5, 'pcs'),
    (kaos_template_id, 'Sewing Process', 'RATE', 2, 0, 8.0, 'pcs'),
    (kaos_template_id, 'Screen Preparation', 'FIXED', 3, 90, 0, 'pcs'),
    (kaos_template_id, 'Sablon Process', 'RATE', 4, 0, 3.0, 'pcs'),
    (kaos_template_id, 'Quality Control', 'FIXED', 5, 60, 0, 'pcs'),
    (kaos_template_id, 'Packaging', 'RATE', 6, 0, 0.5, 'pcs');
END $$;

-- =====================================================
-- 6. ADJUSTMENT REASONS
-- =====================================================
INSERT INTO adjustment_reasons (code, label, default_minutes) VALUES
  ('PLATE_MIRING', 'Plate Miring - Perlu Setting Ulang', 45),
  ('MESIN_ERROR', 'Kerusakan Mesin', 120),
  ('HABIS_TINTA', 'Kehabisan Tinta/Material', 30),
  ('REVISI_CLIENT', 'Revisi dari Client', 60),
  ('CUACA_BURUK', 'Cuaca Buruk (Instalasi Outdoor)', 180),
  ('MATERIAL_TELAT', 'Material Terlambat Datang', 240),
  ('LISTRIK_MATI', 'Pemadaman Listrik', 90),
  ('OPERATOR_SICK', 'Operator Sakit/Tidak Masuk', 480),
  ('RUSH_ORDER', 'Rush Order - Kerja Lembur', -60),
  ('MESIN_UPGRADE', 'Upgrade Mesin - Lebih Cepat', -30);

-- =====================================================
-- 7. SAMPLE ADMIN USER (Optional - for testing)
-- =====================================================
-- Note: This will be created through auth signup in practice
-- We'll handle this via the application interface