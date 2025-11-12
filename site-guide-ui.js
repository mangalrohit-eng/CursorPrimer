/**
 * Site Guide Agent - Frontend UI Integration
 * Real-time connection to LangGraph agent backend
 */

class SiteGuideAgent {
    constructor() {
        this.apiUrl = null;
        this.sessionId = null;
        this.currentSection = null;
        this.dwellTimers = {};
    }
    
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substring(2) + Date.now();
    }

    async connect() {
        // Use HTTP POST instead of WebSocket for Vercel compatibility
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/agent'
            : '/api/agent';
        
        this.sessionId = this.generateSessionId();
        this.updateStatus('connected');
        console.log('🤖 Site Guide Agent Connected (HTTP mode)');
        
        return Promise.resolve();
            
    }
    
    handleAnalysis(data) {
        console.log('📊 Analysis received:', data);
        
        // Combine thinking and narrative into one unified summary
        const summaryEl = document.querySelector('#agent-summary .summary-content');
        if (!summaryEl) return;
        
        let html = '';
        
        // Add thinking details
        if (data.thinking) {
            if (data.thinking.journey) {
                html += `<p class="summary-item"><strong>Journey:</strong> ${data.thinking.journey}</p>`;
            }
            if (data.thinking.mostInterested) {
                html += `<p class="summary-item"><strong>Focus:</strong> ${data.thinking.mostInterested}</p>`;
            }
            if (data.thinking.profile) {
                html += `<p class="summary-item"><strong>Profile:</strong> ${data.thinking.profile}</p>`;
            }
            if (data.thinking.motivation) {
                html += `<p class="summary-item"><strong>Motivation:</strong> ${data.thinking.motivation}</p>`;
            }
            if (data.thinking.interests) {
                html += `<p class="summary-item"><strong>Interests:</strong> ${data.thinking.interests}</p>`;
            }
        }
        
        // Add AI narrative
        if (data.narrative) {
            const formattedNarrative = data.narrative
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\n\n/g, '</p><p class="narrative-text">')
                .replace(/\n/g, '<br>');
            
            html += `<div class="narrative-section"><p class="narrative-text">${formattedNarrative}</p></div>`;
        }
        
        summaryEl.innerHTML = html;
        this.showNotificationBadge();
    }

    async sendBehaviorUpdate(behaviorType, data) {
        if (!this.apiUrl || !this.sessionId) {
            console.warn('Agent not initialized:', { apiUrl: this.apiUrl, sessionId: this.sessionId });
            return;
        }

        // Show what the agent is observing
        const observations = {
            'page_loaded': '👁️ Page loaded',
            'section_entered': `👁️ User entered: ${data.section}`,
            'section_dwell': `⏱️ User dwelling on ${data.section} (${data.dwellTime}s)`
        };

        console.log('[Agent Observing]', observations[behaviorType] || behaviorType);

        // Show "Updating..." status while waiting for analysis
        const summaryEl = document.querySelector('#agent-summary .summary-content');
        if (summaryEl && behaviorType === 'section_dwell' && data.dwellTime >= 3) {
            const titleEl = document.querySelector('#agent-summary .summary-title');
            if (titleEl) {
                titleEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            }
        }

        try {
            console.log('Sending to agent:', this.apiUrl, {
                sessionId: this.sessionId,
                type: 'behavior',
                data: { behaviorType, ...data }
            });
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    type: 'behavior',
                    data: {
                        behaviorType,
                        ...data
                    }
                })
            });
            
            console.log('Agent response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Agent result:', result);
                
                if (result.type === 'analysis') {
                    // Reset title to "User Summary"
                    const titleEl = document.querySelector('#agent-summary .summary-title');
                    if (titleEl) {
                        titleEl.textContent = 'User Summary';
                    }
                    this.handleAnalysis(result);
                } else {
                    console.log('Result type:', result.type, '(not analysis, so no action)');
                }
            } else {
                const errorText = await response.text();
                console.error('Agent error response:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error sending behavior update:', error);
            
            // Show error in thinking panel
            if (thinkingEl) {
                thinkingEl.innerHTML = `
                    <div class="thought-item" style="color: #ff6b6b;">
                        ⚠️ Agent offline or error occurred
                    </div>
                `;
            }
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log('🤖 AI Guide: Connected and monitoring');
                this.updateNarrative('AI Guide connected. Observing your journey...', 'system');
                break;
            
            case 'thinking':
                console.log('🧠 AI Reasoning:', data.thought);
                this.showThinking(data.thought);
                break;
            
            case 'tool_call':
                console.log('🔧 AI Action:', data.tool, data.args);
                this.showToolCall(data.tool, data.args);
                break;
            
            case 'agent_response':
            case 'narrative':
                console.log('💬 AI Narrative:', data.message);
                this.updateNarrative(data.message, 'narrative');
                this.executeActions(data.actions);
                break;
            
            case 'suggestion':
                console.log('💡 AI Suggestion:', data.message);
                // Show notification badge on toggle button
                this.showNotificationBadge();
                this.updateNarrative(`💡 ${data.message}`, 'suggestion');
                this.executeActions(data.actions);
                break;
            
            case 'error':
                console.log('❌ AI Error:', data.message);
                this.updateNarrative(data.message, 'error');
                break;
        }
    }

    executeActions(actions) {
        if (!actions || actions.length === 0) return;

        for (const action of actions) {
            console.log('[ACTION]', action.tool, action.args);
            
            switch (action.tool) {
                case 'summarize_section':
                    // Summary is in the message
                    break;
                
                case 'highlight_section':
                    this.highlightSection(action.args.section_id);
                    break;
                
                case 'open_demo':
                    this.openDemo(action.result);
                    break;
                
                case 'switch_mode':
                    this.switchMode(action.args.mode);
                    break;
                
                case 'reorder_showcase':
                    this.reorderShowcase(action.args.order);
                    break;
            }
        }
    }

    highlightSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Smooth scroll
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Highlight effect
        section.style.outline = '3px solid #A100FF';
        section.style.outlineOffset = '-3px';
        
        setTimeout(() => {
            section.style.outline = '';
            section.style.outlineOffset = '';
        }, 2000);
    }

    openDemo(result) {
        this.addMessage('Agent', `Opening ${result.title}...`, 'action');
        // In real implementation, would open actual demo
        window.open(result.url, '_blank');
    }

    switchMode(mode) {
        document.body.classList.toggle('executive-mode', mode === 'executive');
        this.addMessage('System', `Switched to ${mode} mode`, 'system');
    }

    reorderShowcase(order) {
        const showcaseGrid = document.querySelector('.showcase-grid');
        if (!showcaseGrid) return;

        const cards = {};
        order.forEach(id => {
            const card = document.getElementById(id);
            if (card) cards[id] = card;
        });

        // Reorder
        order.forEach(id => {
            if (cards[id]) {
                showcaseGrid.appendChild(cards[id]);
            }
        });

        this.addMessage('System', 'Showcase reordered', 'action');
    }

    trackSectionChange(sectionId) {
        if (this.currentSection === sectionId) return;
        
        const previousSection = this.currentSection;
        this.currentSection = sectionId;
        
        // Send behavior update
        this.sendBehaviorUpdate('section_entered', {
            section: sectionId,
            previousSection
        });

        // Start dwell timer
        this.startDwellTimer(sectionId);
    }

    startDwellTimer(sectionId) {
        // Clear existing timers
        Object.keys(this.dwellTimers).forEach(key => {
            clearInterval(this.dwellTimers[key]);
        });

        let dwellTime = 0;
        this.dwellTimers[sectionId] = setInterval(() => {
            dwellTime++;
            console.log(`⏱️ Dwell timer: ${sectionId} = ${dwellTime}s`);
            
            if (this.currentSection === sectionId) {
                // Send dwell time updates at specific intervals
                if (dwellTime === 3 || dwellTime === 8 || dwellTime % 15 === 0) {
                    console.log(`📤 Triggering analysis at ${dwellTime}s`);
                    this.sendBehaviorUpdate('section_dwell', {
                        section: sectionId,
                        dwellTime
                    });
                }
            }
        }, 1000);
    }

    showThinking(thought) {
        const thinkingEl = document.querySelector('#agent-thinking .thinking-content');
        if (!thinkingEl) {
            console.warn('Thinking element not found');
            return;
        }

        // Handle both string and object thinking data
        if (typeof thought === 'object') {
            let html = '<div class="detailed-thinking">';
            
            // Journey summary
            if (thought.journey) {
                html += `<div class="thought-item"><strong>🗺️ Journey:</strong> ${thought.journey}</div>`;
            }
            
            // Most interested section
            if (thought.mostInterested) {
                html += `<div class="thought-item"><strong>⏱️ Focus:</strong> ${thought.mostInterested}</div>`;
            }
            
            // Profile
            if (thought.profile) {
                html += `<div class="thought-item"><strong>👤 Profile:</strong> ${thought.profile}</div>`;
            }
            
            // Motivation
            if (thought.motivation) {
                html += `<div class="thought-item"><strong>🎯 Motivation:</strong> ${thought.motivation}</div>`;
            }
            
            // Interests
            if (thought.interests) {
                html += `<div class="thought-item"><strong>💡 Interests:</strong> ${thought.interests}</div>`;
            }
            
            // Prediction
            if (thought.prediction) {
                html += `<div class="thought-item"><strong>🔮 Prediction:</strong> ${thought.prediction}</div>`;
            }
            
            html += '</div>';
            thinkingEl.innerHTML = html;
            console.log('✅ Thinking displayed:', html);
        } else {
            thinkingEl.innerHTML = `
                <div class="thought-item">
                    <i class="fas fa-lightbulb"></i> ${thought}
                </div>
            `;
        }
        
        thinkingEl.style.opacity = '1';
    }

    showToolCall(tool, args) {
        const thinkingEl = document.querySelector('#agent-thinking .thinking-content');
        if (!thinkingEl) return;

        const toolIcons = {
            'summarize_section': 'fa-compress-alt',
            'highlight_section': 'fa-crosshairs',
            'open_demo': 'fa-external-link-alt',
            'switch_mode': 'fa-toggle-on',
            'reorder_showcase': 'fa-sort'
        };

        const icon = toolIcons[tool] || 'fa-cog';
        const argsStr = JSON.stringify(args).replace(/[{}"]/g, '').replace(/:/g, ': ');

        thinkingEl.innerHTML = `
            <div class="tool-call-item">
                <i class="fas ${icon}"></i> <strong>Calling:</strong> ${tool}(${argsStr})
            </div>
        `;
        thinkingEl.style.opacity = '1';
    }

    updateNarrative(text, type = 'narrative') {
        const narrativeEl = document.getElementById('agent-narrative');
        if (!narrativeEl) return;

        // Enhanced markdown support with better formatting
        let formattedText = text
            // Bold text
            .replace(/\*\*([^*]+)\*\*/g, '<strong class="highlight">$1</strong>')
            // Italic text
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Double line breaks = paragraph
            .replace(/\n\n/g, '</p><p>')
            // Single line breaks = line break
            .replace(/\n/g, '<br>')
            // Emoji bullets for better readability
            .replace(/💡/g, '<br><span class="insight-icon">💡</span>');
        
        // Wrap in paragraphs
        formattedText = `<p>${formattedText}</p>`;

        // Fade out
        narrativeEl.style.opacity = '0.5';
        
        setTimeout(() => {
            narrativeEl.innerHTML = `
                <div class="narrative-text ${type}">${formattedText}</div>
            `;
            // Fade in
            narrativeEl.style.opacity = '1';
        }, 200);
    }

    updateStatus(status) {
        const statusDot = document.querySelector('.agent-status-dot');
        const statusText = document.querySelector('.agent-status-text');
        
        if (statusDot) {
            statusDot.className = `agent-status-dot ${status}`;
        }
        if (statusText) {
            const texts = {
                connected: 'Monitoring',
                disconnected: 'Disconnected',
                error: 'Error'
            };
            statusText.textContent = texts[status] || status;
        }
    }
    
    showNotificationBadge() {
        const toggleBtn = document.querySelector('.agent-toggle-btn');
        if (!toggleBtn) return;
        
        // Add notification badge if not already there
        if (!toggleBtn.querySelector('.notification-badge')) {
            const badge = document.createElement('div');
            badge.className = 'notification-badge';
            badge.innerHTML = '!';
            toggleBtn.appendChild(badge);
            
            // Pulse animation
            toggleBtn.classList.add('has-notification');
        }
    }
    
    clearNotificationBadge() {
        const toggleBtn = document.querySelector('.agent-toggle-btn');
        if (!toggleBtn) return;
        
        const badge = toggleBtn.querySelector('.notification-badge');
        if (badge) {
            badge.remove();
            toggleBtn.classList.remove('has-notification');
        }
    }
}

// Global instance
const siteGuide = new SiteGuideAgent();

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    // Create toggle button (always visible)
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'agent-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-robot"></i>';
    toggleBtn.title = 'Toggle AI Copilot';
    toggleBtn.setAttribute('style', 'position: fixed; bottom: 2rem; right: 2rem; z-index: 99999;');
    document.body.appendChild(toggleBtn);
    console.log('✅ AI Agent button created and added to page');
    
    // Create UI - simplified narrator mode
    const agentUI = document.createElement('div');
    agentUI.className = 'agent-panel collapsed'; // Start hidden
    agentUI.innerHTML = `
        <div class="agent-header">
            <div class="agent-title">
                <i class="fas fa-robot"></i>
                <span>AI Guide</span>
            </div>
            <div class="agent-controls">
                <div class="agent-status">
                    <div class="agent-status-dot disconnected"></div>
                    <div class="agent-status-text">Observing...</div>
                </div>
                <button class="agent-collapse-btn" title="Minimize">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        </div>
        
        <div class="agent-summary" id="agent-summary">
            <div class="summary-title">User Summary</div>
            <div class="summary-content">
                <p class="status-text">Observing your journey...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(agentUI);
    
    // Toggle panel function
    const togglePanel = () => {
        const isCollapsed = agentUI.classList.toggle('collapsed');
        toggleBtn.classList.toggle('active', !isCollapsed);
        
        // Clear notification when opened
        if (!isCollapsed) {
            siteGuide.clearNotificationBadge();
        }
    };
    
    // Attach toggle listeners
    toggleBtn.addEventListener('click', togglePanel);
    agentUI.querySelector('.agent-collapse-btn').addEventListener('click', togglePanel);

    // Connect to agent
    try {
        await siteGuide.connect();
        // Send initial context
        siteGuide.sendBehaviorUpdate('page_loaded', {});
    } catch (error) {
        siteGuide.updateNarrative('Agent offline. Refresh to reconnect.', 'error');
    }

    // Track section changes with Intersection Observer
    const sections = document.querySelectorAll('section[id]');
    console.log('🔍 Found sections to observe:', sections.length);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            console.log('👁️ Section visibility:', entry.target.id, 'intersecting:', entry.isIntersecting, 'ratio:', entry.intersectionRatio);
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                console.log('✅ Tracking section change:', entry.target.id);
                siteGuide.trackSectionChange(entry.target.id);
            }
        });
    }, { threshold: [0, 0.3, 0.5, 0.7, 1.0] });

    sections.forEach(section => {
        console.log('📌 Observing section:', section.id);
        observer.observe(section);
    });
    
    // Manually trigger for the first visible section
    setTimeout(() => {
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            const rect = heroSection.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                console.log('🎯 Initial section: hero');
                siteGuide.trackSectionChange('hero');
            }
        }
    }, 500);
});

