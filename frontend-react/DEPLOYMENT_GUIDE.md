# Frontend Deployment Guide

## ✅ What Has Been Fixed

1. **Vite Configuration**: Added proper `root` and `build` configuration
2. **API URL Configuration**: 
   - Production: `https://myclinic-api-five.vercel.app/api`
   - Development: `http://localhost:5000/api`
3. **Environment Files**: Created `.env.production` and `.env.development`
4. **Netlify Configuration**: Added `netlify.toml` for proper deployment
5. **Build Process**: Verified and tested locally

## 🚀 Deploy to Netlify

### Option 1: Manual Deployment via Netlify CLI

```bash
cd frontend-react
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 2: Deploy via Netlify Dashboard

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Build settings will be auto-detected from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

## 🔧 Netlify Build Settings (already configured in netlify.toml)

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **Environment Variable**: `VITE_API_URL=https://myclinic-api-five.vercel.app/api`

## ✅ Files Updated

- `vite.config.js` - Added build configuration
- `.env.production` - Production API URL
- `.env.development` - Development API URL
- `netlify.toml` - Netlify configuration
- `src/context/AuthContext.jsx` - Updated to use env variable
- `src/services/api.js` - Already configured with env variable

## 🧪 Test Your Deployment

After deployment, test these features:
1. Login with admin credentials
2. Patient signup and login
3. Doctor signup and approval
4. Appointment booking
5. Medical records

## 🔑 Backend URL

Your backend is live at: `https://myclinic-api-five.vercel.app`

All API calls will automatically use this URL in production builds.

## 📱 Local Development

To run locally:
```bash
npm run dev
```

This will use `http://localhost:5000/api` as configured in `.env.development`
