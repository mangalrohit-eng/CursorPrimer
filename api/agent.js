// Vercel Serverless Function for Site Guide Agent
// This uses HTTP POST instead of WebSockets for Vercel compatibility

const OpenAI = require('openai');

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI initialized with API key');
} else {
    console.log('⚠️ OPENAI_API_KEY not set - will use rule-based narratives only');
}

// Section summaries
const SUMMARIES = {
    'intro-cursor': 'Cursor is an AI-powered development tool that lets you build interactive experiences through natural conversation. Think of it as having an expert developer who instantly brings your ideas to life—no coding expertise required.',
    'featured-demo': 'This demo shows how an MD identified $70M+ in pipeline by building an AI tool to automatically tag deals. Built in 2 hours using Cursor, it demonstrates how senior leaders can create business impact through rapid prototyping.',
    'implications': 'With AI-powered development tools, you can validate ideas instantly, show clients interactive experiences instead of slides, and move from concept to client-ready demos in hours instead of weeks.',
    'how-it-works': 'Building with Cursor is conversational: describe what you want, the AI generates it, you refine through dialogue, and deploy. No traditional coding required—just clear communication of your vision.',
    'capabilities': 'These tools excel at building client dashboards, automating workflows, analyzing data patterns, and creating interactive presentations. They transform abstract ideas into tangible, working prototypes.',
    'showcase': 'Our team has built real business tools in hours: MMS tagging (2hrs), circuit decom (1hr), training scheduler (30min), and CES implementation (4hrs). Each prototype solved actual business challenges.',
    'economics': 'The economics are compelling: $20/month for Cursor plus $5-50 in AI costs per project. Compare that to $20K-50K for traditional development. That\'s 99.8% cost reduction with faster delivery.',
    'next-steps': 'Ready to try this? We don\'t have licenses for the Verizon team yet, but if there\'s interest, we\'ll arrange them. Share your name and two use cases you\'d tackle with Cursor.',
    'meta-reveal': 'Final proof point: this entire website—including the AI agent observing you—was built in 30 minutes using Cursor. That\'s the power of AI-assisted development.',
    'cta-final': 'Ready to transform how you show up to clients? Stop presenting ideas on slides—start showing working prototypes. Express your interest and we\'ll get you started with Cursor.'
};

// Demo URLs
const DEMO_URLS = {
    'mms-tagging': 'https://shakespearean-translator-five.vercel.app',
    'circuit-decom': 'https://hello-world-liard-six.vercel.app/',
    'contact-center': 'https://contact-center-moderinizatoin.vercel.app',
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

// Generate AI-powered narrative based on behavior
async function generateNarrative(session, trigger) {
    const behavior = analyzeBehavior(session);
    
    if (trigger === 'summary') {
        // Try OpenAI first for richer insights (only if initialized)
        if (openai) {
            try {
                console.log('🤖 Calling OpenAI for narrative generation...');
                
                const prompt = `You are an AI observer analyzing a user's behavior on a website about AI-powered development tools (Cursor).

User Behavior Data:
- Time on site: ${behavior.timeOnSite} seconds
- Sections visited: ${behavior.visitedCount} (${session.visitedSections.join(', ')})
- Dwell times: ${JSON.stringify(behavior.dwellTimes)}
- Detected interests: ${behavior.interests.join(', ') || 'exploring'}
- Profile type: ${behavior.profile}

Provide a 2-3 sentence executive summary of:
1. What the user's behavior reveals about their mindset and motivations
2. What they're likely looking for or trying to understand
3. A personalized insight or recommendation

Be conversational and insightful. Focus on psychology and intent, not just data.`;

                const completion = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: 'You are a perceptive AI observer who understands user psychology and intent from behavior patterns.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 200
                });
                
                console.log('✅ OpenAI response received');
                return completion.choices[0].message.content;
                
            } catch (error) {
                console.error('❌ OpenAI error (falling back to rule-based):', error.message || error);
            }
        } else {
            console.log('⚠️ OPENAI_API_KEY not set, using rule-based narrative');
        }
        
        // Fallback: Build rich rule-based narrative
        let narrative = `You've visited ${behavior.visitedCount} sections so far (${session.visitedSections.join(' → ')}). `;
        
        // Find section with most dwell time
        let maxDwell = 0;
        let maxSection = '';
        for (const [sec, time] of Object.entries(behavior.dwellTimes)) {
            if (time > maxDwell) {
                maxDwell = time;
                maxSection = sec;
            }
        }
        
        if (maxSection) {
            narrative += `You spent the most time on **${maxSection}** (${maxDwell}s), which suggests strong interest there. `;
        }
        
        // Profile-based insights
        narrative += `\n\nYou appear to be a **${behavior.profile}** — `;
        
        if (behavior.profile === 'decision-maker') {
            narrative += 'methodically evaluating business value and ROI. You\'re looking for concrete proof this investment is worthwhile.';
        } else if (behavior.profile === 'analyst') {
            narrative += 'diving deep into technical details and implementation. You want to understand exactly how this works before forming an opinion.';
        } else if (behavior.profile === 'explorer') {
            narrative += 'browsing to discover what\'s possible. You\'re in exploration mode, getting a feel for the landscape.';
        } else if (behavior.profile === 'skeptic') {
            narrative += 'moving quickly through the material. You need a compelling reason to slow down and engage deeper.';
        }
        
        // Interest-based recommendation
        if (behavior.interests.length > 0) {
            narrative += `\n\n💡 Your interest in **${behavior.interests.join(' and ')}** suggests you should `;
            
            if (behavior.interests.includes('business-value') && !session.visitedSections.includes('economics')) {
                narrative += 'check out the economics section to see the ROI breakdown.';
            } else if (behavior.interests.includes('real-examples') && !session.visitedSections.includes('showcase')) {
                narrative += 'explore the showcase to see more real prototypes built by our team.';
            } else if (behavior.interests.includes('implementation') && !session.visitedSections.includes('how-it-works')) {
                narrative += 'dive into how it works to understand the technical approach.';
            } else {
                narrative += 'continue exploring the sections that align with your evaluation criteria.';
            }
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
            
            console.log(`📥 Behavior update: ${behaviorType}`, { section, dwellTime, sessionId });
            
            if (behaviorType === 'page_loaded') {
                session.sessionStartTime = Date.now();
                console.log('✅ Page loaded, session started');
            } else if (behaviorType === 'section_entered') {
                session.currentSection = section;
                if (!session.visitedSections.includes(section)) {
                    session.visitedSections.push(section);
                    session.sectionTimestamps[section] = Date.now();
                    console.log(`✅ New section entered: ${section}, total visited: ${session.visitedSections.length}`);
                }
            } else if (behaviorType === 'section_dwell') {
                console.log(`⏱️ Dwell update: ${section} = ${dwellTime}s, threshold: 8s`);
                
                // Analyze and respond at 8 seconds or more
                if (dwellTime >= 8) {
                    console.log('🎯 Threshold met! Generating analysis...');
                    
                    try {
                        const narrative = await generateNarrative(session, 'summary');
                        console.log('📝 Narrative generated:', narrative.substring(0, 100) + '...');
                        
                        const behavior = analyzeBehavior(session);
                        console.log('📊 Behavior analyzed:', behavior);
                        
                        // Build journey summary
                        const journeySummary = `You've visited: ${session.visitedSections.join(' → ')}. Currently on ${data.section} for ${dwellTime}s.`;
                        
                        // Find section with most dwell time
                        let maxDwell = 0;
                        let maxSection = '';
                        for (const [sec, time] of Object.entries(behavior.dwellTimes)) {
                            if (time > maxDwell) {
                                maxDwell = time;
                                maxSection = sec;
                            }
                        }
                        
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
                        
                        const analysisResponse = {
                            type: 'analysis',
                            narrative,
                            thinking: {
                                journey: journeySummary,
                                mostInterested: maxSection ? `Most time on: ${maxSection} (${maxDwell}s)` : 'Just started exploring',
                                engagement: `${behavior.timeOnSite}s on site, ${behavior.visitedCount} sections visited`,
                                profile: behavior.profile,
                                motivation: behavior.profile === 'decision-maker' ? 'Seeking ROI validation' :
                                           behavior.profile === 'analyst' ? 'Understanding technical details' :
                                           behavior.profile === 'explorer' ? 'Discovering possibilities' :
                                           'Evaluating quickly',
                                interests: behavior.interests.length > 0 ? behavior.interests.join(', ') : 'exploring broadly',
                                prediction
                            }
                        };
                        
                        console.log('📤 Sending analysis response:', JSON.stringify(analysisResponse, null, 2));
                        res.status(200).json(analysisResponse);
                        return;
                    } catch (error) {
                        console.error('❌ Error generating analysis:', error);
                        res.status(500).json({ error: 'Analysis generation failed', message: error.message });
                        return;
                    }
                } else {
                    console.log(`⏸️ Dwell time ${dwellTime}s < 8s, waiting...`);
                }
            }
            
            console.log('✅ Behavior logged (no analysis triggered)');
            res.status(200).json({ success: true });
            return;
        }
        
        // Handle message requests
        if (type === 'message') {
            const { message } = data;
            
            // Generate response based on message
            if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('journey')) {
                const narrative = await generateNarrative(session, 'summary');
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

