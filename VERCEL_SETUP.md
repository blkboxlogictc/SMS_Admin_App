# Vercel Environment Variables Setup Guide

## 🚨 Critical: Your 500 Error Fix

The 500 error during login is caused by missing environment variables in your Vercel deployment. Your server requires these variables to connect to Supabase.

## 📋 Required Environment Variables

You need to set these in your Vercel project dashboard:

### 1. Go to Vercel Dashboard

1. Open your project: `SMS_Admin_App`
2. Go to **Settings** → **Environment Variables**

### 2. Add These Variables

Copy these from your local `.env` file and add them to Vercel:

```env
DATABASE_URL=postgresql://postgres.jjcjmuxjbrubdwuxvovy:6khCgr3At7Z5c1cs@aws-0-us-east-2.pooler.supabase.com:6543/postgres

SUPABASE_URL=https://jjcjmuxjbrubdwuxvovy.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY2ptdXhqYnJ1YmR3dXh2b3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMjgxOTYsImV4cCI6MjA2ODgwNDE5Nn0.Ey1T5AcpboW67_qz_KOuXqGQKDzPVpQNk6_F1exS-hM

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY2ptdXhqYnJ1YmR3dXh2b3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIyODE5NiwiZXhwIjoyMDY4ODA0MTk2fQ.SuyHfGOdaGjPriMx0x1RbbEmMoKS7JuqVbSa8m__1Lg

JWT_SECRET=stuart-main-street-admin-secret-key-2024

NODE_ENV=production

PORT=5000
```

### 3. Environment Settings for Each Variable

For **each** environment variable:

- **Name**: Variable name (e.g., `SUPABASE_URL`)
- **Value**: The actual value from your .env file
- **Environment**: Select **Production**, **Preview**, and **Development** (all three)

## 🔄 After Adding Variables

1. **Redeploy**: Go to **Deployments** tab and click **Redeploy** on your latest deployment
2. **Wait**: Let Vercel rebuild with the new environment variables
3. **Test**: Try logging in again

## 🐛 Troubleshooting

### If you still get 500 errors:

1. **Check Vercel Function Logs**:

   - Go to your Vercel project dashboard
   - Click on **Functions** tab
   - Look for error logs in your serverless function

2. **Verify Environment Variables**:

   - Go to **Settings** → **Environment Variables**
   - Make sure all variables are set for **Production** environment

3. **Check Supabase Connection**:
   - Verify your Supabase project is active
   - Check if your database URL is accessible

### Common Issues:

1. **Missing Variables**: Make sure ALL variables are set
2. **Wrong Environment**: Variables must be set for "Production"
3. **Typos**: Double-check variable names and values
4. **Supabase Keys**: Ensure keys haven't expired or been rotated

## 📱 Testing Login

After setting up environment variables and redeploying:

1. Go to your Vercel deployment URL
2. Try to log in with your admin credentials
3. If successful, you should see the dashboard
4. Check that all analytics pages load correctly

## 🔐 Security Note

These environment variables contain sensitive information. Never commit them to your repository or share them publicly.

## 📞 Need Help?

If you continue to have issues:

1. Check the Vercel function logs for specific error messages
2. Verify your Supabase project is active and accessible
3. Ensure all environment variables are correctly copied

---

**Quick Fix Summary:**

1. Add all environment variables to Vercel
2. Redeploy your application
3. Test login functionality
