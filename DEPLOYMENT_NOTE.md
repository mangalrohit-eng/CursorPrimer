# Important Deployment Note

## WebSocket Agent Limitation

Vercel's serverless functions **do not support WebSockets** for the AI agent. You have two options:

### Option 1: Deploy Static Site Only (Simplest)
- Deploy the static website to Vercel (HTML, CSS, JS)
- The AI agent will not work, but all other features will
- Simply remove or hide the AI agent toggle button

To disable the agent:
```javascript
// In site-guide-ui.js, comment out the initialization
// new AgentUI();
```

### Option 2: Separate Agent Server (Recommended for Full Features)

Deploy the **static site to Vercel** and the **agent server separately**:

#### Deploy Agent to Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Add environment variable: `OPENAI_API_KEY`
5. Railway will detect `site-guide-agent.js` and run it
6. Copy the Railway URL (e.g., `https://your-app.railway.app`)
7. Update `site-guide-ui.js`:
   ```javascript
   const wsHost = 'your-app.railway.app';
   ```

#### Alternative Platforms for Agent Server:
- **Render.com** (Free tier available)
- **Heroku** (Paid)
- **Fly.io** (Free tier available)
- **DigitalOcean App Platform**

## Recommended Setup

1. **Vercel**: Static website (index.html, styles, scripts)
2. **Railway/Render**: WebSocket agent server (site-guide-agent.js)
3. Update WebSocket URL in `site-guide-ui.js` to point to your agent server

## Quick Deploy Commands

### Vercel (Static Site)
```bash
vercel --prod
```

### Railway (Agent Server)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Current Configuration

The project is configured for:
- ✅ Static site deployment on Vercel
- ⚠️ WebSocket agent requires separate deployment

Update the WebSocket URL in `site-guide-ui.js` after deploying the agent server separately.


