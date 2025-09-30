# 🗄️ Database Setup Instructions

## ⚠️ IMPORTANT: Migration Belum Dijalankan!

Error `Could not find the 'is_task_based' column of 'orders'` terjadi karena migration belum dijalankan di Supabase production.

## 🚀 Cara Menjalankan Migration:

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. **Buka Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Pilih project Anda

2. **Masuk ke SQL Editor**
   - Klik "SQL Editor" di sidebar kiri
   - Klik "New Query"

3. **Copy SQL Migration**
   - Buka file: `supabase/migrations/006_task_based_orders.sql`
   - Copy SEMUA isi file
   - Paste ke SQL Editor

4. **Run Migration**
   - Klik "Run" atau tekan Ctrl+Enter
   - Tunggu sampai selesai (biasanya < 5 detik)
   - Check for success message

5. **Verify**
   - Go to "Table Editor"
   - Pilih table "orders"
   - Pastikan kolom ini ada:
     - `is_task_based` (boolean)
     - `total_duration_days` (integer)
     - `estimated_start_date` (date)
     - `estimated_end_date` (date)
   - Check table "order_tasks" sudah ada

### Option 2: Via Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Or run specific migration
supabase db execute -f supabase/migrations/006_task_based_orders.sql
```

## 📋 What This Migration Does:

### 1. Creates `order_tasks` Table
- Stores individual tasks for each order
- Includes start/end dates, duration, progress
- Support for dependencies and milestones
- PIC (Person in Charge) assignment

### 2. Extends `orders` Table
- `is_task_based`: Flag untuk task-based orders
- `total_duration_days`: Total durasi dari semua tasks
- `estimated_start_date`: Tanggal mulai estimasi
- `estimated_end_date`: Tanggal selesai estimasi

### 3. Creates Triggers & Functions
- Auto-calculate order timeline dari tasks
- Auto-update timestamps
- RPC functions untuk bulk operations

## ✅ After Migration:

1. Test create order di app
2. Verify data masuk ke database
3. Check Gantt chart berfungsi
4. Test edit dan delete tasks

## 🐛 Troubleshooting:

### Error: "relation already exists"
- Migration sudah pernah dijalankan
- Skip atau drop table dulu

### Error: "permission denied"
- Login dengan account yang benar
- Pastikan punya admin access

### Error: "function does not exist"
- Check prerequisite migrations sudah dijalankan
- Run migrations 001-005 dulu

## 📞 Need Help?

Jika masih ada masalah:
1. Check Supabase logs di Dashboard
2. Verify connection string di `.env.local`
3. Test dengan Supabase REST API dulu