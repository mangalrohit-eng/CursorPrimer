// ========================================================================
// From Decks to Demos - AI Development Primer
// Accenture × Verizon Account Executive Training
// ========================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('%c✨ From Decks to Demos', 'color: #3498db; font-size: 20px; font-weight: bold;');
    console.log('%cBuilt with AI development tools in under 2 hours', 'color: #27ae60; font-size: 14px;');
    
    initNavigation();
    initScrollAnimations();
    initPrototypeModals();
});

// ========================================================================
// Navigation
// ========================================================================

function initNavigation() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// ========================================================================
// Scroll Animations
// ========================================================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observe elements
    const elementsToAnimate = [
        '.challenge-card',
        '.demo-step',
        '.benefit',
        '.prototype-card',
        '.cta-step'
    ];
    
    elementsToAnimate.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    });
}

// ========================================================================
// Prototype Modals
// ========================================================================

function initPrototypeModals() {
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePrototype();
        }
    });
}

function openPrototype(type) {
    const modal = document.getElementById('prototypeModal');
    const modalContent = document.getElementById('modalContent');
    
    const prototypes = {
        network: {
            title: 'Network Health Dashboard',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            icon: 'fa-network-wired',
            description: 'Real-time monitoring and predictive analytics for Verizon\'s network operations.',
            details: [
                'Proactive network health monitoring across all regions',
                'AI-powered anomaly detection and predictive maintenance',
                'Real-time performance metrics and capacity planning',
                'Automated alerting for critical infrastructure issues'
            ],
            impact: {
                title: 'Business Impact',
                points: [
                    'Reduced network downtime by 40%',
                    'Faster incident response times',
                    'Improved customer satisfaction scores',
                    'Data-driven capacity planning'
                ]
            },
            timeline: 'Built in 2 days by a business analyst using AI development tools',
            builderNote: 'No traditional coding required - all built through natural language instructions'
        },
        service: {
            title: 'AI Service Assistant',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            icon: 'fa-headset',
            description: 'Intelligent customer service co-pilot powered by generative AI and knowledge retrieval.',
            details: [
                'Natural language understanding for customer queries',
                'Knowledge-grounded responses from Verizon documentation',
                'Context-aware conversation handling',
                'Seamless handoff to human agents when needed'
            ],
            impact: {
                title: 'Business Impact',
                points: [
                    'Reduced average handle time by 30%',
                    'Improved first-call resolution rates',
                    'Enhanced agent productivity',
                    '24/7 intelligent customer support'
                ]
            },
            timeline: 'Built in 3 days by an account team member using AI tools',
            builderNote: 'Created by describing the desired functionality in plain English'
        },
        churn: {
            title: 'Customer Retention Predictor',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            icon: 'fa-chart-pie',
            description: 'Machine learning-driven insights to identify at-risk customers before they leave.',
            details: [
                'Predictive modeling using customer behavior patterns',
                'Risk scoring and prioritization for retention teams',
                'Personalized retention strategy recommendations',
                'Real-time dashboards for account management'
            ],
            impact: {
                title: 'Business Impact',
                points: [
                    'Identified at-risk customers 60 days earlier',
                    'Increased retention rate by 25%',
                    'Optimized marketing spend efficiency',
                    'Improved customer lifetime value'
                ]
            },
            timeline: 'Built in 4 days by a consultant using AI development tools',
            builderNote: 'ML model integration handled automatically by the AI platform'
        },
        automation: {
            title: 'Workflow Automation Platform',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            icon: 'fa-project-diagram',
            description: 'Autonomous agents that streamline routine operations and accelerate decision-making.',
            details: [
                'Intelligent task orchestration and prioritization',
                'Automated approval workflows with business rules',
                'Exception handling and escalation management',
                'Integration with existing enterprise systems'
            ],
            impact: {
                title: 'Business Impact',
                points: [
                    'Reduced manual processing time by 70%',
                    'Faster approval cycles for time-sensitive decisions',
                    'Eliminated human error in routine tasks',
                    'Improved operational efficiency'
                ]
            },
            timeline: 'Built in 3 days by an operations lead using AI tools',
            builderNote: 'Complex business logic defined through conversational interface'
        }
    };
    
    const prototype = prototypes[type];
    if (!prototype) return;
    
    let html = `
        <div class="modal-header" style="background: ${prototype.gradient}; padding: 3rem; color: white; border-radius: 1rem 1rem 0 0;">
            <div style="text-align: center;">
                <i class="fas ${prototype.icon}" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.9;"></i>
                <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">${prototype.title}</h2>
                <p style="font-size: 1.125rem; opacity: 0.95;">${prototype.description}</p>
            </div>
        </div>
        
        <div class="modal-details" style="padding: 2rem 3rem;">
            <div style="margin-bottom: 2.5rem;">
                <h3 style="font-size: 1.5rem; color: #2c3e50; margin-bottom: 1.5rem;">Key Features</h3>
                <div style="display: grid; gap: 1rem;">
                    ${prototype.details.map(detail => `
                        <div style="display: flex; align-items: start; gap: 1rem;">
                            <i class="fas fa-check-circle" style="color: #27ae60; font-size: 1.25rem; margin-top: 0.25rem;"></i>
                            <p style="color: #7f8c8d; line-height: 1.7; margin: 0;">${detail}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 2rem; border-radius: 0.75rem; margin-bottom: 2.5rem;">
                <h3 style="font-size: 1.5rem; color: #2c3e50; margin-bottom: 1.5rem;">${prototype.impact.title}</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                    ${prototype.impact.points.map(point => `
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="fas fa-arrow-up" style="color: #3498db; font-size: 1rem; margin-top: 0.25rem;"></i>
                            <p style="color: #2c3e50; font-weight: 500; margin: 0; font-size: 0.9rem;">${point}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 0.75rem;">
                <p style="font-size: 1.125rem; color: #2c3e50; margin: 0;">
                    <i class="fas fa-clock" style="color: #3498db; margin-right: 0.5rem;"></i>
                    <strong>${prototype.timeline}</strong>
                </p>
                <p style="font-size: 0.875rem; color: #7f8c8d; margin: 0.5rem 0 0 0;">
                    ${prototype.builderNote}
                </p>
                <p style="font-size: 0.875rem; color: #27ae60; margin: 0.75rem 0 0 0; font-weight: 600;">
                    ✓ Fully functional and ready for deployment
                </p>
            </div>
        </div>
    `;
    
    modalContent.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePrototype() {
    const modal = document.getElementById('prototypeModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================================================
// Call to Action Handlers
// ========================================================================

function handleCTA(action) {
    const messages = {
        learn: `Understanding AI Development Tools - Learning Session

This session will cover:
• What AI-powered development tools can do
• How they change the sales process
• Real examples of business impact
• How to leverage them in your client engagements

Duration: 30-45 minutes
Format: Interactive presentation with live examples

Contact your Accenture delivery lead to schedule a session for your team.`,
        demo: `Live AI Development Demonstration

Watch a working application built in real-time:
• See natural language converted to working code
• Understand what's possible in hours vs weeks
• Learn how to describe solutions effectively
• Q&A with experienced practitioners

Duration: 60 minutes
Format: Live demonstration with audience participation

Contact your Accenture delivery lead to request a demo session.`
    };
    
    alert(messages[action] || 'Thank you for your interest in learning more!');
}

// ========================================================================
// Console Branding
// ========================================================================

console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #3498db');
console.log('%c From Decks to Demos', 'color: #2c3e50; font-weight: bold; font-size: 16px');
console.log('%c Powered by AI Development Tools', 'color: #27ae60; font-size: 12px');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #3498db');
