-- Seed data for Order Management System
-- Run this after setting up the main schema

-- Insert Categories
INSERT INTO categories (name, description, color) VALUES
('Offset Printing', 'Traditional offset printing services including books, brochures, and flyers', '#3B82F6'),
('Digital Printing', 'Quick digital printing for small runs and personalized materials', '#10B981'),
('Large Format', 'Banner, poster, and large format printing services', '#F59E0B'),
('Packaging', 'Custom packaging and box printing services', '#8B5CF6'),
('Design Services', 'Graphic design and pre-press services', '#EF4444'),
('Advertising', 'Marketing materials and promotional products', '#06B6D4');

-- Insert Process Templates for Offset Printing
INSERT INTO process_templates (name, category_id, estimated_duration, description) VALUES
('Standard Book Printing', (SELECT id FROM categories WHERE name = 'Offset Printing'), 7, 'Complete book printing process from prepress to binding'),
('Brochure/Flyer Printing', (SELECT id FROM categories WHERE name = 'Offset Printing'), 3, 'Quick turnaround brochure and flyer printing'),
('Business Card Printing', (SELECT id FROM categories WHERE name = 'Offset Printing'), 2, 'High-quality business card printing with various finishes');

-- Insert Process Templates for Digital Printing
INSERT INTO process_templates (name, category_id, estimated_duration, description) VALUES
('Quick Digital Print', (SELECT id FROM categories WHERE name = 'Digital Printing'), 1, 'Same-day or next-day digital printing'),
('Personalized Materials', (SELECT id FROM categories WHERE name = 'Digital Printing'), 2, 'Variable data printing for personalized materials');

-- Insert Process Templates for Large Format
INSERT INTO process_templates (name, category_id, estimated_duration, description) VALUES
('Banner Printing', (SELECT id FROM categories WHERE name = 'Large Format'), 2, 'Indoor and outdoor banner printing'),
('Poster Printing', (SELECT id FROM categories WHERE name = 'Large Format'), 1, 'High-quality poster printing in various sizes'),
('Vehicle Wrapping', (SELECT id FROM categories WHERE name = 'Large Format'), 5, 'Complete vehicle wrap design and installation');

-- Insert Process Templates for Advertising
INSERT INTO process_templates (name, category_id, estimated_duration, description) VALUES
('Marketing Campaign Materials', (SELECT id FROM categories WHERE name = 'Advertising'), 4, 'Complete marketing materials package'),
('Promotional Products', (SELECT id FROM categories WHERE name = 'Advertising'), 7, 'Custom promotional items and branded merchandise');

-- Insert Template Steps for Book Printing
INSERT INTO process_template_steps (template_id, step_order, name, description, estimated_hours, is_required) VALUES
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 1, 'Design Review', 'Review and approve book design and layout', 2, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 2, 'Prepress Setup', 'Prepare files for printing including color correction', 4, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 3, 'Proof Creation', 'Create digital or physical proof for client approval', 2, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 4, 'Plate Making', 'Create printing plates for offset printing', 3, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 5, 'Printing', 'Run the printing job on offset press', 8, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 6, 'Finishing', 'Cutting, folding, and other finishing processes', 4, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 7, 'Binding', 'Bind the book using specified binding method', 6, true),
((SELECT id FROM process_templates WHERE name = 'Standard Book Printing'), 8, 'Quality Control', 'Final quality check and packaging', 2, true);

-- Insert Template Steps for Banner Printing
INSERT INTO process_template_steps (template_id, step_order, name, description, estimated_hours, is_required) VALUES
((SELECT id FROM process_templates WHERE name = 'Banner Printing'), 1, 'Design Approval', 'Review and approve banner design', 1, true),
((SELECT id FROM process_templates WHERE name = 'Banner Printing'), 2, 'Material Preparation', 'Prepare banner material and ink', 1, true),
((SELECT id FROM process_templates WHERE name = 'Banner Printing'), 3, 'Printing', 'Print banner on large format printer', 2, true),
((SELECT id FROM process_templates WHERE name = 'Banner Printing'), 4, 'Finishing', 'Hemming, grommets, or other finishing', 2, true),
((SELECT id FROM process_templates WHERE name = 'Banner Printing'), 5, 'Quality Check', 'Final inspection and packaging', 1, true);

-- Insert Template Steps for Quick Digital Print
INSERT INTO process_template_steps (template_id, step_order, name, description, estimated_hours, is_required) VALUES
((SELECT id FROM process_templates WHERE name = 'Quick Digital Print'), 1, 'File Check', 'Verify files are print-ready', 0.5, true),
((SELECT id FROM process_templates WHERE name = 'Quick Digital Print'), 2, 'Digital Printing', 'Print on digital press', 1, true),
((SELECT id FROM process_templates WHERE name = 'Quick Digital Print'), 3, 'Finishing', 'Cut, fold, or staple as needed', 0.5, true);

-- Insert Template Steps for Marketing Campaign
INSERT INTO process_template_steps (template_id, step_order, name, description, estimated_hours, is_required) VALUES
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 1, 'Strategy Meeting', 'Discuss campaign goals and requirements', 2, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 2, 'Concept Development', 'Create initial design concepts', 8, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 3, 'Client Review', 'Present concepts for client feedback', 1, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 4, 'Design Refinement', 'Refine chosen concept based on feedback', 6, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 5, 'Final Approval', 'Get final approval from client', 1, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 6, 'Production Setup', 'Prepare files for various print materials', 4, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 7, 'Printing', 'Print all campaign materials', 12, true),
((SELECT id FROM process_templates WHERE name = 'Marketing Campaign Materials'), 8, 'Delivery', 'Package and deliver completed materials', 2, true);

-- Insert Adjustment Reasons
INSERT INTO adjustment_reasons (code, description, impact_type) VALUES
('PLATE_MIRIG', 'Plate misprinted or damaged during printing', 'DELAY'),
('MESIN_ERROR', 'Machine malfunction or technical issues', 'DELAY'),
('CLIENT_REVISI', 'Client requested changes after approval', 'DELAY'),
('BAHAN_HABIS', 'Material shortage or quality issues', 'DELAY'),
('DESIGN_ERROR', 'Design error discovered during production', 'DELAY'),
('URGENT_REQUEST', 'Client requested expedited processing', 'EXPEDITE'),
('QUALITY_ISSUE', 'Quality problems requiring rework', 'DELAY'),
('SUPPLIER_DELAY', 'Supplier delivery delay affecting production', 'DELAY'),
('WEATHER_DELAY', 'Weather-related delivery or installation delays', 'DELAY'),
('EQUIPMENT_UPGRADE', 'Process improvement resulting in faster delivery', 'EXPEDITE');

-- Note: Users (profiles) will be created automatically when they sign up
-- The first user to sign up should be made an ADMIN through the database or a separate admin panel

-- Insert sample audit log entries (these would normally be created by triggers)
-- This is just for reference - the actual audit logs will be created automatically

-- Example of how to update a user to admin role after they sign up:
-- UPDATE profiles SET role = 'ADMIN' WHERE email = 'admin@company.com';

-- Example of how to create a public share for testing:
-- INSERT INTO public_order_shares (order_id, share_code, created_by)
-- VALUES ('order-uuid-here', 'ABC123DEF', 'user-uuid-here');