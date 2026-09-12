(function () {
    'use strict';

    const initStackedCards = () => {
        const root = document.getElementById('stacked-cards-root');
        if (!root) return;

        if (!document.getElementById('sc-styles')) {
            const s = document.createElement('style');
            s.id = 'sc-styles';
            s.innerHTML = `
                @keyframes scHint {
                    0%,100%{opacity:0.35;transform:translateY(0)}
                    50%{opacity:0.65;transform:translateY(-4px)}
                }
                #sc-stage {
                    position: relative;
                    width: 340px; height: 460px;
                    perspective: 1200px;
                    perspective-origin: 50% 40%;
                    z-index: 10;
                    cursor: pointer;
                }
                .sc-card {
                    position: absolute;
                    width: 340px; min-height: 440px;
                    border-radius: 24px;
                    backdrop-filter: blur(12px);
                    padding: 32px 28px;
                    display: flex; flex-direction: column; gap: 20px;
                    user-select: none; will-change: transform;
                    transform-origin: center center;
                    box-sizing: border-box;
                }
                @media (max-width: 768px) {
                    #sc-stage { width: 270px; height: 380px; margin: 40px auto; }
                    .sc-card { width: 270px; min-height: 340px; padding: 20px 16px; gap: 10px; }
                }
            `;
            document.head.appendChild(s);
        }

        const CARDS = [
            {
                id: 0, label: '01',
                title: 'For Creators',
                subtitle: 'Creative Suite',
                description: 'Generate breathtaking art, compelling scripts, and engaging videos effortlessly. Focus on your craft, not your tools.',
                icon: 'fa-palette',
                accent: '#60a5fa',
                glow: 'rgba(59,130,246,0.5)',
                badge: 'AI-Powered',
                badgeIcon: 'fa-sparkles',
                gradient: 'linear-gradient(135deg,rgba(15,30,70,0.95) 0%,rgba(5,15,40,0.98) 100%)',
                highlights: ['AI Image & Video Gen', 'Script Writing', 'Style Transfer'],
            },
            {
                id: 1, label: '02',
                title: 'For Businesses',
                subtitle: 'Enterprise AI',
                description: 'Streamline operations, automate marketing campaigns, and boost team efficiency. Drive growth, simplify management.',
                icon: 'fa-briefcase',
                accent: '#a78bfa',
                glow: 'rgba(139,92,246,0.5)',
                badge: 'Multi-modal',
                badgeIcon: 'fa-bolt',
                gradient: 'linear-gradient(135deg,rgba(35,10,70,0.95) 0%,rgba(18,5,40,0.98) 100%)',
                highlights: ['Workflow Automation', 'Team Collaboration', 'Analytics & Reports'],
            },
            {
                id: 2, label: '03',
                title: 'For Students',
                subtitle: 'Study Partner',
                description: 'Accelerate research, summarize complex documents, and ace assignments. Your ultimate AI study companion.',
                icon: 'fa-graduation-cap',
                accent: '#2dd4bf',
                glow: 'rgba(45,212,191,0.5)',
                badge: 'Context-Aware',
                badgeIcon: 'fa-shield-halved',
                gradient: 'linear-gradient(135deg,rgba(0,40,35,0.95) 0%,rgba(0,20,18,0.98) 100%)',
                highlights: ['Deep Research', 'Document Summarize', 'Smart Flashcards'],
            },
            {
                id: 3, label: '04',
                title: 'For Marketers',
                subtitle: 'Growth Engine',
                description: 'Craft viral campaigns, optimize SEO, and generate data-driven marketing copy in seconds. Dominate the digital landscape.',
                icon: 'fa-bullhorn',
                accent: '#f472b6',
                glow: 'rgba(236,72,153,0.5)',
                badge: 'Growth-Focused',
                badgeIcon: 'fa-chart-line',
                gradient: 'linear-gradient(135deg,rgba(70,15,40,0.95) 0%,rgba(40,5,25,0.98) 100%)',
                highlights: ['AI Content Strategy', 'SEO Optimization', 'Ad Copy Creation'],
            },
        ];

        const getPositions = (type) => { 
            const mobile = window.innerWidth < 768;
            if (type === 'stacked') {
                return mobile ? [
                    { x: 0, y: -45, z: -60, rotY: 0, rotX: -10, scale: 0.88, opacity: 0.5 },
                    { x: 0, y: -30, z: -40, rotY: 0, rotX: -7,  scale: 0.92, opacity: 0.7 },
                    { x: 0, y: -15, z: -20, rotY: 0, rotX: -4,  scale: 0.96, opacity: 0.9 },
                    { x: 0, y: 0,   z: 0,   rotY: 0, rotX: 0,   scale: 1.00, opacity: 1.0 },
                ] : [
                    { x: 45,  y: 0, z: -60, rotY: 15, rotX: 0, scale: 0.90, opacity: 0.6 },
                    { x: 30,  y: 0, z: -40, rotY: 10, rotX: 0, scale: 0.93, opacity: 0.8 },
                    { x: 15,  y: 0, z: -20, rotY: 5,  rotX: 0, scale: 0.96, opacity: 0.9 },
                    { x: 0,   y: 0, z: 0,   rotY: 0,  rotX: 0, scale: 1.00, opacity: 1.0 },
                ];
            } else { 
                return mobile ? [
                    { x: 0, y: 0,    z: 10, rotY: 0, rotX: 0, scale: 1.00, opacity: 1 },
                    { x: 0, y: 410,  z: 0,  rotY: 0, rotX: 0, scale: 0.98, opacity: 1 },
                    { x: 0, y: 820,  z: 0,  rotY: 0, rotX: 0, scale: 0.96, opacity: 1 },
                    { x: 0, y: 1230, z: 0,  rotY: 0, rotX: 0, scale: 0.94, opacity: 1 },
                ] : [
                    { x: -520, y: 0, z: 20, rotY: 8,  rotX: 0, scale: 0.95, opacity: 1 },
                    { x: -180, y: 0, z: 40, rotY: 4,  rotX: 0, scale: 0.98, opacity: 1 },
                    { x: 180,  y: 0, z: 40, rotY: -4, rotX: 0, scale: 0.98, opacity: 1 },
                    { x: 520,  y: 0, z: 20, rotY: -8, rotX: 0, scale: 0.95, opacity: 1 },
                ];
            }
        };

        const buildCardHTML = (card) => `
            <div class="sc-card" id="sc-card-${card.id}"
                style="background:${card.gradient}; border:1px solid ${card.accent}30; box-shadow:0 0 60px ${card.glow}, 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);">
                <!-- Top Row -->
                <div style="display:flex; align-items:flex-start; justify-content:space-between;">
                    <div style="width:56px; height:56px; border-radius:16px; background:linear-gradient(135deg,${card.accent}22,${card.accent}44); border:1px solid ${card.accent}50; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px ${card.glow};">
                        <i class="fa-solid ${card.icon}" style="font-size:26px; color:${card.accent};"></i>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px; background:${card.accent}14; border:1px solid ${card.accent}35; font-size:0.65rem; font-weight:700; color:${card.accent}; letter-spacing:0.05em;">
                        <i class="fa-solid ${card.badgeIcon}" style="font-size:10px; color:${card.accent};"></i>
                        ${card.badge}
                    </div>
                </div>
                <!-- Subtitle -->
                <div style="font-size:0.68rem; font-weight:700; color:${card.accent}; letter-spacing:0.12em; text-transform:uppercase;">${card.subtitle}</div>
                <!-- Title -->
                <h3 style="font-size:1.65rem; font-weight:900; color:#f8fafc; line-height:1.15; letter-spacing:-0.02em; margin:0;">${card.title}</h3>
                <!-- Description -->
                <p style="font-size:0.88rem; color:rgba(203,213,225,0.72); line-height:1.7; margin:0;">${card.description}</p>
                <!-- Highlights -->
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:4px;">
                    ${card.highlights.map(h => `
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:6px; height:6px; border-radius:50%; flex-shrink:0; background:${card.accent}; box-shadow:0 0 8px ${card.glow};"></div>
                            <span style="font-size:0.82rem; color:rgba(226,232,240,0.8); font-weight:500;">${h}</span>
                        </div>
                    `).join('')}
                </div>
                <!-- Bottom bar -->
                <div style="margin-top:auto; padding-top:20px;">
                    <div style="height:3px; border-radius:2px; background:linear-gradient(90deg,${card.accent},${card.accent}33); box-shadow:0 0 12px ${card.accent}44;"></div>
                </div>
                <!-- Big label -->
                <div style="position:absolute; bottom:16px; right:18px; font-size:4.5rem; font-weight:900; line-height:1; color:${card.accent}15; user-select:none; pointer-events:none; letter-spacing:-0.04em;">${card.label}</div>
            </div>
        `;

        const secId = 'sc-section-' + Math.random().toString(36).substr(2, 9);
        root.innerHTML = `
            <section id="${secId}" style="position:relative; padding:40px 1rem; display:flex; flex-direction:column; align-items:center; background:linear-gradient(180deg,rgba(4,4,14,1) 0%,rgba(6,6,20,1) 100%); transition: min-height 0.6s ease; z-index: 11;">
                <!-- BG Glows -->
                <div style="position:absolute; top:20%; left:10%; width:40vw; height:40vw; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%); filter:blur(60px); pointer-events:none;"></div>
                <div style="position:absolute; bottom:15%; right:10%; width:35vw; height:35vw; border-radius:50%; background:radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 70%); filter:blur(60px); pointer-events:none;"></div>
                
                <!-- Header -->
                <div style="text-align:center; margin-bottom:2.5rem; position:relative; z-index:10; max-width:600px;">
                    <div style="display:inline-flex; align-items:center; gap:7px; padding:5px 16px; border-radius:999px; background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.25); margin-bottom:1.5rem;">
                        <i class="fa-solid fa-sparkles" style="font-size:12px; color:#a78bfa;"></i>
                        <span style="font-size:0.7rem; font-weight:700; letter-spacing:0.12em; color:#a78bfa;">BUILT FOR EVERYONE</span>
                    </div>
                    <h2 style="font-size:clamp(2rem,5vw,3.5rem); font-weight:900; color:#f8fafc; margin-bottom:1rem; letter-spacing:-0.03em; line-height:1.1;">
                        Built for the <span style="background:linear-gradient(135deg,#60a5fa,#a78bfa,#e879f9); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; filter:drop-shadow(0 0 20px rgba(139,92,246,0.4));">AI Era</span>
                    </h2>
                    <p style="font-size:1rem; color:rgba(148,163,184,0.65); line-height:1.7; margin:0; padding:0 20px;">
                        Four core personas that make AISA™ the most versatile AI platform for everyone.
                    </p>
                </div>
                
                <!-- 3D Card Stage -->
                <div id="sc-stage" style="transform-style: preserve-3d;">
                    ${[...CARDS].reverse().map(card => buildCardHTML(card)).join('')}
                </div>

                <!-- Hint -->
                <p style="margin-top:3rem; font-size:0.78rem; color:rgba(148,163,184,0.35); letter-spacing:0.06em; z-index:10; position:relative; animation:scHint 2s ease-in-out infinite;">
                    ↔ Hover to explore
                </p>
            </section>
        `;

        if (typeof gsap === 'undefined') return;

        const cardEls = CARDS.map(c => document.getElementById(`sc-card-${c.id}`));
        let isSpread = false;

        const initialStacked = getPositions('stacked');
        cardEls.forEach((el, i) => {
            if (!el) return;
            const p = initialStacked[i];
            gsap.set(el, { x: p.x, y: p.y, z: p.z, rotateY: p.rotY, rotateX: p.rotX, scale: p.scale, opacity: p.opacity, yPercent: 0 });
        });

        const applyPositions = (type, dur = 0.65, ease = 'power3.out') => {
            const positions = getPositions(type);
            cardEls.forEach((el, i) => {
                if (!el) return;
                const p = positions[i];
                gsap.to(el, { x: p.x, y: p.y, z: p.z, rotateY: p.rotY, rotateX: p.rotX, scale: p.scale, opacity: p.opacity, duration: dur, ease, overwrite: 'auto' });
            });
        };

        const stage = document.getElementById('sc-stage');
        if (stage) {
            const toggleSpread = (state) => {
                if (state === isSpread) return;
                isSpread = state;
                applyPositions(isSpread ? 'spread' : 'stacked', 0.65, isSpread ? 'power3.out' : 'power3.inOut');
                
                const sec = document.getElementById(secId);
                const stage = document.getElementById('sc-stage');
                if (sec && stage) {
                    const isMobile = window.innerWidth < 768;
                    sec.style.minHeight = isSpread ? (isMobile ? '1850px' : 'auto') : 'auto';
                    if (isMobile) {
                        stage.style.height = isSpread ? '1700px' : '380px';
                    }
                    setTimeout(() => ScrollTrigger.refresh(), 650);
                }
            };

            stage.addEventListener('mouseenter', () => (window.innerWidth >= 768) && toggleSpread(true));
            stage.addEventListener('mouseleave', () => (window.innerWidth >= 768) && toggleSpread(false));
            
            stage.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    toggleSpread(!isSpread);
                }
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStackedCards);
    } else {
        initStackedCards();
    }
})();
