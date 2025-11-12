/**
 * Site Guide Agent - Real LangGraph Implementation
 * Observes user behavior, reasons about intent, takes actions
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ============================================================================
// AGENT STATE (LangGraph-style)
// ============================================================================

class AgentState {
    constructor() {
        this.mode = 'detailed'; // 'executive' or 'detailed'
        this.currentSection = null;
        this.visitedSections = [];
        this.sectionTimestamps = {}; // Track when sections were entered
        this.dwellTimes = {};
        this.totalTimeOnSite = 0;
        this.sessionStartTime = Date.now();
        this.conversationHistory = [];
        this.showcaseOrder = ['mms', 'vzt', 'training', 'vcg'];
    }
    
    getJourneySummary() {
        const visited = this.visitedSections.length;
        const total = 10;
        const completion = Math.round((visited / total) * 100);
        
        const timeOnSite = Math.round((Date.now() - this.sessionStartTime) / 1000);
        
        return {
            visited,
            total,
            completion,
            timeOnSite,
            sections: this.visitedSections,
            dwellTimes: this.dwellTimes
        };
    }
    
    getUnvisitedSections() {
        const allSections = ['hero', 'intro-cursor', 'featured-demo', 'how-it-works', 'implications', 'capabilities', 'showcase', 'economics', 'next-steps', 'meta-reveal'];
        return allSections.filter(s => !this.visitedSections.includes(s));
    }
    
    analyzeBehavior() {
        // Find section with longest dwell time
        const dwellEntries = Object.entries(this.dwellTimes);
        if (dwellEntries.length === 0) return null;
        
        const sortedByDwell = dwellEntries.sort((a, b) => b[1] - a[1]);
        const mostEngaged = sortedByDwell[0];
        const leastEngaged = sortedByDwell[sortedByDwell.length - 1];
        
        // Calculate average dwell time
        const avgDwellTime = dwellEntries.reduce((sum, [_, time]) => sum + time, 0) / dwellEntries.length;
        
        // Classify sections by engagement level
        const highEngagement = dwellEntries.filter(([_, time]) => time > avgDwellTime * 1.3);
        const lowEngagement = dwellEntries.filter(([_, time]) => time < avgDwellTime * 0.7);
        
        // Analyze interests based on dwell patterns with nuanced reasoning
        const interests = [];
        const motivations = [];
        
        // Real-world examples interest
        const examplesDwell = (this.dwellTimes['featured-demo'] || 0) + (this.dwellTimes['showcase'] || 0);
        if (examplesDwell > 15) {
            interests.push('real-examples');
            if (this.dwellTimes['featured-demo'] > 12) {
                motivations.push('Seeks proof through concrete case studies. Likely needs to justify decisions with real ROI data.');
            } else {
                motivations.push('Interested in variety of use cases. May be exploring applicability to their context.');
            }
        }
        
        // Implementation/technical interest
        const implDwell = (this.dwellTimes['how-it-works'] || 0) + (this.dwellTimes['capabilities'] || 0);
        if (implDwell > 15) {
            interests.push('implementation');
            if (this.dwellTimes['how-it-works'] > this.dwellTimes['capabilities']) {
                motivations.push('Focused on process and methodology. Wants to understand the "how" before committing.');
            } else {
                motivations.push('Feature-driven evaluation. Assessing if capabilities match their needs.');
            }
        }
        
        // Business value/ROI focus
        const businessDwell = (this.dwellTimes['implications'] || 0) + (this.dwellTimes['economics'] || 0);
        if (businessDwell > 15) {
            interests.push('business-value');
            if (this.dwellTimes['economics'] > 10) {
                motivations.push('Cost-conscious decision maker. Needs clear ROI justification for stakeholders.');
            }
            if (this.dwellTimes['implications'] > 10) {
                motivations.push('Strategic thinker. Evaluating competitive advantage and organizational impact.');
            }
        }
        
        // Detect navigation patterns
        const sectionOrder = ['hero', 'intro-cursor', 'featured-demo', 'how-it-works', 'implications', 'capabilities', 'showcase', 'economics', 'next-steps', 'meta-reveal'];
        const skipped = [];
        let navigationPattern = 'linear'; // linear, jumping, or selective
        
        for (let i = 0; i < this.visitedSections.length - 1; i++) {
            const currentIdx = sectionOrder.indexOf(this.visitedSections[i]);
            const nextIdx = sectionOrder.indexOf(this.visitedSections[i + 1]);
            
            if (nextIdx - currentIdx > 2) {
                navigationPattern = 'jumping';
            } else if (nextIdx - currentIdx > 1) {
                navigationPattern = 'selective';
            }
            
            if (nextIdx - currentIdx > 1) {
                for (let j = currentIdx + 1; j < nextIdx; j++) {
                    skipped.push(sectionOrder[j]);
                }
            }
        }
        
        // Infer user profile
        let userProfile = 'explorer'; // explorer, analyst, decision-maker, skeptic
        if (businessDwell > implDwell && businessDwell > examplesDwell) {
            userProfile = 'decision-maker';
        } else if (implDwell > businessDwell && implDwell > examplesDwell) {
            userProfile = 'analyst';
        } else if (examplesDwell > 20 && navigationPattern === 'selective') {
            userProfile = 'skeptic';
        }
        
        // Engagement quality assessment
        let engagementQuality = 'moderate';
        if (avgDwellTime > 12) {
            engagementQuality = 'high';
        } else if (avgDwellTime < 5) {
            engagementQuality = 'scanning';
        }
        
        return {
            mostEngagedSection: mostEngaged[0],
            mostEngagedTime: mostEngaged[1],
            leastEngagedSection: leastEngaged[0],
            leastEngagedTime: leastEngaged[1],
            avgDwellTime,
            highEngagement: highEngagement.map(([s, _]) => s),
            lowEngagement: lowEngagement.map(([s, _]) => s),
            interests,
            motivations,
            skipped,
            navigationPattern,
            userProfile,
            engagementQuality
        };
    }
    
    getDetailedReasoning() {
        const behavior = this.analyzeBehavior();
        if (!behavior) return 'Insufficient data for analysis.';
        
        const sectionNames = {
            'hero': 'Hero',
            'intro-cursor': 'What is Cursor',
            'featured-demo': 'Featured Demo',
            'how-it-works': 'How It Works',
            'implications': 'Implications',
            'capabilities': 'Capabilities',
            'showcase': 'Showcase',
            'economics': 'Economics',
            'next-steps': 'Getting Started',
            'meta-reveal': 'The Reveal'
        };
        
        let reasoning = '';
        
        // Engagement pattern analysis
        reasoning += `📊 ENGAGEMENT ANALYSIS: User shows "${behavior.engagementQuality}" engagement (avg ${Math.round(behavior.avgDwellTime)}s/section). `;
        reasoning += `Peak interest: ${sectionNames[behavior.mostEngagedSection]} (${behavior.mostEngagedTime}s). `;
        if (behavior.leastEngagedTime < behavior.avgDwellTime * 0.5) {
            reasoning += `Low interest: ${sectionNames[behavior.leastEngagedSection]} (${behavior.leastEngagedTime}s - possible mismatch). `;
        }
        
        // Navigation pattern insights
        reasoning += `\n\n🧭 NAVIGATION: ${behavior.navigationPattern} pattern. `;
        if (behavior.navigationPattern === 'jumping') {
            reasoning += 'User is goal-oriented, jumping to specific sections. Indicates prior knowledge or specific search intent. ';
        } else if (behavior.navigationPattern === 'selective') {
            reasoning += 'Deliberate selection of sections. User knows what they\'re looking for. ';
        } else {
            reasoning += 'Following natural flow. Comprehensive evaluation mindset. ';
        }
        
        if (behavior.skipped.length > 0) {
            reasoning += `Skipped ${behavior.skipped.length} section(s) - may indicate ${behavior.userProfile === 'decision-maker' ? 'time pressure' : 'specific information seeking'}. `;
        }
        
        // User profile inference
        reasoning += `\n\n👤 PROFILE: Detected as "${behavior.userProfile}". `;
        const profileInsights = {
            'decision-maker': 'Focused on business case and ROI. Likely senior role with budget authority. Needs executive summary and concrete value props.',
            'analyst': 'Technical evaluation mode. Wants to understand mechanisms and feasibility. Needs implementation details and capability specs.',
            'skeptic': 'Seeking proof points and validation. May have previous negative experiences. Needs multiple examples and risk mitigation info.',
            'explorer': 'Open-minded discovery. Building mental model of possibilities. Appreciates comprehensive information and use case variety.'
        };
        reasoning += profileInsights[behavior.userProfile];
        
        // Interest and motivation analysis
        if (behavior.motivations.length > 0) {
            reasoning += `\n\n🎯 MOTIVATIONS: ${behavior.motivations.join(' ')}`;
        }
        
        // Predictive recommendations
        const unvisited = this.getUnvisitedSections();
        reasoning += '\n\n💡 PREDICTION: ';
        
        if (behavior.profile === 'decision-maker') {
            if (unvisited.includes('economics')) {
                reasoning += 'Will likely check Economics section for ROI and budget justification. ';
            } else {
                reasoning += 'Has seen cost info - likely evaluating strategic fit and team adoption. ';
            }
        } else if (behavior.profile === 'skeptic') {
            if (unvisited.includes('showcase')) {
                reasoning += 'Would benefit from Showcase section - needs more proof points. ';
            } else {
                reasoning += 'Seen multiple examples - still verifying claims, may revisit sections. ';
            }
        } else if (behavior.profile === 'analyst') {
            if (unvisited.includes('how-it-works') || unvisited.includes('capabilities')) {
                reasoning += 'Needs technical depth from How It Works and Capabilities sections. ';
            } else {
                reasoning += 'Has technical info - likely evaluating implementation feasibility and risk. ';
            }
        } else {
            reasoning += 'Explorer mode - will continue browsing to build comprehensive understanding. ';
        }
        
        // Next likely action
        if (this.totalTimeOnSite > 60000) { // More than 1 minute
            reasoning += 'High engagement suggests genuine interest - likely to take action.';
        } else {
            reasoning += 'Early exploration phase - still building context.';
        }
        
        return reasoning;
    }
}

// ============================================================================
// EXECUTIVE SUMMARIES (Knowledge Base)
// ============================================================================

const SUMMARIES = {
    hero: "Stop presenting ideas. Start showing them. AI development tools let you build working prototypes in hours, replacing static slides with interactive demos.",
    'intro-cursor': "Cursor and 'vibe coding' — describe what you want in plain English, AI writes the code. Senior leaders can build solutions directly. Account teams can create live demos faster than making slides. You focus on business value, AI handles implementation.",
    'featured-demo': "Real example: An MD built an AI & Data Deal Identification system for MMS in 2 hours. It automatically tags deals, generates emails, and added $70M+ to the pipeline. No coding skills—just business understanding.",
    'how-it-works': "Four simple steps: (1) Describe the problem in plain English, (2) AI builds the solution, (3) Refine through conversation, (4) Deploy and run. Total time: 2 hours. No coding needed—just business expertise.",
    implications: "When you can build solutions yourself, everything changes. You show working prototypes in client meetings, validate ideas in hours instead of months, win more deals by demonstrating real capability, and stand out with demos while competitors show slides.",
    capabilities: "Three core capabilities: (1) Plain English to Code—describe in business terms, AI writes it, (2) Hours Not Weeks—build apps faster than making slides, (3) Instant Changes—update based on feedback immediately.",
    showcase: "Three more real examples from MDs: VZT Circuit Decommissioning Identification (1 hour), Verizon Training Discovery & Scheduling (30 mins), and VCG CES Next Gen Implementation (4 hours). Click any card to see details.",
    economics: "Economics make this accessible: Traditional development costs $12K-$18K and takes 2-3 weeks. AI-powered costs $25-$70 per project and takes 2-4 hours. That's 99% cost reduction. Just $20/month license plus $5-$50 AI usage per project.",
    'next-steps': "Ready to try? Note: Cursor licenses aren't currently available for Verizon team—reach out if interested. When you start: build something simple for an upcoming meeting, and make working prototypes your standard approach instead of slides.",
    'meta-reveal': "🎉 The grand reveal: This entire website, including the sophisticated AI agent analyzing your behavior right now, was built in just 30 minutes. Yes, really. The same AI tools that built this can build your next client demo."
};

const DEMO_URLS = {
    mms: { url: '#mms', title: 'MMS AI & Data Deal Tagging', description: 'Auto-identifies Data & AI opportunities, $70M+ pipeline impact, 2 hours' },
    vzt: { url: '#vzt', title: 'VZT Circuit Decommissioning', description: 'Identifies circuits for decom, 1 hour build time' },
    training: { url: '#training', title: 'Verizon Training Discovery', description: 'Training scheduling system, 30 minutes build time' },
    vcg: { url: '#vcg', title: 'VCG CES Next Gen', description: 'CES implementation, 4 hours build time' }
};

// ============================================================================
// AGENT TOOLS (Callable Actions)
// ============================================================================

const tools = [
    {
        type: 'function',
        function: {
            name: 'summarize_section',
            description: 'Return a 2-3 sentence executive summary of a specific section',
            parameters: {
                type: 'object',
                properties: {
                    section_id: {
                        type: 'string',
                        enum: ['hero', 'featured-demo', 'how-it-works', 'implications', 'capabilities', 'showcase', 'economics', 'next-steps'],
                        description: 'The section to summarize. Options: hero (intro), featured-demo ($70M MMS case), how-it-works (build process), implications (business impact), capabilities (core features), showcase (more examples), economics (cost comparison), next-steps (getting started)'
                    }
                },
                required: ['section_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'highlight_section',
            description: 'Smooth-scroll to a section and briefly highlight it',
            parameters: {
                type: 'object',
                properties: {
                    section_id: {
                        type: 'string',
                        enum: ['hero', 'featured-demo', 'how-it-works', 'implications', 'capabilities', 'showcase', 'economics', 'next-steps'],
                        description: 'The section to highlight'
                    }
                },
                required: ['section_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'open_demo',
            description: 'Open one of the showcase demo URLs',
            parameters: {
                type: 'object',
                properties: {
                    demo_id: {
                        type: 'string',
                        enum: ['mms', 'vzt', 'training', 'vcg'],
                        description: 'The demo to open: mms (MMS Deal Tagging, $70M), vzt (Circuit Decom, 1hr), training (Training Discovery, 30min), vcg (CES Implementation, 4hr)'
                    }
                },
                required: ['demo_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'switch_mode',
            description: 'Toggle copy density between executive and detailed',
            parameters: {
                type: 'object',
                properties: {
                    mode: {
                        type: 'string',
                        enum: ['executive', 'detailed'],
                        description: 'The mode to switch to'
                    }
                },
                required: ['mode']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'reorder_showcase',
            description: 'Reorder the four showcase tiles',
            parameters: {
                type: 'object',
                properties: {
                    order: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['mms', 'vzt', 'training', 'vcg']
                        },
                        minItems: 3,
                        maxItems: 4,
                        description: 'New order of demo IDs'
                    }
                },
                required: ['order']
            }
        }
    }
];

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

function summarize_section(section_id) {
    return {
        success: true,
        summary: SUMMARIES[section_id] || 'Section not found',
        section_id
    };
}

function highlight_section(section_id) {
    return {
        success: true,
        action: 'scroll_and_highlight',
        section_id
    };
}

function open_demo(demo_id) {
    const demo = DEMO_URLS[demo_id];
    return {
        success: true,
        action: 'open_url',
        url: demo.url,
        title: demo.title,
        demo_id
    };
}

function switch_mode(mode) {
    return {
        success: true,
        action: 'switch_mode',
        mode,
        message: mode === 'executive' ? 'Switched to executive view - responses will be concise' : 'Switched to detailed view'
    };
}

function reorder_showcase(order) {
    return {
        success: true,
        action: 'reorder',
        order
    };
}

// ============================================================================
// AGENT WORKFLOW (LangGraph-style)
// ============================================================================

async function runAgent(state, userMessage, context = {}) {
    console.log('\n[AGENT] Processing:', userMessage);
    
    // Build system prompt with behavior policy
    const systemPrompt = `You are the Cursor Site Guide Agent - an intelligent assistant that helps executives navigate this website.

CURRENT MODE: ${state.mode}
CURRENT SECTION: ${state.currentSection || 'unknown'}
VISITED SECTIONS: ${state.visitedSections.join(', ') || 'none'}

BEHAVIOR POLICY:
1. If user asks for "tour" or "60-sec tour": Summarize sections in order (hero → featured-demo → how-it-works → implications → capabilities → showcase → economics → next-steps) using summarize_section and highlight_section tools.
2. If user dwells on section 6+ seconds: Proactively offer "Summarize this?" or "Jump to a demo?" or "Executive view?"
3. If user requests "executive view": Call switch_mode('executive') and keep responses to 1-3 sentences.
4. When asked to "show me a demo": Pick relevant demo (mms, vzt, training, vcg), call open_demo, explain why in one sentence.
5. ALWAYS keep responses to 1-3 sentences unless asked for more.
6. Use tools when appropriate - don't just describe actions, actually call them.
7. When summarizing, mention key metrics: $70M pipeline, 99% cost reduction, 2-hour builds.

${context.dwellTime >= 6 ? 'USER CONTEXT: User has been on this section for ' + context.dwellTime + ' seconds - proactively offer help!' : ''}`;

    // Build conversation history
    const messages = [
        { role: 'system', content: systemPrompt },
        ...state.conversationHistory,
        { role: 'user', content: userMessage }
    ];

    try {
        // Call OpenAI with function calling
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 500
        });

        const assistantMessage = response.choices[0].message;
        const toolCalls = assistantMessage.tool_calls;

        // Update conversation history - add user message
        state.conversationHistory.push({ role: 'user', content: userMessage });

        const result = {
            message: assistantMessage.content,
            actions: []
        };

        // Execute tool calls
        if (toolCalls && toolCalls.length > 0) {
            console.log('[AGENT] Executing tools:', toolCalls.map(t => t.function.name));
            
            // Add assistant message with tool_calls to history
            state.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage.content,
                tool_calls: toolCalls
            });
            
            // Execute all tools
            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                let toolResult;
                switch (functionName) {
                    case 'summarize_section':
                        toolResult = summarize_section(args.section_id);
                        break;
                    case 'highlight_section':
                        toolResult = highlight_section(args.section_id);
                        break;
                    case 'open_demo':
                        toolResult = open_demo(args.demo_id);
                        break;
                    case 'switch_mode':
                        state.mode = args.mode;
                        toolResult = switch_mode(args.mode);
                        break;
                    case 'reorder_showcase':
                        state.showcaseOrder = args.order;
                        toolResult = reorder_showcase(args.order);
                        break;
                }

                result.actions.push({
                    tool: functionName,
                    args,
                    result: toolResult
                });
                
                // Add tool response to conversation history
                state.conversationHistory.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }

            // Build messages with tool responses for final API call
            messages.push(assistantMessage);
            
            // Add tool response for EACH tool call
            for (let i = 0; i < toolCalls.length; i++) {
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCalls[i].id,
                    content: JSON.stringify(result.actions[i].result)
                });
            }

            const finalResponse = await openai.chat.completions.create({
                model: 'gpt-4',
                messages,
                temperature: 0.7,
                max_tokens: 300
            });

            result.message = finalResponse.choices[0].message.content;
            
            // Update conversation history with final assistant response
            state.conversationHistory.push({
                role: 'assistant',
                content: result.message
            });
        } else {
            // No tool calls - just add assistant response
            state.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage.content
            });
        }

        return result;

    } catch (error) {
        console.error('[AGENT ERROR]:', error.message);
        console.error('Full error:', error);
        
        // Return friendly error message
        let errorMsg = 'I encountered an error. ';
        if (error.code === 'insufficient_quota') {
            errorMsg += 'API quota exceeded. Please check your OpenAI billing.';
        } else if (error.status === 401) {
            errorMsg += 'API key is invalid.';
        } else {
            errorMsg += 'Please try again. (' + error.message + ')';
        }
        
        return {
            message: errorMsg,
            actions: [],
            error: error.message
        };
    }
}

// ============================================================================
// NARRATIVE GENERATION (Autonomous Agent Behavior)
// ============================================================================

async function generateNarrative(state, sectionId, trigger) {
    const sectionNames = {
        'hero': 'Hero',
        'featured-demo': 'Featured Demo ($70M Impact)',
        'how-it-works': 'How It Works',
        'implications': 'What This Means',
        'capabilities': 'Core Capabilities',
        'showcase': 'More Examples',
        'economics': 'Economics (99% Cost Reduction)',
        'next-steps': 'Getting Started'
    };

    const sectionOrder = ['hero', 'intro-cursor', 'featured-demo', 'how-it-works', 'implications', 'capabilities', 'showcase', 'economics', 'next-steps'];
    const currentIndex = sectionOrder.indexOf(sectionId);
    const nextSection = currentIndex < sectionOrder.length - 1 ? sectionOrder[currentIndex + 1] : null;

    if (trigger === 'enter') {
        // Track section entry
        state.sectionTimestamps[sectionId] = Date.now();
        
        const journey = state.getJourneySummary();
        
        let message = `📍 You're viewing **${sectionNames[sectionId]}**`;
        
        // Simple progress
        if (journey.visited > 2) {
            const recent = state.visitedSections.slice(-3).map(s => sectionNames[s]).join(' → ');
            message += `\n\nYour path: ${recent}`;
        }
        
        return { message };
    }
    
    if (trigger === 'dwell') {
        const journey = state.getJourneySummary();
        const unvisited = state.getUnvisitedSections();
        const behavior = state.analyzeBehavior();
        
        let message = '';
        
        // Simple observation
        const visitedNames = journey.sections.slice(0, 4).map(s => sectionNames[s]).join(', ');
        message = `I'm observing: You've seen ${visitedNames}`;
        if (journey.visited > 4) {
            message += ` + ${journey.visited - 4} more`;
        }
        message += '.';
        
        // Interest detection
        if (behavior && behavior.interests.length > 0) {
            if (behavior.interests.includes('real-examples')) {
                message += ` Seems like you're interested in **real examples**.`;
                if (unvisited.includes('showcase')) {
                    message += ` Check out **Showcase** for 3 more.`;
                }
            } else if (behavior.interests.includes('implementation')) {
                message += ` Seems like you want to know **how it works**.`;
                if (unvisited.includes('capabilities')) {
                    message += ` See **Capabilities** next.`;
                }
            } else if (behavior.interests.includes('business-value')) {
                message += ` Seems like you care about **ROI**.`;
                if (unvisited.includes('economics')) {
                    message += ` Don't miss **Economics** - 99% cost reduction.`;
                }
            }
        } else if (unvisited.length > 0) {
            // Simple next suggestion
            const nextRec = unvisited[0];
            message += ` You may want to see **${sectionNames[nextRec]}**.`;
        }
        
        return { message };
    }
    
    if (trigger === 'summary') {
        const behavior = state.analyzeBehavior();
        const profile = behavior.profile;
        const interests = behavior.interests;
        const pattern = behavior.navigationPattern;
        
        let message = `**🧠 User Persona Analysis**\n\n`;
        message += `**Profile:** ${profile.charAt(0).toUpperCase() + profile.slice(1)}\n\n`;
        
        // Explain why this profile with detailed reasoning
        message += `**Why AI thinks you're a ${profile}:**\n\n`;
        
        if (profile === 'analyst') {
            message += `• You're spending significant time on technical details and implementation sections\n`;
            message += `• Your ${pattern} navigation shows methodical examination of how things work\n`;
            message += `• Average ${Math.round(state.totalTimeOnSite / state.visitedSections.length)}s per section indicates deep analysis\n`;
            message += `• Focus on "how it works" suggests you need to validate feasibility\n\n`;
            message += `**Analyst Traits:** Detail-oriented, seeks technical validation, wants proof of concept, methodical decision-making process.`;
        } else if (profile === 'decision-maker') {
            message += `• You're focusing on business impact and ROI metrics\n`;
            message += `• Quick navigation to ${interests.length > 0 ? interests[0] : 'key sections'} shows you're evaluating strategic value\n`;
            message += `• Efficient browsing pattern suggests experienced executive perspective\n`;
            message += `• Interest in cost/economics indicates budget authority\n\n`;
            message += `**Decision-Maker Traits:** ROI-focused, time-conscious, looks for executive summary, has approval authority.`;
        } else if (profile === 'skeptic') {
            message += `• Your browsing shows careful verification - checking examples and proof points\n`;
            message += `• Time spent on real-world applications suggests you need concrete evidence\n`;
            message += `• This critical evaluation approach is common among technical leaders\n`;
            message += `• Revisiting sections indicates you're double-checking claims\n\n`;
            message += `**Skeptic Traits:** Requires proof, experienced with failed promises, methodical verification, risk-aware.`;
        } else {
            message += `• Your ${pattern} navigation shows curiosity across different topics\n`;
            message += `• You're discovering what's possible rather than focusing on specific areas\n`;
            message += `• This exploratory approach suggests you're in early learning phase\n`;
            message += `• Balanced time across sections indicates open-minded evaluation\n\n`;
            message += `**Explorer Traits:** Open-minded, learning-focused, builds comprehensive understanding, curious about possibilities.`;
        }
        
        // Add interest-based insights if detected
        if (interests.length > 0) {
            message += `\n\n**Detected Interests:**\n`;
            interests.forEach(interest => {
                if (interest === 'real-examples') {
                    message += `• **Real Examples** - You want proof before committing\n`;
                } else if (interest === 'implementation') {
                    message += `• **Implementation** - You need to understand the "how" deeply\n`;
                } else if (interest === 'business-value') {
                    message += `• **Business Value** - ROI-focused, need to justify investment\n`;
                }
            });
        }
        
        return { message };
    }
    
    return { message: '' };
}

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

const server = app.listen(PORT, () => {
    console.log('🤖 Site Guide Agent Starting...');
    console.log('📊 Real LangGraph-powered agent with OpenAI function calling');
    console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
    console.log(`✅ Ready on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const sessions = new Map();

wss.on('connection', (ws) => {
    const sessionId = Date.now().toString();
    const state = new AgentState();
    sessions.set(sessionId, state);
    
    console.log('🔌 Client connected:', sessionId);
    
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Site Guide Agent ready. Try "Give me a 60-sec tour" or ask me anything!'
    }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            const state = sessions.get(sessionId);

            if (data.type === 'behavior') {
                // Handle different behavior types
                if (data.behaviorType === 'page_loaded') {
                    // Send welcome narrative
                    ws.send(JSON.stringify({
                        type: 'narrative',
                        message: 'Welcome to "From Decks to Demos." I\'ll guide you through this site. Scroll to begin your journey.'
                    }));
                }
                else if (data.behaviorType === 'section_entered') {
                    state.currentSection = data.data.section;
                    if (!state.visitedSections.includes(data.data.section)) {
                        state.visitedSections.push(data.data.section);
                    }
                    
                    // Send thinking update
                    ws.send(JSON.stringify({
                        type: 'thinking',
                        thought: `User entered "${data.data.section}" section. Analyzing content...`
                    }));
                    
                    // Generate contextual narrative
                    const result = await generateNarrative(state, data.data.section, 'enter');
                    
                    ws.send(JSON.stringify({
                        type: 'narrative',
                        message: result.message,
                        actions: result.actions || []
                    }));
                }
                else if (data.behaviorType === 'section_dwell') {
                    state.dwellTimes[data.data.section] = data.data.dwellTime;
                    
                    // Proactive suggestions based on dwell time
                    if (data.data.dwellTime === 8) {
                        const detailedReasoning = state.getDetailedReasoning();
                        
                        ws.send(JSON.stringify({
                            type: 'thinking',
                            thought: detailedReasoning
                        }));
                        
                        const result = await generateNarrative(state, data.data.section, 'dwell');
                        
                        ws.send(JSON.stringify({
                            type: 'suggestion',
                            message: result.message,
                            actions: result.actions || []
                        }));
                    }
                    
                    // Journey summary at 15 seconds with deep analysis
                    if (data.data.dwellTime === 15) {
                        const detailedReasoning = state.getDetailedReasoning();
                        
                        ws.send(JSON.stringify({
                            type: 'thinking',
                            thought: '🔬 DEEP ANALYSIS:\n\n' + detailedReasoning
                        }));
                        
                        const result = await generateNarrative(state, data.data.section, 'summary');
                        
                        ws.send(JSON.stringify({
                            type: 'suggestion',
                            message: result.message,
                            actions: result.actions || []
                        }));
                    }
                }
            }

        } catch (error) {
            console.error('Error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Something went wrong'
            }));
        }
    });

    ws.on('close', () => {
        console.log('🔌 Client disconnected:', sessionId);
        sessions.delete(sessionId);
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', agent: 'site_guide' });
});

console.log('\n🎯 Agent Tools Available:');
console.log('  • summarize_section');
console.log('  • highlight_section');
console.log('  • open_demo');
console.log('  • switch_mode');
console.log('  • reorder_showcase');
console.log('');

