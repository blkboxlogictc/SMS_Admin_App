# Stuart Main Street Admin Hub - Deployment Guide

## 🚀 Recommended Deployment: Vercel

Your application is perfectly set up for Vercel deployment with Supabase as your backend.

### Prerequisites

- GitHub repository with your code
- Vercel account (free tier available)
- Supabase project (already configured)

## 📋 Deployment Steps

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set up project settings
# - Deploy
```

#### Option B: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings (see below)

### 3. Environment Variables Setup

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```env
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

### 4. Build Settings (Auto-configured via vercel.json)

- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

## 🔧 Alternative Deployment Options

### Option 2: Railway (Full-Stack Platform)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Pros:**

- Handles both frontend and backend
- Built-in database options
- Simple environment variable management

### Option 3: Netlify + Render

**Frontend (Netlify):**

- Deploy React app to Netlify
- Build command: `npm run build`
- Publish directory: `dist/public`

**Backend (Render):**

- Deploy Express server to Render
- Start command: `npm start`

### Option 4: DigitalOcean App Platform

- Full-stack deployment
- Auto-scaling
- Integrated with GitHub

## 🛠️ Production Optimizations

### 1. Environment-Specific Configurations

Your app already handles this with `NODE_ENV=production`

### 2. Database Considerations

- ✅ Already using Supabase (production-ready)
- ✅ Connection pooling configured
- ✅ SSL enabled

### 3. Security Checklist

- ✅ Environment variables secured
- ✅ JWT authentication implemented
- ✅ CORS configured
- ✅ Supabase RLS policies

### 4. Performance Optimizations

- ✅ Vite build optimization
- ✅ React Query for caching
- ✅ Code splitting with React Router

## 📊 Monitoring & Analytics

### Recommended Tools:

1. **Vercel Analytics** (built-in)
2. **Supabase Dashboard** (database monitoring)
3. **Sentry** (error tracking)
4. **LogRocket** (user session recording)

## 🔄 CI/CD Pipeline

### Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```bash
git push origin main  # Triggers automatic deployment
```

### Preview Deployments

Every pull request gets a preview URL for testing.

## 🌐 Custom Domain Setup

1. In Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

## 📱 Mobile Considerations

Your app is already responsive, but consider:

- PWA configuration for mobile app-like experience
- Push notifications via Supabase
- Offline functionality with service workers

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**

   ```bash
   # Check build locally
   npm run build
   ```

2. **Environment Variables**

   - Ensure all required vars are set in Vercel
   - Check variable names match exactly

3. **API Routes Not Working**

   - Verify `vercel.json` configuration
   - Check function timeout limits

4. **Database Connection Issues**
   - Verify Supabase connection string
   - Check IP allowlisting in Supabase

### Support Resources:

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project GitHub Issues](your-repo-url)

## 📈 Scaling Considerations

### When to Scale:

- **Vercel Pro**: More bandwidth, faster builds
- **Supabase Pro**: More database connections, storage
- **CDN**: For global performance

### Performance Monitoring:

- Monitor Core Web Vitals
- Database query performance
- API response times
- User engagement metrics

---

## 🎉 Quick Deploy Commands

```bash
# One-time setup
npm install -g vercel
vercel login

# Deploy
vercel --prod

# Check deployment
vercel ls
```

Your Stuart Main Street Admin Hub will be live at: `https://your-project.vercel.app`
