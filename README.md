# Order Management System

A comprehensive order management system built with Next.js, Supabase, and Tailwind CSS, designed specifically for printing and advertising businesses.

## Features

### 🏢 Multi-Role Support
- **Input Staff**: Create and manage their own orders
- **Approval Staff**: Review and approve/reject orders
- **Admin**: Full system access and user management

### 📋 Order Management
- Create orders with detailed specifications
- Template-based process workflows
- Real-time progress tracking
- ETA calculation with automatic adjustments
- Priority levels (Low, Normal, High, Urgent)
- Customer information tracking

### 🔄 Approval Workflow
- Submit orders for approval
- Approval/rejection with comments
- Status tracking throughout the lifecycle
- Audit trail for all changes

### 📊 Dashboard & Analytics
- Role-based dashboard views
- Order statistics and metrics
- Recent order tracking
- Overdue order alerts

### 🔗 Public Sharing
- Generate public links for order status
- Customer-friendly progress tracking
- No authentication required for customers

### 📱 Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interface
- Progressive Web App capabilities

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Heroicons
- **Type Safety**: TypeScript
- **Authentication**: Supabase Auth

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd order-management-system
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/schema.sql`
4. Run the contents of `supabase/seed.sql`

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Deployment

### Deploy to Vercel

1. **Connect Repository**
   - Push your code to GitHub
   - Import project in Vercel dashboard
   - Connect the repository

2. **Environment Variables**
   Add these environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `your-app-name.vercel.app`

## Configuration

### Initial Admin User

After deployment, create an admin user:

1. Sign up for the first account through normal registration
2. In your Supabase dashboard, go to SQL Editor
3. Run this query to make the user an admin:
   ```sql
   UPDATE profiles SET role = 'ADMIN' 
   WHERE email = 'your-admin-email@example.com';
   ```

## Usage Guide

### For Input Staff
1. **Dashboard**: View order statistics and recent orders
2. **Create Order**: Fill in details, select category and template
3. **Submit for Approval**: When ready, submit orders for approval
4. **Track Progress**: Monitor order status and progress

### For Approval Staff
1. **Review Orders**: See orders pending approval
2. **Approve/Reject**: Make approval decisions with comments
3. **Monitor All Orders**: Track all orders in the system

### For Customers (Public Access)
1. **Receive Link**: Get public link from business
2. **Track Progress**: View real-time order status
3. **Check ETA**: See estimated completion date

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard
│   ├── orders/           # Order management
│   ├── login/            # Authentication
│   └── share/            # Public order sharing
├── components/           # Reusable UI components
├── lib/                 # Business logic and actions
├── supabase/           # Database schema and migrations
└── utils/              # Utility functions
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit pull request

## Support

For support and questions:
- Open an issue in the repository
- Check the documentation
- Contact the development team

---

Built with ❤️ using Next.js and Supabase
