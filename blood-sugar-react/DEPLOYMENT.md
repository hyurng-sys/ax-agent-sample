# Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Automatic Deployment

1. **Push to GitHub**
   ```bash
   git push origin feature/react-refactoring
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `feature/react-refactoring` branch
   - Configure:
     - Framework Preset: **Vite**
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Get your deployment URL (e.g., `https://your-app.vercel.app`)

### Environment Variables

No environment variables required for basic functionality.

For future features, add variables in Vercel dashboard:
- Project Settings → Environment Variables

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS according to Vercel instructions

## Manual Deployment

### Build Locally

```bash
npm run build
```

### Deploy to Static Hosting

The `dist/` folder contains the complete static site.
Upload to any static hosting service:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

### Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Production build successful (`npm run build`)
- [ ] No console errors in production build
- [ ] Environment variables configured (if any)
- [ ] Custom domain DNS configured (if applicable)

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

## Troubleshooting

### Build Fails

Check:
1. `package.json` dependencies are correct
2. `npm install` runs without errors
3. All imports use correct paths
4. TypeScript has no type errors

### 404 on Routes

Ensure `vercel.json` includes SPA rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Bundle Size Too Large

Optimize:
1. Check bundle analyzer: `npm run build -- --mode analyze`
2. Remove unused dependencies
3. Use dynamic imports for large libraries
4. Enable tree-shaking

## Performance

After deployment, check:
- Lighthouse score (should be >90)
- First Contentful Paint (<1.5s)
- Time to Interactive (<3s)
