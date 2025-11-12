/**
 * Site Guide Agent - Frontend UI Integration
 * Real-time connection to LangGraph agent backend
 */

class SiteGuideAgent {
    constructor() {
        this.ws = null;
        this.currentSection = null;
        this.dwellTimers = {};
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Auto-detect WebSocket URL for local and production
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
            this.ws = new WebSocket(`${wsProtocol}//${wsHost}`);
            
            this.ws.onopen = () => {
                console.log('🤖 Site Guide Agent Connected');
                this.updateStatus('connected');
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('error');
                reject(error);
            };
            
            this.ws.onclose = () => {
                console.log('🤖 Disconnected');
                this.updateStatus('disconnected');
            };
        });
    }

    sendBehaviorUpdate(behaviorType, data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        // Show what the agent is observing
        const observations = {
            'page_loaded': '👁️ Page loaded',
            'section_entered': `👁️ User entered: ${data.section}`,
            'section_dwell': `⏱️ User dwelling on ${data.section} (${data.dwellTime}s)`
        };

        const thinkingEl = document.querySelector('#agent-thinking .thinking-content');
        if (thinkingEl && observations[behaviorType]) {
            thinkingEl.innerHTML = `
                <div class="observation-item">
                    ${observations[behaviorType]}
                </div>
            `;
            thinkingEl.style.opacity = '1';
        }

        this.ws.send(JSON.stringify({
            type: 'behavior',
            behaviorType,
            data,
            currentSection: this.currentSection,
            timestamp: Date.now()
        }));
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
            
            if (this.currentSection === sectionId) {
                // Send dwell time updates at specific intervals
                if (dwellTime === 3 || dwellTime === 8 || dwellTime % 15 === 0) {
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
        if (!thinkingEl) return;

        thinkingEl.innerHTML = `
            <div class="thought-item">
                <i class="fas fa-lightbulb"></i> ${thought}
            </div>
        `;
        
        // Auto-fade after 3 seconds
        setTimeout(() => {
            if (thinkingEl.innerHTML.includes(thought)) {
                thinkingEl.style.opacity = '0.5';
            }
        }, 3000);
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

        // Simple markdown support
        const formattedText = text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '<br><br>');

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
        
        <div class="agent-thinking" id="agent-thinking">
            <div class="thinking-label"><i class="fas fa-brain"></i> Agent Reasoning:</div>
            <div class="thinking-content"></div>
        </div>
        
        <div class="agent-narrative" id="agent-narrative">
            <div class="narrative-text">Welcome! I'm watching your journey through this site and will guide you along the way.</div>
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

