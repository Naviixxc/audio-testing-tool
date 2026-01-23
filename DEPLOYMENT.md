# Deploy Audio Testing Tool to Vercel

This guide will help you deploy your Next.js audio testing tool to Vercel for global access.

## 🚀 Prerequisites

### Required Accounts
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free)
- **GitHub Account**: Sign up at [github.com](https://github.com) (free)

### Required Tools
- **Git**: Install from [git-scm.com](https://git-scm.com)
- **Node.js**: Already installed (you're using pnpm)

## 📋 Step-by-Step Deployment

### Step 1: Initialize Git Repository
```bash
# Navigate to your project directory
cd "c:/Users/PC/Documents/Ivan File/NewAudtioTester"

# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit - Audio Testing Tool"
```

### Step 2: Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Name it: `audio-testing-tool`
4. Keep it **Public** (for free Vercel deployment)
5. Don't initialize with README (you already have files)
6. Click **"Create repository"**

### Step 3: Push to GitHub
```bash
# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/audio-testing-tool.git

# Push to GitHub
git push -u origin main
```

### Step 4: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. **Import Git Repository**:
   - Choose **GitHub**
   - Connect your GitHub account
   - Select `audio-testing-tool` repository
4. **Configure Settings**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `pnpm install` (important!)
5. Click **"Deploy"**

### Step 5: Configure Environment Variables
Vercel will automatically detect your Next.js app and deploy it. No additional configuration needed!

## 🌐 After Deployment

### Your Live URL
Once deployed, you'll get:
- **Primary URL**: `https://audio-testing-tool.vercel.app`
- **Automatic HTTPS**: Secure connection included
- **Global CDN**: Fast loading worldwide

### Features Available
✅ **Full Audio Testing Tool functionality**
✅ **IndexedDB storage** (works in production)
✅ **File uploads** (drag & drop + click)
✅ **Audio playback** (BGM, Win Dialogue, SFX)
✅ **Image display** with controls
✅ **Responsive design** (mobile, tablet, desktop)
✅ **Progress persistence** across browser sessions

## 🔧 Custom Domain (Optional)

### Add Custom Domain
1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain (e.g., `audio.yourdomain.com`)
3. Update DNS records as instructed by Vercel
4. Your custom domain will work with HTTPS

## 📱 Mobile Considerations

### iOS Safari
- IndexedDB works but may have storage limits
- Audio playback requires user interaction first

### Android Chrome
- Full IndexedDB support
- Works exactly like desktop

### Mobile Browsers
- All features supported
- Touch-friendly interface

## 🔄 Automatic Deployments

### Git-Based Deployments
Every time you push to GitHub:
```bash
# Make changes
git add .
git commit -m "Update audio features"
git push origin main
```
Vercel will **automatically redeploy** your app!

### Preview Deployments
- Push to a branch → Get preview URL
- Test changes before going live
- Perfect for testing new features

## 🛠️ Troubleshooting

### Build Errors
```bash
# Test build locally
pnpm run build

# If errors occur, check:
- Node.js version compatibility
- Missing dependencies
- TypeScript errors
```

### Deployment Issues
- **Vercel Logs**: Check in dashboard
- **Build Timeout**: May need optimization
- **Storage Limits**: IndexedDB has browser limits

## 💡 Pro Tips

### Performance Optimization
```javascript
// In next.config.js (if needed)
module.exports = {
  experimental: {
    optimizeCss: true,
  },
}
```

### Analytics
- Vercel provides **free analytics**
- Track visitors, page views, performance
- Enable in Vercel dashboard

### Customization
- Update `app/globals.css` for styling
- Modify `app/page.tsx` for features
- Add new components in `components/`

## 📋 Deployment Checklist

### Before Deploying
- [ ] Test all features locally
- [ ] Check responsive design
- [ ] Verify audio playback
- [ ] Test file uploads
- [ ] Confirm IndexedDB persistence
- [ ] Check console for errors

### After Deploying
- [ ] Visit live URL
- [ ] Test audio uploads/playback
- [ ] Check mobile compatibility
- [ ] Verify IndexedDB works
- [ ] Share with others for testing

## 🎉 Success!

Your **Audio Testing Tool** will be live at:
```
https://audio-testing-tool.vercel.app
```

Anyone with the link can:
- Upload and test audio files
- Use all audio controls
- Save progress in their browser
- Access from any device
- Share with collaborators

## 🆘 Support

### Vercel Documentation
- [vercel.com/docs](https://vercel.com/docs)
- Next.js deployment guides
- Troubleshooting articles

### GitHub Integration
- Automatic deployments from git
- Rollback to previous versions
- Collaboration features

---

**🚀 Your audio testing tool will be accessible worldwide!**
