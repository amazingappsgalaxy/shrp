# Netlify Deployment Guide for SharpII AI

## 🚀 Quick Deploy

### Option 1: Deploy via Netlify UI (Recommended)
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub account
4. Select the `amazingappsgalaxy/shrp` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

## ⚙️ Build Configuration

Your project is pre-configured with:
- ✅ `netlify.toml` - Build settings and redirects
- ✅ Next.js optimized for Netlify
- ✅ Proper caching headers
- ✅ Security headers
- ✅ Image optimization

## 🌐 Custom Domain Setup

### Step 1: Add Custom Domain in Netlify
1. Go to your site's dashboard
2. Navigate to "Domain management"
3. Click "Add custom domain"
4. Enter your domain (e.g., `yourdomain.com`)

### Step 2: Configure DNS Records
Add these DNS records at your domain registrar:

#### Option A: CNAME (Recommended)
```
Type: CNAME
Name: @ or www
Value: your-site-name.netlify.app
TTL: 3600
```

#### Option B: A Records
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600

Type: A
Name: @
Value: 76.76.19.67
TTL: 3600
```

### Step 3: SSL Certificate
- Netlify automatically provides SSL certificates
- Wait 24-48 hours for full propagation
- Test with: `https://yourdomain.com`

## 🔧 Environment Variables

Set these in Netlify dashboard:
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_ENV=production
```

## 📱 Performance Optimization

Your site includes:
- ✅ Image optimization with WebP/AVIF
- ✅ Static asset caching
- ✅ Code splitting
- ✅ Bundle optimization
- ✅ Security headers

## 🚨 Troubleshooting

### Build Errors
- Check Node.js version (use 18.x)
- Clear cache: `npm run clean`
- Verify dependencies: `npm install`

### Domain Issues
- DNS propagation takes 24-48 hours
- Verify DNS records with `dig` or `nslookup`
- Check SSL certificate status

### Performance Issues
- Enable Netlify Analytics
- Use Netlify Edge Functions for dynamic content
- Optimize images with Next.js Image component

## 📞 Support

- Netlify Docs: [docs.netlify.com](https://docs.netlify.com)
- Next.js on Netlify: [docs.netlify.com/integrations/frameworks/nextjs](https://docs.netlify.com/integrations/frameworks/nextjs)
- Community: [community.netlify.com](https://community.netlify.com)
