// Vercel Serverless Function for WebSocket
// Note: Vercel doesn't support WebSockets in serverless functions directly
// This is a placeholder - for production, consider using Vercel's Edge Functions
// or a separate WebSocket server on a platform like Railway, Render, or Heroku

module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'WebSocket endpoint',
    note: 'For full WebSocket support, the agent server needs to run separately. Deploy site-guide-agent.js to Railway, Render, or Heroku and update the WebSocket URL in site-guide-ui.js'
  });
};

