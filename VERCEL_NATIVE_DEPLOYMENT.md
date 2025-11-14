# 🚀 Vercel Native Deployment (All-in-One)

## ✅ This project is now fully Vercel-native!

The AI agent has been converted from WebSocket to HTTP-based serverless functions, so **everything** (website + AI agent) deploys to Vercel in one step.

---

## Quick Deploy Steps

### 1. Push to GitHub (Already Done ✅)
Your code is already at: https://github.com/mangalrohit-eng/CursorPrimer

### 2. Deploy to Vercel

#### Via Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import `mangalrohit-eng/CursorPrimer`
4. Configure:
   - Framework Preset: **Other**
   - Root Directory: **.**
   - **Add Environment Variable:**
     - Key: `OPENAI_API_KEY`
     - Value: `your-openai-api-key`
5. Click **"Deploy"**

#### Via Vercel CLI:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add OPENAI_API_KEY production

# Deploy to production
vercel --prod
```

---

## What Changed?

### Before:
- ❌ WebSocket server (required separate deployment)
- ❌ Long-running Node.js process
- ❌ Needed Railway/Render for agent

### After:
- ✅ HTTP-based serverless function (`/api/agent.js`)
- ✅ Stateless, works perfectly on Vercel
- ✅ All-in-one deployment
- ✅ Auto-scaling included

---

## How It Works

1. **Frontend** (`site-guide-ui.js`): 
   - Sends behavior updates via HTTP POST to `/api/agent`
   - Receives analysis and suggestions as JSON responses

2. **Backend** (`/api/agent.js`):
   - Vercel serverless function
   - Tracks user sessions in memory
   - Analyzes behavior and generates insights
   - Returns personalized suggestions

3. **Deployment**:
   - Vercel handles everything automatically
   - Functions auto-scale based on traffic
   - No server management needed

---

## Testing Your Deployment

1. Visit your Vercel URL
2. Browse the site for 15+ seconds
3. Click the AI agent toggle (bottom right)
4. See your personalized journey analysis

---

## Environment Variables

Only one variable needed:

- `OPENAI_API_KEY`: Your OpenAI API key (for future OpenAI integration if needed)

Set it in Vercel Dashboard → Project Settings → Environment Variables

---

## Cost

- **Vercel**: Free tier covers typical usage
- **Vercel Pro** (if needed): $20/month for higher limits
- **OpenAI API**: $5-20/month for moderate usage

---

## Architecture

```
Your Repository (GitHub)
         ↓
    Vercel Deploy
         ↓
    ┌─────────────────────┐
    │   Static Assets     │
    │  (HTML, CSS, JS)    │
    └─────────────────────┘
         ↓
    ┌─────────────────────┐
    │  Serverless Function│
    │   /api/agent.js     │
    │  (AI Agent Logic)   │
    └─────────────────────┘
```

---

## Troubleshooting

### Agent Not Responding
- Check that `OPENAI_API_KEY` is set in Vercel
- Check Vercel function logs for errors
- Verify browser console shows successful API calls

### 504 Timeout
- Serverless functions have 10s timeout (configured)
- If agent logic is too slow, optimize or increase `maxDuration`

### Session State Lost
- Sessions are in-memory and reset on function cold starts
- This is expected and normal for Vercel serverless
- Session data persists during active use

---

## Next Steps

1. **Deploy now** following steps above
2. **Test the site** - verify AI agent works
3. **(Optional)** Add custom domain in Vercel settings
4. **(Optional)** Enable Vercel Analytics for insights

---

**You're ready to deploy!** 🚀

All-in-one. No separate services. Just Vercel.


