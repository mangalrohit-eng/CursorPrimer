// Vercel Serverless Function for Site Guide Agent
// This uses HTTP POST instead of WebSockets for Vercel compatibility

const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Section summaries
const SUMMARIES = {
    'intro-cursor': 'Cursor is an AI-powered development tool that lets you build interactive experiences through natural conversation. Think of it as having an expert developer who instantly brings your ideas to life—no coding expertise required.',
    'featured-demo': 'This demo shows how an MD identified $70M+ in pipeline by building an AI tool to automatically tag deals. Built in 2 hours using Cursor, it demonstrates how senior leaders can create business impact through rapid prototyping.',
    'implications': 'With AI-powered development tools, you can validate ideas instantly, show clients interactive experiences instead of slides, and move from concept to client-ready demos in hours instead of weeks.',
    'how-it-works': 'Building with Cursor is conversational: describe what you want, the AI generates it, you refine through dialogue, and deploy. No traditional coding required—just clear communication of your vision.',
    'capabilities': 'These tools excel at building client dashboards, automating workflows, analyzing data patterns, and creating interactive presentations. They transform abstract ideas into tangible, working prototypes.',
    'showcase': 'Our team has built real business tools in hours: MMS tagging (2hrs), circuit decom (1hr), training scheduler (30min), and CES implementation (4hrs). Each prototype solved actual business challenges.',
    'economics': 'The economics are compelling: $20/month for Cursor plus $5-50 in AI costs per project. Compare that to $20K-50K for traditional development. That's 99.8% cost reduction with faster delivery.',
    'next-steps': 'Ready to try this? We don't have licenses for the Verizon team yet, but if there's interest, we'll arrange them. Share your name and two use cases you'd tackle with Cursor.',
    'meta-reveal': 'Final proof point: this entire website—including the AI agent observing you—was built in 30 minutes using Cursor. That's the power of AI-assisted development.',
    'cta-final': 'Ready to transform how you show up to clients? Stop presenting ideas on slides—start showing working prototypes. Express your interest and we'll get you started with Cursor.'
};

// Demo URLs
const DEMO_URLS = {
    'mms-tagging': '#',
    'circuit-decom': '#',
    'training-scheduler': '#',
    'ces-implementation': '#'
};

// Agent state management (in-memory for this session)
const sessions = new Map();

function getSession(sessionId) {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            conversationHistory: [],
            visitedSections: [],
            sectionTimestamps: {},
            totalTimeOnSite: 0,
            sessionStartTime: Date.now(),
            mode: 'executive',
            currentSection: null
        });
    }
    return sessions.get(sessionId);
}

// Analyze user behavior
function analyzeBehavior(session) {
    const now = Date.now();
    const timeOnSite = Math.floor((now - session.sessionStartTime) / 1000);
    
    // Calculate dwell times
    const dwellTimes = {};
    for (const [section, timestamp] of Object.entries(session.sectionTimestamps)) {
        const index = session.visitedSections.indexOf(section);
        const nextSection = session.visitedSections[index + 1];
        if (nextSection) {
            const nextTimestamp = session.sectionTimestamps[nextSection];
            dwellTimes[section] = Math.floor((nextTimestamp - timestamp) / 1000);
        } else if (section === session.currentSection) {
            dwellTimes[section] = Math.floor((now - timestamp) / 1000);
        }
    }
    
    // Infer interests
    const interests = [];
    if (dwellTimes['showcase'] > 8 || dwellTimes['featured-demo'] > 10) {
        interests.push('real-examples');
    }
    if (dwellTimes['how-it-works'] > 8 || dwellTimes['capabilities'] > 8) {
        interests.push('implementation');
    }
    if (dwellTimes['economics'] > 8 || dwellTimes['implications'] > 10) {
        interests.push('business-value');
    }
    
    // Determine user profile
    let profile = 'explorer';
    if (session.visitedSections.length > 5 && dwellTimes['economics'] > 5) {
        profile = 'decision-maker';
    } else if (dwellTimes['how-it-works'] > 10 || dwellTimes['capabilities'] > 10) {
        profile = 'analyst';
    } else if (timeOnSite < 60 && session.visitedSections.length < 4) {
        profile = 'skeptic';
    }
    
    return {
        timeOnSite,
        visitedCount: session.visitedSections.length,
        dwellTimes,
        interests,
        profile,
        currentSection: session.currentSection
    };
}

// Generate narrative based on behavior
function generateNarrative(session, trigger) {
    const behavior = analyzeBehavior(session);
    
    if (trigger === 'summary') {
        // Detailed persona analysis
        let narrative = `Based on ${behavior.timeOnSite}s across ${behavior.visitedCount} sections, I see you as a **${behavior.profile}**.\n\n`;
        
        if (behavior.profile === 'decision-maker') {
            narrative += 'You\'ve shown strong interest in business value and ROI. You\'re evaluating whether this is worth investing in.';
        } else if (behavior.profile === 'analyst') {
            narrative += 'You\'re diving deep into how this actually works. You want to understand the mechanics before committing.';
        } else if (behavior.profile === 'explorer') {
            narrative += 'You\'re browsing to get a sense of what\'s possible. Still forming your opinion.';
        } else if (behavior.profile === 'skeptic') {
            narrative += 'You\'re moving quickly, possibly skeptical. You need a compelling reason to engage further.';
        }
        
        if (behavior.interests.length > 0) {
            narrative += `\n\n**Key interests**: ${behavior.interests.join(', ')}`;
        }
        
        return narrative;
    }
    
    return '';
}

// Get unvisited sections
function getUnvisitedSections(session) {
    const allSections = Object.keys(SUMMARIES);
    return allSections.filter(s => !session.visitedSections.includes(s));
}

// Main agent handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { sessionId, type, data } = req.body;
        
        if (!sessionId) {
            res.status(400).json({ error: 'sessionId required' });
            return;
        }
        
        const session = getSession(sessionId);
        
        // Handle behavior updates
        if (type === 'behavior') {
            const { behaviorType, section, dwellTime } = data;
            
            if (behaviorType === 'page_loaded') {
                session.sessionStartTime = Date.now();
            } else if (behaviorType === 'section_entered') {
                session.currentSection = section;
                if (!session.visitedSections.includes(section)) {
                    session.visitedSections.push(section);
                    session.sectionTimestamps[section] = Date.now();
                }
            } else if (behaviorType === 'section_dwell') {
                // Check if we should proactively suggest
                if (dwellTime >= 15) {
                    const narrative = generateNarrative(session, 'summary');
                    const behavior = analyzeBehavior(session);
                    
                    // Predict next section
                    const unvisited = getUnvisitedSections(session);
                    let prediction = 'Continue exploring the remaining sections.';
                    
                    if (behavior.profile === 'decision-maker' && !session.visitedSections.includes('economics')) {
                        prediction = 'You\'ll likely want to see the economics section next to understand ROI.';
                    } else if (behavior.profile === 'analyst' && !session.visitedSections.includes('how-it-works')) {
                        prediction = 'You\'ll probably want to understand how it works in detail.';
                    } else if (unvisited.length > 0) {
                        prediction = `Consider checking out: ${unvisited.slice(0, 2).join(', ')}`;
                    }
                    
                    res.status(200).json({
                        type: 'analysis',
                        narrative,
                        thinking: {
                            engagement: `${behavior.timeOnSite}s on site, ${behavior.visitedCount} sections visited`,
                            dwellTimes: behavior.dwellTimes,
                            profile: behavior.profile,
                            interests: behavior.interests,
                            prediction
                        }
                    });
                    return;
                }
            }
            
            res.status(200).json({ success: true });
            return;
        }
        
        // Handle message requests
        if (type === 'message') {
            const { message } = data;
            
            // Generate response based on message
            if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('journey')) {
                const narrative = generateNarrative(session, 'summary');
                const behavior = analyzeBehavior(session);
                
                res.status(200).json({
                    type: 'response',
                    message: narrative,
                    thinking: behavior
                });
                return;
            }
            
            res.status(200).json({
                type: 'response',
                message: 'I\'m observing your journey through the site. Ask me to "summarize" your journey for insights.'
            });
            return;
        }
        
        res.status(400).json({ error: 'Invalid request type' });
        
    } catch (error) {
        console.error('Agent error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

