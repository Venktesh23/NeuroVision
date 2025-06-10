# Netlify Deployment Guide for NeuroVision

This guide will help you deploy the NeuroVision application to Netlify.

## Files Added for Netlify Deployment

1. **`netlify.toml`** - Main configuration file for Netlify
2. **`client/public/_redirects`** - Handles client-side routing
3. **`client/public/index.html`** - Enhanced with better meta tags and error handling
4. **`package.json`** - Root package.json for workspace management

## Netlify Configuration

The `netlify.toml` file has been configured with:
- **Build base**: `client/` (where the React app is located)
- **Publish directory**: `client/build/` (where the built files will be)
- **Build command**: `npm run build`
- **Node.js version**: 18
- **Redirects**: All routes redirect to `index.html` for SPA routing
- **Security headers**: Added for production security
- **Cache optimization**: Static assets cached for performance

## Deployment Steps

1. **Connect Repository**: 
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings** (should be automatic with netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `client/build`
   - Base directory: `client`

3. **Environment Variables** (if needed):
   - Go to Site settings > Environment variables
   - Add any required environment variables (see `client/env.example`)
   - Example: `REACT_APP_API_URL` for your backend URL

4. **Deploy**:
   - Netlify will automatically build and deploy
   - Check the deploy logs for any errors

## Troubleshooting

### "Page not found" errors:
- ✅ Fixed with `_redirects` file and `netlify.toml` configuration
- ✅ All routes now redirect to `index.html` with 200 status

### Build failures:
- Check Node.js version (set to 18 in netlify.toml)
- Ensure all dependencies are in package.json
- Check build logs for specific errors

### External dependencies (MediaPipe, Chart.js):
- ✅ Added error handling in index.html
- Scripts load from CDN with fallback handling

## Features Included

- ✅ Single Page Application (SPA) routing support
- ✅ Security headers for production
- ✅ Cache optimization for static assets
- ✅ Error handling for external dependencies
- ✅ SEO-friendly meta tags
- ✅ Proper favicon and manifest support

## Post-Deployment Checklist

- [ ] Verify the site loads correctly
- [ ] Test all application features
- [ ] Check browser console for errors
- [ ] Test camera permissions
- [ ] Verify MediaPipe models load correctly
- [ ] Test authentication features (if backend is deployed)

## Notes

- The application is configured as a frontend-only deployment
- For full functionality, you'll need to deploy the backend separately
- Update `REACT_APP_API_URL` environment variable with your backend URL
- The app includes fallbacks for when external dependencies fail to load 