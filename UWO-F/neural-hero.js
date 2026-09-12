const initHeroVisuals = () => {
  /* ─────────────────────────────────────────────────────────
     Neural Network 3D Canvas
     ───────────────────────────────────────────────────────── */
  const canvas = document.getElementById('hero-neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let W, H, centerX, centerY;
  let nodes = [], particles = [];
  let tick = 0;
  let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  document.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  });

  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mousePos.x = e.touches[0].clientX;
      mousePos.y = e.touches[0].clientY;
    }
  }, { passive: true });

  const init = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    centerX = W / 2;
    centerY = H / 2;

    nodes = [];
    const nodeCount = 35;
    for (let i = 0; i < nodeCount; i++) {
        const radius = 100 + Math.random() * 350;
        const angle = Math.random() * Math.PI * 2;
        nodes.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            baseX: centerX + Math.cos(angle) * radius,
            baseY: centerY + Math.sin(angle) * radius,
            z: Math.random() * 2,
            size: 1 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#60a5fa' : '#e879f9',
            phase: Math.random() * Math.PI * 2
        });
    }

    particles = [];
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            baseX: Math.random() * W,
            baseY: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5,
            alpha: 0.1 + Math.random() * 0.4,
            z: 0.5 + Math.random() * 1.5,
        });
    }
  };

  init();
  window.addEventListener('resize', init);

  const render = () => {
    ctx.clearRect(0, 0, W, H);

    // Parallax update
    const dx = (mousePos.x - W / 2) / W;
    const dy = (mousePos.y - H / 2) / H;

    nodes.forEach(n => {
        n.x = n.baseX + dx * 100 * n.z;
        n.y = n.baseY + dy * 100 * n.z;
    });

    particles.forEach(p => {
        p.x = (p.baseX + dx * 40 * p.z + W) % W;
        p.y = (p.baseY + dy * 40 * p.z + H) % H;
    });

    /* Neural Connections */
    ctx.lineWidth = 1;
    nodes.forEach((n1, i) => {
        for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
            if (dist < 300) {
                const alpha = (1 - dist / 300) * 0.2;
                ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                /* Data Flow */
                if (dist < 220 && (i % 3 === 0)) {
                    const flowPos = (tick * 0.006 + i) % 1;
                    const fx = n1.x + (n2.x - n1.x) * flowPos;
                    const fy = n1.y + (n2.y - n1.y) * flowPos;
                    ctx.fillStyle = `rgba(232, 121, 249, ${alpha * 2.5})`;
                    ctx.beginPath();
                    ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    });

    /* Neural Nodes */
    nodes.forEach(n => {
        const pulse = Math.sin(tick * 0.03 + n.phase) * 0.4 + 1.2;
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 12 * pulse;
        ctx.shadowColor = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    /* Digital Dust */
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    tick++;
    requestAnimationFrame(render);
  };
  render();

  /* ─────────────────────────────────────────────────────────
     GSAP Intro Animations for Hero Elements
     ───────────────────────────────────────────────────────── */
  gsap.fromTo("#hero-background-gradient", { opacity: 0 }, { opacity: 1, duration: 2, ease: "power2.inOut" });
  gsap.fromTo(".hero-immersive-glows", { opacity: 0 }, { opacity: 1, duration: 2.5, ease: "power2.inOut" });
  gsap.fromTo("#hero-neural-canvas", { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.inOut" });
  gsap.fromTo("#hero-center-ring", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 2, ease: "power2.out", delay: 0.2 });
  
  gsap.fromTo(".hero-badge", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.4 });
  gsap.fromTo(".hero-heading", { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power3.out", delay: 0.5, stagger: 0.1 });
  gsap.fromTo(".hero-text-glow", { opacity: 0 }, { opacity: 0.4, duration: 1.5, ease: "power2.inOut", delay: 0.8 });
  gsap.fromTo(".subtitle", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 0.7, ease: "power3.out" });
  gsap.fromTo(".aisa-cta-group", { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1, delay: 0.9, ease: "power3.out" });
  gsap.fromTo(".hero-scroll-indicator", { opacity: 0 }, { opacity: 0.3, duration: 1, delay: 1.5, ease: "power2.inOut" });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroVisuals);
} else {
    initHeroVisuals();
}
