# Vercel Deployment Configuration

## Project Settings

### 1. Root Directory
```
my-app
```
⚠️ **IMPORTANT**: Set root directory to `my-app` (not the parent folder)

### 2. Framework Preset
```
Next.js
```

### 3. Build Configuration
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 4. Node.js Version
```
18.x or 20.x
```

## Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: API Base URL (if using external API)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `my-app`
   - **Framework**: Next.js (auto-detected)
5. Add environment variables (see above)
6. Click **"Deploy"**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from my-app directory
cd my-app
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? (default or custom)
# - Directory? ./ (current directory)

# Production deployment
vercel --prod
```

## Post-Deployment Checklist

- [ ] Verify deployment URL is accessible
- [ ] Test authentication (login/logout)
- [ ] Test guest dashboard
- [ ] Test order creation and viewing
- [ ] Test Google Calendar Timeline
- [ ] Check browser console for errors
- [ ] Verify all environment variables are set correctly

## Troubleshooting

### Build Errors

**Error**: Module not found
```bash
# Solution: Clear build cache and reinstall
vercel --force
```

**Error**: Environment variables not found
```bash
# Solution: Add in Vercel Dashboard → Settings → Environment Variables
# Then redeploy
```

### Runtime Errors

**Error**: Supabase connection failed
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project is active

**Error**: 404 on dynamic routes
- Verify all `[id]` folders have `page.tsx` files
- Check Next.js routing structure

### Performance Issues

- Enable Edge Runtime for faster response (optional)
- Configure ISR (Incremental Static Regeneration) if needed
- Use Vercel Analytics to monitor performance

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for DNS propagation (5-60 minutes)

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` or `master` branch
- **Preview**: Pushes to other branches or pull requests

To disable auto-deploy:
- Go to Vercel Dashboard → Settings → Git
- Configure branch deployment settings

## Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase with Vercel](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)