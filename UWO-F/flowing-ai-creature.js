(function() {
    'use strict';

    const initFlowingAICreature = () => {
        // Only initialize once
        if (document.getElementById('flowing-ai-container')) return;

        // 1. Inject Styles
        const style = document.createElement('style');
        style.id = 'flowing-ai-styles';
        style.innerHTML = `
            @keyframes aiPulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
            }
            @keyframes aiSpinSlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes aiSpinSlowReverse {
                from { transform: rotate(360deg); }
                to { transform: rotate(0deg); }
            }
            @keyframes aiFloat {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(10px, 20px) rotate(2deg); }
            }

            #flowing-ai-container {
                position: fixed;
                width: 480px; height: 480px;
                z-index: 5; pointer-events: none;
                display: flex; align-items: center; justify-content: center;
                will-change: transform, opacity, filter;
                opacity: 0; left: 50%; top: 45%;
                transform: translate(-50%, -50%) scale(0.8);
            }
            
            .ai-digital-core {
                position: relative;
                display: flex; align-items: center; justify-content: center;
                width: 450px; height: 450px; pointer-events: none;
            }
            
            .ai-bg-glow {
                position: absolute; inset: 0; border-radius: 50%;
                background: rgba(99, 102, 241, 0.25);
                filter: blur(90px); animation: aiPulse 4s ease-in-out infinite;
                transition: background 1s ease;
            }
            
            .ai-orbital-1 {
                position: absolute; width: 340px; height: 340px;
                border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 50%;
                animation: aiSpinSlow 20s linear infinite; opacity: 0.3;
            }
            .ai-orbital-2 {
                position: absolute; width: 300px; height: 300px;
                border: 1px solid rgba(217, 70, 239, 0.2); border-radius: 50%;
                animation: aiSpinSlowReverse 25s linear infinite; opacity: 0.2;
            }
            .ai-inner-ring {
                position: absolute; width: 240px; height: 240px; border-radius: 50%;
                border: 2px dashed rgba(99, 102, 241, 0.3);
                animation: aiSpinSlow 15s linear infinite;
            }
            
            .ai-core-orb {
                position: relative; width: 176px; height: 176px;
            }
            
            .ai-glass-content {
                position: absolute; inset: 0; border-radius: 50%;
                backdrop-filter: blur(64px); -webkit-backdrop-filter: blur(64px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 0 80px rgba(99, 102, 241, 0.5);
                display: flex; align-items: center; justify-content: center; overflow: hidden;
                background: linear-gradient(to top right, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4), rgba(232, 121, 249, 0.4));
            }
            .ai-glass-highlight {
                position: absolute; inset: 0;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 70%);
            }
            .ai-internal-pulse {
                width: 80px; height: 80px; background: white; border-radius: 50%;
                filter: blur(24px); animation: aiPulse 3s ease-in-out infinite; opacity: 0.4;
            }
            .ai-sparkle-icon {
                position: relative; z-index: 10; color: white;
                font-size: 48px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));
            }
            
            .ai-particle-group-1 {
                position: absolute; inset: 0; animation: aiSpinSlow 3s linear infinite;
            }
            .ai-particle-1 {
                width: 10px; height: 10px; border-radius: 50%; position: absolute;
                top: 0; left: 50%; margin-left: -5px; background: rgb(99, 102, 241); filter: blur(2px);
            }
            .ai-particle-group-2 {
                position: absolute; inset: 0; animation: aiSpinSlowReverse 5s linear infinite;
            }
            .ai-particle-2 {
                width: 8px; height: 8px; border-radius: 50%; position: absolute;
                bottom: 0; left: 50%; margin-left: -4px; background: rgb(232, 121, 249); filter: blur(2px);
            }
            
            .footer-reveal-bg {
                position: relative; padding: 120px 1rem 80px; background: #020617;
                opacity: 1; transform: translateY(0);
                margin-top: 0;
                z-index: 50;
                display: flex; flex-direction: column; align-items: center;
                text-align: center;
            }
            .footer-hidden-content {
                opacity: 1; transform: translateY(0);
                display: flex; flex-direction: column; align-items: center;
                width: 100%;
            }
            
            @media (max-width: 768px) {
                #flowing-ai-container { width: 280px; height: 280px; }
                .ai-digital-core { width: 260px; height: 260px; }
                .ai-orbital-1 { width: 200px; height: 200px; }
                .ai-orbital-2 { width: 180px; height: 180px; }
                .ai-inner-ring { width: 140px; height: 140px; }
                .ai-core-orb { width: 110px; height: 110px; }
                .ai-sparkle-icon { font-size: 32px; }
                .ai-internal-pulse { width: 50px; height: 50px; }
                .footer-reveal-bg { padding: 80px 20px; }
            }
        `;
        document.head.appendChild(style);

        // 2. Inject Creature DOM
        const container = document.createElement('div');
        container.id = 'flowing-ai-container';
        container.innerHTML = `
            <div class="ai-digital-core">
                <div class="ai-bg-glow"></div>
                <div class="ai-orbital-1"></div>
                <div class="ai-orbital-2"></div>
                <div class="ai-inner-ring"></div>
                <div class="ai-core-orb">
                    <div class="ai-glass-content">
                        <div class="ai-glass-highlight"></div>
                        <div class="ai-internal-pulse"></div>
                        <i class="fa-solid fa-sparkles ai-sparkle-icon"></i>
                    </div>
                    <div class="ai-particle-group-1"><div class="ai-particle-1"></div></div>
                    <div class="ai-particle-group-2"><div class="ai-particle-2"></div></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // 3. GSAP Animations
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        // Entry Setup
        gsap.set(container, {
            xPercent: -50,
            yPercent: -50
        });

        gsap.to(container, {
            opacity: 1, scale: 1, duration: 2, ease: "power3.out", delay: 0.5
        });

        // Path Animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 2,
            }
        });

        tl.to(container, { left: "88%", top: "25%", scale: 0.65, rotationZ: 25, duration: 2, ease: "sine.inOut" })
          .to(container, { left: "12%", top: "55%", scale: 1.1, rotationZ: -20, duration: 3, ease: "power2.inOut" })
          .to(container, { left: "80%", top: "75%", scale: 0.85, rotationZ: 10, duration: 2.5, ease: "sine.inOut" })
          .to(container, { left: "50%", top: "95%", scale: 0, opacity: 0, rotationZ: 0, duration: 2, ease: "power3.in" });

        // Organic Swimming
        gsap.to(container, {
            y: "+=20", x: "+=10", rotationZ: "+=2", duration: 3,
            repeat: -1, yoyo: true, ease: "sine.inOut"
        });

        // Mouse Parallax
        const handleMouseMove = (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            gsap.to(container, { x: moveX, y: moveY, duration: 1.2, ease: "power2.out" });
        };
        window.addEventListener('mousemove', handleMouseMove);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFlowingAICreature);
    } else {
        initFlowingAICreature();
    }
})();
