-- =====================================================
-- Script untuk membuat akun demo
-- Jalankan script ini di Supabase SQL Editor setelah setup database
-- =====================================================

-- NOTE: User signup harus dilakukan melalui aplikasi terlebih dahulu
-- karena Supabase Auth mengelola tabel auth.users
-- Script ini hanya untuk update role setelah signup

-- Setelah signup dengan aplikasi, jalankan query berikut untuk set role:

-- 1. ADMIN USER (signup dengan email: admin@demo.com, password: admin123)
-- UPDATE profiles SET 
--   role = 'ADMIN', 
--   name = 'Admin User'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@demo.com'
-- );

-- 2. INPUT USER (signup dengan email: input@demo.com, password: input)  
-- UPDATE profiles SET 
--   role = 'INPUTER', 
--   name = 'Input User'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'input@demo.com'
-- );

-- 3. APPROVAL USER (signup dengan email: approval@demo.com, password: approval)
-- UPDATE profiles SET 
--   role = 'APPROVER', 
--   name = 'Approval User'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'approval@demo.com'
-- );

-- Query untuk cek semua user dan role mereka:
-- SELECT 
--   au.email,
--   p.name,
--   p.role,
--   p.created_at
-- FROM auth.users au
-- LEFT JOIN profiles p ON au.id = p.id
-- ORDER BY p.created_at DESC;