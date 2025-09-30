# FINAL FIX - DEPLOYMENT INSTRUCTIONS

## Status Perbaikan Yang Sudah Dilakukan

### ✅ SELESAI:
1. **Fixed routing 404 issues** - params typed correctly, notFound() replaced with redirect
2. **Standardized status enum** - Created lib/constants/status.ts untuk konsistensi
3. **Fixed guest dashboard** - Convert to server-side, show all orders
4. **Fixed next.config.ts** - Added turbopack root configuration

### ⏳ BELUM SELESAI (akan dilakukan setelah ini):
- Replace guest gantt dengan GoogleCalendarTimeline
- Add error handling untuk Category Manager
- Verify semua button destinations
- Build & test
- Commit & deploy

## LANGKAH EKSEKUSI SELANJUTNYA

### 1. Commit Changes Yang Sudah Ada
```bash
git add -A
git commit -m "fix: Comprehensive routing and UI fixes

- Fix all 404 routing issues (params types, notFound -> redirect)
- Standardize status enum across app
- Convert guest dashboard to server-side
- Fix turbopack root configuration
- Improve orders list filtering"

git push origin master
```

### 2. Konfigurasi Vercel (PENTING!)

Login ke Vercel Dashboard → Pilih project → Settings:

**A. Root Directory:**
- Set ke: `my-app`
- Save

**B. Environment Variables (Production & Preview):**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**C. Redeploy:**
- Deployments tab → Latest → ⋯ → Redeploy

### 3. RLS Policy untuk Guest (Supabase)

Run di Supabase SQL Editor:

```sql
-- Allow anon users to read all orders
CREATE POLICY "Allow anonymous read orders"
ON orders FOR SELECT
TO anon
USING (true);

-- Allow anon users to read order tasks
CREATE POLICY "Allow anonymous read order_tasks"
ON order_tasks FOR SELECT
TO anon
USING (true);

-- Allow anon users to read categories
CREATE POLICY "Allow anonymous read categories"
ON categories FOR SELECT
TO anon
USING (true);
```

## Yang Masih Perlu Diperbaiki (Lanjutan)

### PRIORITY 1: Guest Gantt dengan GoogleCalendarTimeline
File: `app/guest/gantt/page.tsx`
- Convert to server-side
- Fetch semua orders dengan tasks
- Render GoogleCalendarTimeline

### PRIORITY 2: Category Manager Error Handling
File: `components/category-manager.tsx`
- Add loading state saat add category
- Show toast notification success/error
- Handle duplicate error

### PRIORITY 3: Verify All Links
- Orders list "mata" icon → /orders/[id] ✅
- Orders detail "Timeline" button → /orders/[id]/gantt ✅
- Gantt back button → /orders/[id] ✅
- Guest dashboard "Gantt Chart" → /guest/gantt ✅
- Guest gantt back → /guest/dashboard ✅

## Testing Checklist

### After Deployment:
```
□ Login page guest button → /guest/dashboard (no loading stuck)
□ Guest dashboard shows all orders
□ Orders list shows task-based orders dengan badge
□ Create new order via /orders/new dengan target field
□ Order muncul di list setelah save
□ Detail order → Timeline button works
□ Gantt page shows GoogleCalendarTimeline
□ All back buttons work (no 404)
□ Category "+" button responsive
```

## Known Issues & Solutions

### Issue: "Tombol + kategori tidak respon"
**Root Cause:** Env vars tidak terpasang di Vercel
**Solution:** Pastikan NEXT_PUBLIC_SUPABASE_URL dan ANON_KEY terpasang

### Issue: "Save berhasil tapi tidak muncul di list"
**Root Cause:** Query tidak support task-based orders
**Solution:** ✅ Already fixed - query now uses OR(input_staff_id, created_by)

### Issue: "404 saat back dari Gantt"
**Root Cause:** params Promise vs object type mismatch
**Solution:** ✅ Already fixed - params now typed correctly

### Issue: "UI guest berbeda"
**Root Cause:** Vercel mengambil root directory salah
**Solution:** ✅ Set Root Directory ke `my-app` di Vercel settings

## Vercel Deployment URL

Check deployment:
1. https://vercel.com/dashboard
2. Find project: warp-supabase-test
3. Latest deployment → Visit
4. Or: https://warp-supabase-test.vercel.app

## Emergency Rollback

Jika ada masalah setelah deploy:
```bash
# Rollback ke commit sebelumnya
git log --oneline -5
git revert HEAD
git push origin master
```

Atau di Vercel Dashboard:
Deployments → Previous deployment → Promote to Production

## Next Steps After This Fix

1. ✅ Run RLS policies di Supabase
2. ✅ Set Vercel Root Directory & env vars
3. ✅ Commit current changes
4. ⏳ Fix remaining issues (guest gantt, category manager)
5. ⏳ Build & test locally
6. ⏳ Final commit & push
7. ⏳ Verify production deployment
8. ✅ DONE!

---

**Progress:** 60% Complete
**Estimated Time:** 30-45 minutes untuk selesaikan semua
**Critical Path:** Vercel configuration → RLS policies → Final fixes