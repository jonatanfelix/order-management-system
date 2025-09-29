# Deployment Checklist

Follow this checklist to successfully deploy your Order Management System.

## Pre-Deployment Setup

### 1. Supabase Project Setup

- [ ] Create a new Supabase project at [supabase.com](https://supabase.com)
- [ ] Note down your project URL and anon key from Settings > API
- [ ] Get your service role key (keep this secret!)

### 2. Database Schema Setup

- [ ] Go to Supabase Dashboard > SQL Editor
- [ ] Copy and run the contents of `supabase/schema.sql`
- [ ] Copy and run the contents of `supabase/seed.sql`
- [ ] Verify all tables are created in the Table Editor

### 3. Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

- [ ] Replace with your actual Supabase credentials
- [ ] Never commit the service role key to version control

## Local Development

- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run dev` to start development server
- [ ] Visit `http://localhost:3000` to test the application
- [ ] Create a test account and verify functionality

## Production Deployment (Vercel)

### 1. Repository Setup

- [ ] Push your code to GitHub repository
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Commit all changes

### 2. Vercel Deployment

- [ ] Go to [vercel.com](https://vercel.com) and sign in
- [ ] Click "New Project" and import your GitHub repository
- [ ] Add environment variables in Vercel dashboard:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Deploy the project

### 3. Post-Deployment Configuration

- [ ] Visit your deployed application URL
- [ ] Create your first admin account
- [ ] In Supabase SQL Editor, run:
  ```sql
  UPDATE profiles SET role = 'ADMIN' 
  WHERE email = 'your-admin-email@example.com';
  ```
- [ ] Test all functionality:
  - [ ] User registration/login
  - [ ] Order creation
  - [ ] Approval workflow
  - [ ] Public sharing
  - [ ] Dashboard statistics

## Production Checklist

### Security

- [ ] Verify Row Level Security (RLS) is enabled on all tables
- [ ] Test that users can only access their authorized data
- [ ] Ensure admin-only functions require admin role
- [ ] Test public share links work without authentication

### Performance

- [ ] Test application on mobile devices
- [ ] Verify page load times are acceptable
- [ ] Check that all images and assets load correctly
- [ ] Test with multiple concurrent users

### Functionality Testing

- [ ] **Authentication**
  - [ ] User registration
  - [ ] User login/logout
  - [ ] Role-based access control
  
- [ ] **Order Management**
  - [ ] Create new orders
  - [ ] Edit draft orders
  - [ ] Submit for approval
  - [ ] Approve/reject orders
  - [ ] Track progress
  
- [ ] **Public Sharing**
  - [ ] Generate public links
  - [ ] View order status without login
  - [ ] Progress tracking works correctly
  
- [ ] **Dashboard**
  - [ ] Statistics show correctly
  - [ ] Recent orders display
  - [ ] Role-based content visibility

### Data Management

- [ ] Verify seed data is loaded correctly
- [ ] Test with real business categories and templates
- [ ] Ensure ETA calculations work properly
- [ ] Test adjustment functionality

## Custom Configuration

### Business-Specific Setup

- [ ] Update categories in seed data to match your services
- [ ] Create process templates for your workflows
- [ ] Define realistic time estimates for each step
- [ ] Add your company branding/colors
- [ ] Set up email templates (if using Supabase Auth emails)

### User Roles

- [ ] Create admin users as needed
- [ ] Set up approval staff accounts
- [ ] Train input staff on order creation process
- [ ] Document user permissions for each role

## Monitoring and Maintenance

### Ongoing Tasks

- [ ] Monitor database usage in Supabase dashboard
- [ ] Check application performance in Vercel analytics
- [ ] Regular backup of important data
- [ ] Update dependencies as needed
- [ ] Monitor for security updates

### Support Setup

- [ ] Document common user issues and solutions
- [ ] Set up support channels (email, chat, etc.)
- [ ] Create user training materials
- [ ] Establish escalation procedures for technical issues

## Troubleshooting Common Issues

### Database Connection Issues
- Verify environment variables are set correctly
- Check Supabase project status
- Ensure database schema is properly applied

### Authentication Problems
- Check Supabase Auth settings
- Verify email confirmation is working
- Review redirect URLs configuration

### Permission Errors
- Verify user roles in profiles table
- Check RLS policies are working correctly
- Ensure foreign key relationships are proper

### Performance Issues
- Check for slow database queries
- Monitor Vercel function execution times
- Optimize images and static assets

## Success Criteria

Your deployment is successful when:

- [ ] Users can register and login
- [ ] Input staff can create and manage orders
- [ ] Approval staff can review and approve orders
- [ ] Admin users have full system access
- [ ] Public share links work for customers
- [ ] All mobile interfaces are functional
- [ ] Dashboard shows accurate statistics
- [ ] System is secure and performant

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase and Vercel documentation
3. Check the GitHub repository issues
4. Contact the development team

---

**Note**: Keep this checklist handy during deployment and refer back to it for future updates or troubleshooting.