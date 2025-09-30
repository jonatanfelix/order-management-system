# 📋 RPD - Order Management System with Task Builder

**Version**: 2.0  
**Last Updated**: 30 September 2025  
**Status**: In Progress

---

## 🎯 **TUJUAN SISTEM**

Sistem manajemen order yang memungkinkan user untuk:
1. Membuat order dengan task-based workflow
2. Mengelola timeline project dengan visual calendar
3. Melihat progress real-time untuk setiap task
4. Mengelola kategori secara dinamis
5. Guest access untuk monitoring public

---

## 👥 **USER ROLES**

### 1. **MAKER** (Pembuat Order)
- Buat order baru dengan task builder
- Edit task yang sudah dibuat
- Hapus task
- Kelola kategori
- Submit order untuk approval

### 2. **APPROVER** (Approval)
- Review order yang masuk
- Approve/reject order
- Lihat timeline & progress

### 3. **GUEST** (Public View)
- Lihat semua order (read-only)
- Lihat progress task
- Toggle view: Cards / Table
- Tidak bisa edit apapun

---

## ✨ **FITUR UTAMA - TASK BUILDER**

### **A. Form Input Order**
```
┌─────────────────────────────────────┐
│ HEADER SECTION                      │
├─────────────────────────────────────┤
│ • Judul Pesanan    [Text Input]     │
│ • Client           [Text Input]     │
│ • Kategori         [Dynamic Pills]  │
│ • Prioritas        [Dropdown]       │
└─────────────────────────────────────┘
```

**Kategori Manager:**
- Display: Pill/Badge format
- Actions:
  - Click pill → Select kategori
  - Hover pill → Show X button → Delete kategori
  - Click "+ Tambah Kategori" → Inline input muncul
  - Enter/Click ✓ → Save kategori baru ke database
  - Escape/Click X → Cancel

**Behavior:**
- Auto-fetch categories dari database on mount
- Real-time update setelah add/delete
- Visual feedback (selected state)

---

### **B. Task Input Form**

```
┌─────────────────────────────────────────────────┐
│ TASK DETAILS                                    │
├─────────────────────────────────────────────────┤
│ Nama Task*          [Input Text - Required]    │
│ PIC                 [Input Text]                │
│ Kuantitas           [Number - Min: 1]           │
│ Satuan              [Text - Default: "pcs"]     │
│ Durasi (hari kerja) [Number - Min: 1, Max: 999]│
│ Progress (%)        [Slider 0-100]              │
│ Depends On          [Dropdown Task List]        │
│ ☐ Milestone         [Checkbox]                  │
│ Catatan             [Textarea]                  │
│                                                 │
│ [➕ TAMBAH TASK KE DAFTAR]  ← BIG BUTTON       │
└─────────────────────────────────────────────────┘
```

**Validasi:**
- Nama task: Required, min 3 karakter
- Durasi: 1-999 hari (NO HARD LIMIT for special cases)
- Jika milestone → durasi otomatis 0
- Progress: 0-100%

**Behavior:**
- Click "Tambah Task" → Add ke array
- Form auto-reset setelah add
- Validation errors show inline

---

### **C. Task List (Editable)**

```
┌────────────────────────────────────────────────┐
│ DAFTAR TASK (3)                                │
├────────────────────────────────────────────────┤
│ 1. [Nama Task]  PIC: [nama]  [2 hari]  [50%]  │
│    📅 Start: 23 Sep | End: 25 Sep              │
│    [✏️ Edit] [🗑️ Delete]                      │
├────────────────────────────────────────────────┤
│ 2. [Task 2]  PIC: [pic2]  [3 hari]  [0%]      │
│    📅 Start: 26 Sep | End: 28 Sep              │
│    [✏️ Edit] [🗑️ Delete]                      │
└────────────────────────────────────────────────┘
```

**Edit Mode:**
- Click "Edit" → Expand inline form di bawah task
- Form pre-filled dengan data task
- Actions: [💾 Save Changes] [❌ Cancel]
- Save → Update array, recalculate dates
- Cancel → Collapse form

**Delete:**
- Click Delete → Confirm dialog
- Remove dari array
- Update dependency tasks (jika ada)

---

### **D. Timeline Preview - GOOGLE CALENDAR STYLE**

**Format:** FULL CALENDAR MONTH VIEW (bukan bar chart!)

```
┌─────────────────────────────────────────────────────────────────────┐
│              SEPTEMBER 2025                     [◀ Bulan Ini ▶]     │
├─────────────────────────────────────────────────────────────────────┤
│  Min  Sen  Sel  Rab  Kam  Jum  Sab                                  │
├─────────────────────────────────────────────────────────────────────┤
│   -    1    2    3    4    5    6                                   │
│   7    8    9   10   11   12   13                                   │
│  14   15   16   17   18   19   20                                   │
│  21   22   23   24   25   26   27                                   │
│  28   29  [30]  -    -    -    -                                    │
└─────────────────────────────────────────────────────────────────────┘
           ☝️ Hari ini (highlight)

TASK BARS OVERLAY:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Beli Barang    [██████████░░░░░░] 50% (23-25 Sep)               │
│ 2. Potong Bahan   [░░░░░░░░░░░░░░░░] 0%  (26-28 Sep)               │
└─────────────────────────────────────────────────────────────────────┘

Legend:
🟥 Tanggal Merah (Minggu/Libur)
🟦 Hari Ini
⬜ Tanggal Normal
🟨 Task Milestone
```

**Features:**
- Month view dengan date grid
- Task overlay dengan color bars
- Hover task → Show details tooltip
- Click date → Quick add task (future enhancement)
- Legend untuk status colors

**Implementation:**
- Use FullCalendar.js atau react-big-calendar
- Custom render untuk task bars
- Responsive layout

---

### **E. Save & Submit**

```
┌─────────────────────────────────────┐
│ [Batal]  [💾 Simpan Pesanan]        │
└─────────────────────────────────────┘
```

**Validation before save:**
- ✓ Judul order filled
- ✓ Minimal 1 task
- ✓ Semua task valid (nama, durasi)

**Save Flow:**
1. Validate form
2. Show loading spinner
3. POST to `/api/orders/task-based`
4. Handle response:
   - Success → Redirect ke `/orders` dengan toast success
   - Error → Show error alert dengan detail
5. No silent failures!

**Error Handling:**
```javascript
if (error) {
  alert(`❌ Gagal menyimpan: ${error.message}\n\nDetail: ${error.details}`)
  console.error('Full error:', error)
}
```

---

## 🎨 **UI/UX REQUIREMENTS**

### **1. Category Manager**
- **Visual**: Pills dengan hover state
- **Add New**: Inline input dengan auto-focus
- **Delete**: Hover X button (confirm dialog)
- **Feedback**: Loading state saat save/delete

### **2. Task Builder**
- **Big Button**: "Tambah Task" harus prominent (gradient, icon)
- **Inline Validation**: Error messages di bawah input
- **Loading States**: Spinner saat async operations

### **3. Timeline Calendar**
- **Full Calendar**: Bukan bar chart, tapi calendar penuh
- **Responsive**: Mobile-friendly grid
- **Interactive**: Hover tooltips, click events

### **4. Guest Mode**
- **Cards View**: Default, visual dengan preview
- **Table View**: Dense, data-heavy
- **Toggle**: Smooth transition
- **Modal Detail**: Click card → Full details

---

## 🔧 **TECHNICAL SPECS**

### **Frontend Stack**
- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui components
- FullCalendar.js (untuk calendar)

### **Backend**
- Next.js API Routes
- Supabase (PostgreSQL)
- Server Actions

### **Database Schema**

**orders table:**
```sql
- id (uuid)
- title (text)
- client_name (text)
- category_id (uuid) → categories.id
- status (enum)
- value_idr (numeric)
- is_task_based (boolean)
- total_duration_days (integer)
- estimated_start_date (date)
- estimated_end_date (date)
- created_by (uuid)
- created_at (timestamp)
```

**order_tasks table:**
```sql
- id (uuid)
- order_id (uuid) → orders.id
- name (text)
- pic (text)
- quantity (numeric)
- unit (text)
- start_date (date)
- end_date (date)
- duration_days (integer)
- progress (integer 0-100)
- is_milestone (boolean)
- task_order (integer)
- depends_on_tasks (uuid[])
- notes (text)
```

**categories table:**
```sql
- id (uuid)
- name (text UNIQUE)
- created_at (timestamp)
```

---

## 🐛 **BUG FIXES NEEDED**

### **CRITICAL**

1. **Save Order Tidak Jalan**
   - Debug: Console errors?
   - Check: API response
   - Fix: Error handling + validation

2. **Kategori Button Tidak Respon**
   - Issue: onClick handler tidak trigger
   - Fix: Check event handlers, z-index
   - Add: Visual feedback (ripple, loading)

3. **Timeline Bukan Calendar**
   - Current: Bar chart
   - Required: Google Calendar month view
   - Action: Implement FullCalendar.js

4. **Task Tidak Bisa Edit**
   - Missing: Edit functionality
   - Add: Inline edit form
   - Add: Save/Cancel buttons

### **MEDIUM**

5. **Durasi Terbatas**
   - Remove: Max limit check
   - Allow: 1-999+ days
   - Validation: Only check minimum

---

## 📦 **DELIVERABLES**

### **Phase 1: Bug Fixes (Current)**
- [ ] Fix save order functionality
- [ ] Fix kategori button interactions
- [ ] Remove durasi limitations
- [ ] Add proper error messages

### **Phase 2: Enhanced Calendar**
- [ ] Implement FullCalendar.js
- [ ] Month view dengan date grid
- [ ] Task bars overlay
- [ ] Responsive mobile view

### **Phase 3: Edit Features**
- [ ] Inline task editing
- [ ] Drag-and-drop reorder
- [ ] Bulk operations

### **Phase 4: Polish**
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Help tooltips

---

## 🧪 **TESTING CHECKLIST**

### **Task Builder**
- [ ] Add task → Appears in list
- [ ] Edit task → Changes saved
- [ ] Delete task → Removed from list
- [ ] Save order → Success redirect
- [ ] Error handling → Clear messages

### **Category Manager**
- [ ] Add category → Appears in pills
- [ ] Delete category → Removed from list
- [ ] Select category → Visual feedback
- [ ] Categories persist → Database saved

### **Timeline**
- [ ] Shows correct dates
- [ ] Sunday highlighted red
- [ ] Today marker visible
- [ ] Task bars positioned correctly
- [ ] Mobile responsive

### **Guest Mode**
- [ ] Cards view loads
- [ ] Table toggle works
- [ ] Modal opens on click
- [ ] Data displays correctly

---

## 🚀 **DEPLOYMENT**

**Environment:** Vercel Production  
**Database:** Supabase Cloud  
**Domain:** warp-supabase-test-*.vercel.app

**Pre-deployment Checklist:**
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console errors
- [ ] Performance optimized
- [ ] Database migrations run

---

## 📞 **SUPPORT & ISSUES**

**Known Issues:**
1. Save button tidak jalan → FIX IN PROGRESS
2. Kategori button tidak respon → FIX IN PROGRESS
3. Timeline bukan calendar → WILL IMPLEMENT

**Contact:** jonatan@example.com

---

**Last Review:** 30 Sep 2025  
**Next Review:** After Phase 1 completion