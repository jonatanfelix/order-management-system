# 🔐 Demo Credentials

Aplikasi Order Management System sudah dilengkapi dengan 3 akun demo yang bisa digunakan untuk testing semua fitur.

## 👨‍💼 Admin Account
- **Email**: `admin@demo.com`
- **Password**: `admin123`
- **Role**: `ADMIN`
- **Akses**: Semua fitur termasuk manajemen user, approval, dan sistem audit

## 📝 Input Account  
- **Email**: `input@demo.com`
- **Password**: `input`
- **Role**: `INPUTER`
- **Akses**: Membuat dan mengedit order, tracking progress

## ✅ Approval Account
- **Email**: `approval@demo.com` 
- **Password**: `approval`
- **Role**: `APPROVER`
- **Akses**: Review dan approval order ≥ 10 juta IDR

## 🚀 URL Aplikasi

**Production**: https://warp-supabase-test-92kc5btic-jonatanfelixs-projects.vercel.app

## 🎯 Testing Flow

1. **Login sebagai Input** → Buat order baru
2. **Login sebagai Admin/Approver** → Approve order yang nilainya ≥ 10 juta IDR  
3. **Test Public Share** → Generate link sharing untuk client
4. **Login sebagai Admin** → Lihat audit trail dan manage system

## 📊 Sample Data

Database sudah berisi:
- ✅ 6 Kategori printing (Offset, Digital, Large Format, dll)
- ✅ 8 Template proses dengan step-step detail
- ✅ 10 Jenis adjustment reasons
- ✅ User profiles dengan roles yang berbeda

## 🛠 Development

Untuk create akun demo lagi atau reset:
```bash
node scripts/create-demo-users.js
```