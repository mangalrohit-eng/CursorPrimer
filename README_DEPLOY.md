# Cursor Primer - Vercel Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- OpenAI API key

## Deployment Steps

### 1. Install Vercel CLI (Optional - for command line deployment)
```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   - Create a new repository on GitHub
   - Push this project to the repository:
     ```bash
     git init
     git add .
     git commit -m "Initial commit - Cursor Primer"
     git remote add origin <your-repo-url>
     git push -u origin main
     ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure the project:
     - **Framework Preset:** Other
     - **Root Directory:** ./
     - **Build Command:** (leave empty)
     - **Output Directory:** (leave empty)

3. **Add Environment Variables:**
   - In Vercel project settings, go to "Environment Variables"
   - Add: `OPENAI_API_KEY` = `<your-openai-api-key>`
   - Click "Save"

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your site will be live at: `https://your-project-name.vercel.app`

### 3. Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? cursor-primer
# - Directory? ./
# - Override settings? N

# Add environment variable
vercel env add OPENAI_API_KEY

# Paste your OpenAI API key when prompted

# Deploy to production
vercel --prod
```

## Environment Variables

The following environment variable is required:

- `OPENAI_API_KEY`: Your OpenAI API key for the AI agent

## Features

- **Static Site:** HTML, CSS, JavaScript
- **WebSocket Agent:** Real-time AI guide powered by Node.js
- **Serverless Functions:** Agent backend runs as serverless function on Vercel

## Post-Deployment

1. **Test the site:** Visit your Vercel URL
2. **Test the AI agent:** Wait 15 seconds on any section to see the AI analysis
3. **Custom domain (optional):** Add your custom domain in Vercel settings

## Troubleshooting

### Agent Not Working
- Check that `OPENAI_API_KEY` is set in Vercel environment variables
- Check Vercel function logs for errors
- Ensure WebSocket connection is established (check browser console)

### Site Not Loading
- Verify `index.html` is at the root
- Check Vercel deployment logs
- Ensure all static assets are accessible

## Files Structure

```
├── index.html              # Main website
├── styles.css              # Main styles
├── intro-responsive.css    # Responsive styles for intro
├── script.js               # Frontend interactions
├── site-guide-agent.js     # AI agent backend
├── site-guide-ui.js        # AI agent frontend
├── package.json            # Dependencies
├── vercel.json            # Vercel configuration
└── brand/
    └── accenture-logo.svg # Logo asset
```

## Support

For issues or questions, contact the project maintainer.

## License

Internal use - Accenture Verizon Team


