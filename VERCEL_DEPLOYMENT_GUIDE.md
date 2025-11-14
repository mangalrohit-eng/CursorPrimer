# 🚀 Vercel Deployment Guide - Step by Step

## Overview
This project consists of two parts:
1. **Static Website** (HTML/CSS/JS) → Deploy to **Vercel**
2. **AI Agent Server** (WebSocket) → Deploy to **Railway** or **Render**

---

## Part 1: Deploy Static Website to Vercel

### Method A: Deploy via Vercel Dashboard (Easiest)

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/cursor-primer.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **"Add New Project"**
   - Click **"Import Git Repository"**
   - Select your `cursor-primer` repository
   - Configure:
     - Framework Preset: **Other**
     - Root Directory: **.**
     - Build Command: *(leave empty)*
     - Output Directory: *(leave empty)*
   - Click **"Deploy"**
   - Wait ~30 seconds
   - Your site is live! 🎉

3. **Note the URL**
   - Your site will be at: `https://cursor-primer-XXXXX.vercel.app`
   - Keep this URL handy

### Method B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Part 2: Deploy AI Agent Server (Optional - for full functionality)

**Important:** Vercel doesn't support WebSockets. You need to deploy the agent server separately.

### Option A: Deploy to Railway (Recommended - Free Tier)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Agent Server**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Select your `cursor-primer` repository
   - Railway will auto-detect Node.js

3. **Add Environment Variable**
   - Click on your project
   - Go to **"Variables"** tab
   - Click **"New Variable"**
   - Add: `OPENAI_API_KEY` = `your-api-key-here`
   - Click **"Add"**

4. **Get Your Agent URL**
   - Railway will give you a URL like: `https://cursor-primer-production-XXXX.up.railway.app`
   - Copy this URL

5. **Update Frontend to Use Railway URL**
   
   In `site-guide-ui.js`, find line 17 and update:
   ```javascript
   // Replace this line:
   const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
   
   // With this (use your Railway URL without https://):
   const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : 'cursor-primer-production-XXXX.up.railway.app';
   ```

6. **Redeploy to Vercel**
   - Commit and push your changes to GitHub
   - Vercel will automatically redeploy
   - Your AI agent will now work! 🤖

### Option B: Deploy to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up

2. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Configure:
     - **Name:** cursor-primer-agent
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `node site-guide-agent.js`
     - **Plan:** Free

3. **Add Environment Variable**
   - Scroll to **"Environment Variables"**
   - Add: `OPENAI_API_KEY` = `your-api-key-here`

4. **Deploy and Get URL**
   - Click **"Create Web Service"**
   - Wait for deployment
   - Copy the URL: `https://cursor-primer-agent.onrender.com`

5. **Update Frontend**
   - Same as Railway step 5 above

---

## Part 3: Final Configuration

### If You Want AI Agent:
1. Deploy static site to Vercel ✅
2. Deploy agent to Railway/Render ✅
3. Update `site-guide-ui.js` with Railway/Render URL ✅
4. Commit and push changes ✅
5. Vercel auto-redeploys ✅

### If You DON'T Want AI Agent:
1. Deploy static site to Vercel ✅
2. Remove the agent toggle button (optional)
   - In `index.html`, find and remove the agent toggle button HTML
   - Or leave it - it will just say "Connecting..."

---

## Testing Your Deployment

### Test Static Site
1. Visit your Vercel URL
2. All sections should load properly
3. Navigation should work
4. Animations should be smooth

### Test AI Agent (if deployed)
1. Visit your site
2. Wait 15 seconds on any section
3. Click the AI agent toggle button (bottom right)
4. You should see AI analysis and suggestions

---

## Troubleshooting

### Site Not Loading
- Check Vercel deployment logs
- Ensure `index.html` is in the root directory
- Check that all CSS/JS files are accessible

### AI Agent Not Connecting
- Verify `OPENAI_API_KEY` is set in Railway/Render
- Check Railway/Render logs for errors
- Verify WebSocket URL in `site-guide-ui.js` is correct
- Open browser console and check for WebSocket errors

### OpenAI API Errors
- Verify your API key is valid
- Check you have sufficient OpenAI credits
- Ensure your API key has access to GPT-4

---

## Cost Breakdown

### Vercel (Static Site)
- **Free tier**: 100GB bandwidth/month
- **Cost**: $0/month for typical usage

### Railway (Agent Server)
- **Free tier**: $5 credit/month
- **Typical usage**: ~$2-3/month
- **Cost**: Free for light usage

### Render (Agent Server - Alternative)
- **Free tier**: Available
- **Limitation**: Spins down after 15 min inactivity
- **Cost**: $0/month (but slower cold starts)

### OpenAI API
- **GPT-4 API calls**: ~$0.01-0.03 per interaction
- **Typical session**: 10-20 interactions = $0.20-0.60
- **Monthly estimate**: $5-20 for moderate use

---

## Files You Need

All deployment files are ready:
- ✅ `vercel.json` - Vercel configuration
- ✅ `railway.json` - Railway configuration  
- ✅ `Procfile` - Render/Heroku configuration
- ✅ `.vercelignore` - Files to exclude from Vercel
- ✅ `.gitignore` - Files to exclude from Git
- ✅ `package.json` - Node.js dependencies

---

## Quick Deploy Checklist

- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] (Optional) Deploy agent to Railway/Render
- [ ] (Optional) Add OPENAI_API_KEY to Railway/Render
- [ ] (Optional) Update WebSocket URL in site-guide-ui.js
- [ ] Test the deployment
- [ ] Share the URL! 🎉

---

## Support

For questions or issues:
1. Check Vercel deployment logs
2. Check Railway/Render logs (if using agent)
3. Check browser console for errors
4. Verify all environment variables are set

**You're ready to deploy!** 🚀


