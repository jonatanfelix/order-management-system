# Manual Deployment Guide - Order Management System

## 🚀 Deployment Steps

### 1. Database Setup (Supabase)

Dengan environment variables yang sudah ada:
- `NEXT_PUBLIC_SUPABASE_URL=https://xjiwnmnccjlhrkgtaflk.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### A. Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Navigate to your project: `xjiwnmnccjlhrkgtaflk`

#### B. Run Database Schema
1. Go to **SQL Editor** in the dashboard
2. Copy and paste the contents from `supabase/schema.sql`
3. Execute the query to create all tables and functions
4. Copy and paste the contents from `supabase/seed.sql`
5. Execute the query to populate initial data

### 2. Deploy to Vercel

#### A. Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Order Management System"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/order-management-system.git
git branch -M main
git push -u origin main
```

#### B. Deploy with Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL=https://xjiwnmnccjlhrkgtaflk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaXdubW5jY2psaHJrZ3RhZmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTkxNDEsImV4cCI6MjA3NDY5NTE0MX0.Fy4VMXzPQuaxU9SX5PTyyXgfNRPaOroQzt-PXkU1IF4`
   - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaXdubW5jY2psaHJrZ3RhZmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTExOTE0MSwiZXhwIjoyMDc0Njk1MTQxfQ.-djsdrpy6NeOdqnbIHQqH5VuWklm56DGpZoxj0yRKbg`
6. Click "Deploy"

### 3. Post-Deployment Configuration

#### A. Create Admin User
1. Once deployed, visit your application
2. Register a new account (this will be your admin user)
3. Go back to Supabase SQL Editor
4. Run this query to make the user admin:
```sql
UPDATE profiles SET role = 'ADMIN' 
WHERE email = 'your-admin-email@example.com';
```

### 4. Testing Checklist

#### ✅ Authentication
- [ ] User registration works
- [ ] User login/logout works
- [ ] Role-based redirect works

#### ✅ Order Management
- [ ] Can create new orders
- [ ] Can view order list
- [ ] Can view order details
- [ ] Template-based order creation works

#### ✅ Approval Workflow
- [ ] Can submit order for approval
- [ ] Approval staff can approve/reject orders
- [ ] Status changes correctly

#### ✅ Public Sharing
- [ ] Can generate public share links
- [ ] Public pages work without authentication
- [ ] Progress tracking visible

#### ✅ Mobile Responsiveness
- [ ] Dashboard works on mobile
- [ ] Forms are mobile-friendly
- [ ] Navigation works on small screens

## 🔧 Manual Testing Script

### Test Scenario 1: Complete Order Flow
1. Register as INPUT_STAFF
2. Create a new order with template
3. Submit for approval
4. Create admin user in database
5. Login as admin
6. Approve the order
7. Generate public share link
8. Test public share page

### Test Scenario 2: Role-Based Access
1. Test INPUT_STAFF can only see own orders
2. Test APPROVAL_STAFF can see pending orders
3. Test ADMIN can see all orders

### Test Scenario 3: Public Share
1. Create an order
2. Generate public share
3. Test public URL in incognito mode
4. Verify progress tracking works

## 📊 Expected Results

After successful deployment, you should have:

1. **Production URL**: `https://your-app-name.vercel.app`
2. **Functional Authentication** with role-based access
3. **Complete Order Management System** with:
   - Order creation with templates
   - Progress tracking
   - Approval workflows
   - Public customer access
4. **Mobile-responsive UI** with Indonesian language
5. **Real-time data** through Supabase

## 🐛 Common Issues & Solutions

### Database Connection
- Verify environment variables are correct
- Check Supabase project status
- Ensure RLS policies are enabled

### Authentication Issues
- Check Supabase Auth settings
- Verify redirect URLs in Supabase dashboard
- Test email confirmation settings

### Build/Deploy Issues
- Run `npm run build` locally to test
- Check Vercel build logs
- Verify all dependencies are installed

## 🎯 Next Steps

After successful deployment:
1. **Customize** categories and templates for your business
2. **Train users** on the system workflow
3. **Monitor** system performance and usage
4. **Backup** database regularly
5. **Update** system as needed

---

**Status**: Ready for production deployment! 🚀