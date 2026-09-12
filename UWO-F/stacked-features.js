(function() {
    'use strict';

    const renderStackedFeatures = () => {
        const root = document.getElementById('stacked-features-root');
        if (!root) return;

        // Global styles for this component
        if (!document.getElementById('sf-styles')) {
            const style = document.createElement('style');
            style.id = 'sf-styles';
            style.innerHTML = `
                @keyframes sfBIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes sfPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }
                @keyframes sfSpin { to{transform:rotate(360deg)} }
                @keyframes sfBlink { 0%,100%{opacity:1} 50%{opacity:0} }
                @keyframes sfvprog { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1);transform-origin:left} }
                
                .sf-slide {
                    width: 20%; height: 100vh; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    position: relative; padding: 2rem; overflow: hidden;
                }
                .sf-content-grid {
                    position: relative; z-index: 10; display: grid;
                    grid-template-columns: 1fr 1fr; gap: 4vw; align-items: center;
                    max-width: 1280px; width: 100%; height: 80vh; margin: 0 auto;
                }
                .sf-panel {
                    height: 100%; display: flex; flex-direction: column;
                    border-radius: 16px; background: rgba(8,8,22,0.9);
                    backdrop-filter: blur(24px); overflow: hidden;
                }
                .sf-chrome {
                    display: flex; align-items: center; gap: 6px;
                    padding: 9px 14px; background: rgba(0,0,0,0.25); flex-shrink: 0;
                }
                @media (max-width: 900px) {
                    .sf-content-grid { 
                        grid-template-columns: 1fr; 
                        grid-template-rows: auto 1fr; 
                        height: 100vh;
                        gap: 1.5rem; 
                        padding: 3rem 1.5rem; 
                        align-content: center;
                    }
                    .sf-slide { padding: 0.5rem; height: 100vh; overflow: hidden; }
                    .sf-panel { min-height: unset; height: 100%; max-height: none; }
                    .sf-big-number { display: none !important; }
                }
                .sf-scroll-thumb::-webkit-scrollbar { width: 3px; }
                .sf-scroll-thumb::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
            `;
            document.head.appendChild(style);
        }

        const features = [
            { id:0, label:'Deep Search',      title:'Deep Search',      desc:'AI-powered deep internet research, going beyond simple results with comprehensive cited analysis.',  icon:'fa-magnifying-glass', bgFrom:'rgba(0,24,60,1)',   bgTo:'rgba(0,10,30,1)',  color:'#60a5fa', glow:'rgba(59,130,246,0.35)' },
            { id:1, label:'Image Generation', title:'Image Generation', desc:"Transform text prompts into stunning visuals instantly with AISA™'s image generation engine.",          icon:'fa-image',            bgFrom:'rgba(30,0,60,1)',  bgTo:'rgba(15,0,35,1)',  color:'#a78bfa', glow:'rgba(139,92,246,0.35)' },
            { id:2, label:'Video Generation', title:'Video Generation', desc:'Create cinematic AI videos from text or images. The future of content creation is here.',              icon:'fa-video',            bgFrom:'rgba(60,0,30,1)',  bgTo:'rgba(30,0,15,1)',  color:'#f472b6', glow:'rgba(236,72,153,0.35)' },
            { id:3, label:'Web Search',       title:'Web Search',       desc:'Smart AI web browsing that surfaces the most relevant real-time information instantly.',               icon:'fa-globe',            bgFrom:'rgba(0,50,40,1)',  bgTo:'rgba(0,25,20,1)',  color:'#2dd4bf', glow:'rgba(45,212,191,0.3)'   },
            { id:4, label:'Code Builder',     title:'Code Builder',     desc:'Generate, explain, and debug code across any language with a powerful AI coding assistant.',           icon:'fa-code',             bgFrom:'rgba(10,10,60,1)', bgTo:'rgba(5,5,30,1)',   color:'#818cf8', glow:'rgba(99,102,241,0.35)' },
        ];

        const NUM_SLIDES = features.length;
        root.innerHTML = `
            <div id="sf-wrapper" style="height: 100vh; width: 100%; overflow: hidden;">
                    <div id="sf-track" style="display: flex; width: ${NUM_SLIDES * 100}%; height: 100vh; will-change: transform;">
                        ${features.map((feat, i) => `
                            <div class="sf-slide" id="sf-slide-${i}" style="background: radial-gradient(circle at 15% 50%, ${feat.bgFrom} 0%, ${feat.bgTo} 100%);">
                                <!-- Background Glows -->
                                <div style="position:absolute; top:10%; right:-5%; width:55vw; height:70vh; border-radius:50%; background:radial-gradient(circle,${feat.glow} 0%,transparent 65%); filter:blur(60px); pointer-events:none;"></div>
                                <div style="position:absolute; bottom:-10%; left:5%; width:40vw; height:50vh; border-radius:50%; background:radial-gradient(circle,${feat.glow.replace('0.35','0.1').replace('0.3','0.08')} 0%,transparent 70%); filter:blur(70px); pointer-events:none;"></div>
                                
                                <div class="sf-content-grid">
                                    <!-- Text Side -->
                                    <div style="display:flex; flex-direction:column; gap:1.4rem;">
                                        <div style="display:inline-flex; align-items:center; gap:10px; padding:5px 14px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); width:fit-content;">
                                            <span style="font-family:monospace; font-size:0.7rem; color:rgba(255,255,255,0.45); letter-spacing:0.12em;">FEATURE 0${i+1} / 0${NUM_SLIDES}</span>
                                        </div>
                                        <div style="width:60px; height:60px; border-radius:16px; background:rgba(255,255,255,0.06); border:1px solid ${feat.color}55; display:flex; align-items:center; justify-content:center; box-shadow:0 0 24px ${feat.glow};">
                                            <i class="fa-solid ${feat.icon}" style="font-size:26px; color:${feat.color};"></i>
                                        </div>
                                        <h2 style="font-size:clamp(2.2rem,4.5vw,4.5rem); font-weight:900; line-height:1.05; color:#f8fafc; letter-spacing:-0.03em; margin:0;">
                                            ${feat.title}
                                        </h2>
                                        <p style="font-size:clamp(0.9rem,1.3vw,1.05rem); color:rgba(203,213,225,0.7); line-height:1.7; max-width:420px; margin:0;">
                                            ${feat.desc}
                                        </p>
                                        <button style="display:inline-flex; align-items:center; gap:10px; padding:12px 24px; border-radius:40px; background:linear-gradient(135deg,${feat.color}22,${feat.color}44); border:1px solid ${feat.color}60; color:${feat.color}; font-weight:700; font-size:0.88rem; cursor:pointer; width:fit-content; border:none; outline:none; transition:all 0.3s ease;">
                                            Try it Now <i class="fa-solid fa-arrow-right" style="font-size:14px;"></i>
                                        </button>
                                    </div>
                                    <!-- Demo Side --><div style="height:100%; width:100%; position:relative;" id="sf-demo-container-${i}"></div>
                                </div>
                                <div style="position:absolute; bottom:2rem; left:50%; transform:translateX(-50%); display:flex; gap:8px; align-items:center; z-index:20;">
                                    ${features.map((_, idx) => `
                                        <div style="height:3px; border-radius:2px; width:${idx === i ? 28 : 7}px; background:${idx === i ? feat.color : 'rgba(255,255,255,0.2)'}; transition:all 0.4s ease;"></div>
                                    `).join('')}
                                </div>
                                <div class="sf-big-number" style="position:absolute; right:-1rem; bottom:-2rem; font-size:18rem; font-weight:900; line-height:1; color:rgba(255,255,255,0.025); user-select:none; pointer-events:none; z-index:0;">
                                    0${i+1}
                                </div>
                            </div>
                        `).join('')}
                    </div>
            </div>
        `;

        // Interactive States
        let activeSlideIdx = -1;
        let demoLoops = {}; // intervals/timeouts
        const clearLoops = (i) => {
            if (demoLoops[i]) {
                demoLoops[i].timeouts.forEach(clearTimeout);
                demoLoops[i].intervals.forEach(clearInterval);
                if (demoLoops[i].raf) cancelAnimationFrame(demoLoops[i].raf);
                demoLoops[i] = { timeouts: [], intervals: [], raf: null };
            }
        };

        const buildChrome = (f) => `
            <div class="sf-chrome" style="border-bottom: 1px solid ${f.color}15;">
                ${['#ff5f57','#febc2e','#28c840'].map(c => `<div style="width:9px; height:9px; border-radius:50%; background:${c};"></div>`).join('')}
                <div style="flex:1; text-align:center; background:rgba(255,255,255,0.04); border-radius:6px; padding:3px 10px; font-size:0.62rem; color:rgba(148,163,184,0.4); max-width:180px; margin:0 auto;">
                    aisa.ai — ${f.label}
                </div>
                <div style="display:flex; align-items:center; gap:3px; padding:2px 7px; border-radius:999px; background:${f.color}12; border:1px solid ${f.color}30; font-size:0.55rem; font-weight:700; color:${f.color};">
                    <span style="width:3px; height:3px; border-radius:50%; background:${f.color}; animation:sfPulse 1.2s infinite;"></span> LIVE
                </div>
            </div>
        `;

        // DEEP SEARCH DEMO (0)
        const runDeepSearch = (container, f, isActive) => {
            clearLoops(0);
            if (!isActive) { container.innerHTML = ''; return; }
            demoLoops[0] = { timeouts: [], intervals: [], raf: null };

            container.innerHTML = `
                <div class="sf-panel" style="border:1px solid ${f.color}33; box-shadow:0 0 50px ${f.color}22, 0 20px 60px rgba(0,0,0,0.5);">
                    ${buildChrome(f)}
                    <div style="flex:1; padding:14px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;" id="sf-ds-content">
                        <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; background:rgba(96,165,250,0.08); border:1px solid ${f.color}30;">
                            <i class="fa-solid fa-magnifying-glass" style="font-size:12px; color:${f.color};"></i>
                            <span style="font-size:0.75rem; color:rgba(255,255,255,0.7);">Latest LLM breakthroughs 2025</span>
                        </div>
                        <div id="sf-ds-scanning" style="display:flex; align-items:center; gap:8px; color:rgba(148,163,184,0.7); font-size:0.75rem; padding:4px 0;">
                            <div style="width:14px; height:14px; border:2px solid ${f.color}; border-top-color:transparent; border-radius:50%; animation:sfSpin 0.8s linear infinite;"></div>
                            <span id="sf-ds-scantext">Scanning 200+ sources...</span>
                        </div>
                    </div>
                </div>
            `;

            let dots = 0;
            const scanText = document.getElementById('sf-ds-scantext');
            demoLoops[0].intervals.push(setInterval(() => {
                dots = (dots + 1) % 4;
                if(scanText) scanText.innerText = `Scanning ${200 + dots*3}+ sources${'.'.repeat(dots+1)}`;
            }, 250));

            demoLoops[0].timeouts.push(setTimeout(() => {
                clearInterval(demoLoops[0].intervals[0]); // stop scanning
                const scanEl = document.getElementById('sf-ds-scanning');
                if(scanEl) scanEl.style.display = 'none';
                
                const results = [
                    { src: 'MIT AI Lab', title: 'GPT-5 Reasoning Improvements 2025' },
                    { src: 'Stanford HAI', title: 'Foundation Models & Multimodal AI' },
                    { src: 'DeepMind', title: 'Gemini Ultra — Scaling Analysis' },
                    { src: 'OpenAI Blog', title: 'Chain-of-Thought Self-Verification' }
                ];
                
                const content = document.getElementById('sf-ds-content');
                if(!content) return;
                
                results.forEach((r, i) => {
                    const el = document.createElement('div');
                    el.style.cssText = `display:flex; align-items:flex-start; gap:8px; padding:9px 12px; border-radius:9px; background:rgba(96,165,250,0.06); border:1px solid ${f.color}22; animation:sfBIn 0.3s ease ${i * 0.12}s both;`;
                    el.innerHTML = `<i class="fa-solid fa-circle-check" style="color:${f.color}; font-size:13px; margin-top:2px;"></i>
                                    <div><div style="font-size:0.72rem; color:${f.color}; font-weight:600; margin-bottom:2px;">${r.src}</div>
                                    <div style="font-size:0.7rem; color:rgba(203,213,225,0.8); line-height:1.4;">${r.title}</div></div>`;
                    content.appendChild(el);
                });

                demoLoops[0].timeouts.push(setTimeout(() => {
                    const summ = document.createElement('div');
                    summ.style.cssText = `margin-top:4px; padding:8px 12px; border-radius:9px; background:rgba(96,165,250,0.04); border:1px solid ${f.color}15; animation:sfBIn 0.3s ease both;`;
                    summ.innerHTML = `<div style="font-size:0.68rem; color:rgba(148,163,184,0.5); margin-bottom:4px;">AI Summary</div>
                                      <p style="margin:0; font-size:0.72rem; color:rgba(203,213,225,0.8); line-height:1.5;">GPT-5 chain-of-thought self-verification reduces hallucination by <span style="color:${f.color}; font-weight:700;">47%</span>. MoE scaling laws show efficiency gains.</p>`;
                    content.appendChild(summ);
                }, 600)); // .5s after results

            }, 700));
        };

        // IMAGE GENERATION DEMO (1)
        const runImageGen = (container, f, isActive) => {
            clearLoops(1);
            if (!isActive) { container.innerHTML = ''; return; }
            demoLoops[1] = { timeouts: [], intervals: [], raf: null };

            container.innerHTML = `
                <div class="sf-panel" style="border:1px solid ${f.color}33; box-shadow:0 0 50px ${f.color}22, 0 20px 60px rgba(0,0,0,0.5);">
                    ${buildChrome(f)}
                    <div style="flex:1; display:flex; flex-direction:column; padding:12px; gap:10px;">
                        <div style="display:flex; align-items:center; gap:8px; padding:7px 12px; border-radius:10px; background:rgba(167,139,250,0.08); border:1px solid ${f.color}30;">
                            <i class="fa-solid fa-sparkles" style="font-size:12px; color:${f.color};"></i>
                            <span style="font-size:0.72rem; color:rgba(255,255,255,0.65);">Cyberpunk city at night, neon lights</span>
                        </div>
                        <div style="flex:1; border-radius:10px; overflow:hidden; border:1px solid ${f.color}25; position:relative; min-height:0;">
                            <canvas id="sf-ig-canvas" width="400" height="220" style="width:100%; height:100%; display:block;"></canvas>
                            <div id="sf-ig-badge" style="position:absolute; bottom:8px; left:8px; display:flex; align-items:center; gap:5px; padding:3px 9px; border-radius:999px; background:rgba(0,0,0,0.6); border:1px solid ${f.color}40;">
                                <div style="width:5px; height:5px; border-radius:50%; background:${f.color}; animation:sfPulse 1s infinite;"></div>
                                <span style="font-size:0.6rem; color:${f.color}; font-weight:700;">GENERATING</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const canvas = document.getElementById('sf-ig-canvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = 400, H = 220;
            const pixels = [];
            const CELL = 6;
            const cols = Math.ceil(W/CELL), rows = Math.ceil(H/CELL);

            for (let r=0; r<rows; r++) {
                for (let c=0; c<cols; c++) {
                    const nx = c/cols, ny = r/rows;
                    const R = Math.round(20 + nx*60 + ny*40), G = Math.round(5 + nx*20), B = Math.round(80 + nx*120 + ny*60);
                    pixels.push({ x: c*CELL, y: r*CELL, color: `rgb(${R},${G},${B})` });
                }
            }
            // Shuffle
            for (let i = pixels.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pixels[i], pixels[j]] = [pixels[j], pixels[i]];
            }

            ctx.fillStyle = '#0f0c29'; ctx.fillRect(0,0,W,H);
            let idx = 0;
            const BATCH = 100;

            const draw = () => {
                for (let b=0; b<BATCH && idx<pixels.length; b++, idx++) {
                    const p = pixels[idx];
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, CELL, CELL);
                }
                if (idx < pixels.length) {
                    demoLoops[1].raf = requestAnimationFrame(draw);
                } else {
                    const grad = ctx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, W*0.6);
                    grad.addColorStop(0, 'rgba(167,139,250,0.0)'); grad.addColorStop(1, 'rgba(0,0,0,0.3)');
                    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
                    const badge = document.getElementById('sf-ig-badge');
                    if(badge) badge.style.display = 'none';

                    demoLoops[1].timeouts.push(setTimeout(() => {
                        ctx.clearRect(0,0,W,H); ctx.fillStyle = '#0f0c29'; ctx.fillRect(0,0,W,H);
                        idx = 0; 
                        // reshuffle
                        for (let i = pixels.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pixels[i], pixels[j]] = [pixels[j], pixels[i]]; }
                        if(badge) badge.style.display = 'flex';
                        demoLoops[1].raf = requestAnimationFrame(draw);
                    }, 2000));
                }
            };
            demoLoops[1].raf = requestAnimationFrame(draw);
        };

        // VIDEO GENERATION DEMO (2)
        const runVideoGen = (container, f, isActive) => {
            clearLoops(2);
            if (!isActive) { container.innerHTML = ''; return; }
            demoLoops[2] = { timeouts: [], intervals: [], raf: null };

            container.innerHTML = `
                <div class="sf-panel" style="border:1px solid ${f.color}33; box-shadow:0 0 50px ${f.color}22, 0 20px 60px rgba(0,0,0,0.5);">
                    ${buildChrome(f)}
                    <div style="flex:1; padding:12px 14px; display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; align-items:center; gap:8px; padding:7px 12px; border-radius:10px; background:rgba(244,114,182,0.08); border:1px solid ${f.color}30;">
                            <i class="fa-solid fa-video" style="font-size:12px; color:${f.color};"></i>
                            <span style="font-size:0.72rem; color:rgba(255,255,255,0.65);">Cinematic AI robot exploring space · 5s · 4K</span>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px;" id="sf-vg-frames"></div>
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span id="sf-vg-lbl" style="font-size:0.68rem; color:rgba(255,255,255,0.4);">Rendering frames...</span>
                                <span id="sf-vg-pct" style="font-size:0.68rem; color:${f.color}; font-weight:700;">0%</span>
                            </div>
                            <div style="height:5px; background:rgba(255,255,255,0.07); border-radius:3px; overflow:hidden;">
                                <div id="sf-vg-bar" style="height:100%; border-radius:3px; background:linear-gradient(90deg, #f472b6, #a855f7); width:0%; transition:width 0.06s linear; box-shadow:0 0 8px rgba(244,114,182,0.5);"></div>
                            </div>
                        </div>
                        <div id="sf-vg-done" style="display:none; padding:8px 12px; border-radius:9px; background:rgba(244,114,182,0.06); border:1px solid ${f.color}20; animation:sfBIn 0.3s ease both;">
                            <div style="font-size:0.7rem; color:${f.color}; font-weight:700; margin-bottom:2px;">🎬 Video Ready</div>
                            <div style="font-size:0.68rem; color:rgba(203,213,225,0.6);">5s · 4K · 24fps · Orchestral Audio ✓</div>
                        </div>
                    </div>
                </div>
            `;

            let progress = 0;
            const lbl = document.getElementById('sf-vg-lbl');
            const pct = document.getElementById('sf-vg-pct');
            const bar = document.getElementById('sf-vg-bar');
            const framesEl = document.getElementById('sf-vg-frames');
            const done = document.getElementById('sf-vg-done');

            // Render static empty frames
            const renderFrames = (p) => {
                if(!framesEl) return;
                let html = '';
                for(let i=0; i<6; i++) {
                    const revealed = p > (i*16);
                    if(revealed) {
                        html += `<div style="aspect-ratio:16/9; border-radius:6px; background:linear-gradient(${135+i*15}deg, rgba(${60+i*10},0,${80-i*5},1), rgba(${20+i*8},0,${60-i*4},1)); border:1px solid ${f.color}40; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;"><span style="font-size:0.55rem; color:rgba(255,255,255,0.4);">${(i*0.83).toFixed(1)}s</span></div>`;
                    } else {
                        html += `<div style="aspect-ratio:16/9; border-radius:6px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; transition:background 0.3s ease;"><div style="width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.08);"></div></div>`;
                    }
                }
                framesEl.innerHTML = html;
            }
            renderFrames(0);

            const tick = () => {
                progress += 3;
                if(progress >= 100) {
                    progress = 100;
                    clearInterval(demoLoops[2].intervals[0]);
                    if(lbl) lbl.innerText = '✅ Render Complete';
                    if(pct) pct.innerText = '100%';
                    if(bar) bar.style.width = '100%';
                    if(done) done.style.display = 'block';
                    renderFrames(100);
                    
                    demoLoops[2].timeouts.push(setTimeout(() => {
                        progress = 0; if(done) done.style.display='none';
                        demoLoops[2].intervals.push(setInterval(tick, 25));
                    }, 3000));
                } else {
                    if(pct) pct.innerText = Math.round(progress) + '%';
                    if(bar) bar.style.width = progress + '%';
                    renderFrames(progress);
                }
            };
            demoLoops[2].intervals.push(setInterval(tick, 25));
        };

        // WEB BROWSE DEMO (3)
        const runWebBrowse = (container, f, isActive) => {
            clearLoops(3);
            if (!isActive) { container.innerHTML = ''; return; }
            demoLoops[3] = { timeouts: [], intervals: [], raf: null };

            container.innerHTML = `
                <div class="sf-panel" style="border:1px solid ${f.color}33; box-shadow:0 0 50px ${f.color}22, 0 20px 60px rgba(0,0,0,0.5);">
                    ${buildChrome(f)}
                    <div style="flex:1; padding:12px 14px; display:flex; flex-direction:column; gap:10px; overflow-y:auto;" class="sf-scroll-thumb">
                        <div style="padding:12px 14px; border-radius:12px; background:rgba(45,212,191,0.07); border:1px solid ${f.color}25;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                                <span style="font-size:0.7rem; color:rgba(255,255,255,0.45); font-weight:600;">BTC / USD — LIVE</span>
                                <div style="width:6px; height:6px; border-radius:50%; background:#34d399; animation:sfPulse 1s infinite;"></div>
                            </div>
                            <div id="sf-wb-price" style="font-size:1.5rem; font-weight:900; color:#f0fdf4; letter-spacing:-0.02em;">$67,000</div>
                            <div id="sf-wb-change" style="font-size:0.75rem; font-weight:700; color:#34d399; margin-top:2px;">▲ 3.20% today</div>
                            <div style="display:flex; gap:3px; align-items:flex-end; margin-top:10px; height:30px;">
                                ${[40,55,45,70,60,80,65,90,75,100].map((h,i) => `<div style="flex:1; height:${h}%; border-radius:2px; background:linear-gradient(180deg, ${f.color}, ${f.color}55); opacity:${0.7 + i*0.03};"></div>`).join('')}
                            </div>
                        </div>
                        <div style="font-size:0.65rem; color:rgba(255,255,255,0.3); font-weight:600; letter-spacing:0.08em; margin-top:5px;">LATEST NEWS</div>
                        <div id="sf-wb-news" style="display:flex; flex-direction:column; gap:6px;"></div>
                    </div>
                </div>
            `;

            let price = 67000, change = 3.2;
            demoLoops[3].intervals.push(setInterval(() => {
                price += (Math.random() - 0.48)*80;
                change = +(change + (Math.random()-0.5)*0.1).toFixed(2);
                const pEl = document.getElementById('sf-wb-price');
                const cEl = document.getElementById('sf-wb-change');
                if(pEl) pEl.innerText = '$' + Math.round(price).toLocaleString();
                if(cEl) {
                    cEl.innerText = (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change).toFixed(2) + '% today';
                    cEl.style.color = change >= 0 ? '#34d399' : '#f87171';
                }
            }, 250));

            const hl = [
                { src: 'CoinDesk', text: 'Bitcoin ETF inflows hit $2.1B this week' },
                { src: 'Bloomberg', text: '78% of analysts bullish on BTC in April' },
                { src: 'Reuters', text: 'Institutional buying pressure accelerating' },
            ];
            const newsCont = document.getElementById('sf-wb-news');
            hl.forEach((h, i) => {
                demoLoops[3].timeouts.push(setTimeout(() => {
                    if(!newsCont) return;
                    const d = document.createElement('div');
                    d.style.cssText = `padding:7px 10px; border-radius:8px; background:rgba(45,212,191,0.05); border:1px solid ${f.color}18; animation:sfBIn 0.3s ease both;`;
                    d.innerHTML = `<div style="font-size:0.62rem; color:${f.color}; font-weight:700; margin-bottom:2px;">${h.src}</div>
                                   <div style="font-size:0.7rem; color:rgba(203,213,225,0.8);">${h.text}</div>`;
                    newsCont.appendChild(d);
                }, 400 + i*500));
            });
        };

        // CODE BUILDER DEMO (4)
        const runCodeBuilder = (container, f, isActive) => {
            clearLoops(4);
            if (!isActive) { container.innerHTML = ''; return; }
            demoLoops[4] = { timeouts: [], intervals: [], raf: null };

            const codeStr = `import requests, time
from bs4 import BeautifulSoup

def google_search(query, n=10):
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(
            f"https://google.com/search?q={query}",
            headers=headers, timeout=10
        )
        time.sleep(1)  # rate limit
        soup = BeautifulSoup(r.text, "html.parser")
        return [
            x.text for x in
            soup.select(".LC20lb")
        ]
    except Exception as e:
        return {"error": str(e)}`;

            container.innerHTML = `
                <div class="sf-panel" style="border:1px solid ${f.color}33; box-shadow:0 0 50px ${f.color}22, 0 20px 60px rgba(0,0,0,0.5);">
                    ${buildChrome(f)}
                    <div style="flex:1; display:flex; flex-direction:column; padding:10px 12px; gap:8px;">
                        <div style="display:flex; align-items:center; gap:8px; padding:7px 12px; border-radius:10px; background:rgba(129,140,248,0.08); border:1px solid ${f.color}30;">
                            <i class="fa-solid fa-code" style="font-size:12px; color:${f.color};"></i>
                            <span style="font-size:0.72rem; color:rgba(255,255,255,0.65);">Python Google scraper with rate limiting</span>
                        </div>
                        <div style="flex:1; border-radius:10px; background:rgba(5,5,20,0.9); border:1px solid ${f.color}25; overflow:hidden; display:flex; flex-direction:column; min-height:0;">
                            <div style="padding:6px 12px; background:rgba(99,102,241,0.1); border-bottom:1px solid ${f.color}15; display:flex; align-items:center; gap:6px; flex-shrink:0;">
                                <i class="fa-solid fa-terminal" style="font-size:10px; color:${f.color};"></i>
                                <span style="font-size:0.62rem; color:${f.color}; font-weight:700;">scraper.py</span>
                                <div style="margin-left:auto; display:flex; gap:4px;">
                                    <div style="width:8px; height:8px; border-radius:50%; background:${f.color}44;"></div>
                                    <div style="width:8px; height:8px; border-radius:50%; background:${f.color}66;"></div>
                                    <div style="width:8px; height:8px; border-radius:50%; background:${f.color};"></div>
                                </div>
                            </div>
                            <div style="flex:1; display:flex; min-height:0; overflow-y:auto;" class="sf-scroll-thumb" id="sf-cb-scroll">
                                <div id="sf-cb-lines" style="padding:10px 8px; background:rgba(0,0,0,0.2); border-right:1px solid ${f.color}10; flex-shrink:0; user-select:none; font-family:monospace;"></div>
                                <pre id="sf-cb-code" style="margin:0; padding:10px 12px; font-size:0.62rem; line-height:1.55rem; color:#a5b4fc; white-space:pre-wrap; word-break:break-word; flex:1; font-family:monospace;"></pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Simple highlighter
            const highlightCode = (str) => {
                const words = ['import','from','def','return','try','except','for','in','if','else'];
                let res = str;
                words.forEach(w => {
                    res = res.replace(new RegExp(`\\b${w}\\b`,'g'), `<span style="color:#c084fc;">${w}</span>`);
                });
                return res;
            }

            let typed = '';
            let i = 0;
            const codeEl = document.getElementById('sf-cb-code');
            const linesEl = document.getElementById('sf-cb-lines');
            const scrollEl = document.getElementById('sf-cb-scroll');

            const typeCode = () => {
                if(i >= codeStr.length) {
                    clearInterval(demoLoops[4].intervals[0]);
                    demoLoops[4].timeouts.push(setTimeout(() => {
                        i = 0; typed = '';
                        demoLoops[4].intervals.push(setInterval(typeCode, 15));
                    }, 3000));
                    return;
                }
                typed = codeStr.slice(0, ++i);
                if(codeEl) codeEl.innerHTML = highlightCode(typed) + `<span style="border-left:2px solid ${f.color}; animation:sfBlink 1s step-end infinite; margin-left:1px;">&nbsp;</span>`;
                if(linesEl) {
                    const lns = typed.split('\n').length;
                    let lhtml = '';
                    for(let x=1; x<=lns; x++){ lhtml += `<div style="font-size:0.6rem; color:rgba(148,163,184,0.3); line-height:1.55rem; text-align:right; min-width:16px;">${x}</div>`; }
                    linesEl.innerHTML = lhtml;
                }
                if(scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
            };
            demoLoops[4].intervals.push(setInterval(typeCode, 15));
        };

        const renderDemo = (idx, isActive) => {
            const container = document.getElementById(`sf-demo-container-${idx}`);
            if (!container) return;
            const feat = features[idx];
            
            if(idx === 0) runDeepSearch(container, feat, isActive);
            if(idx === 1) runImageGen(container, feat, isActive);
            if(idx === 2) runVideoGen(container, feat, isActive);
            if(idx === 3) runWebBrowse(container, feat, isActive);
            if(idx === 4) runCodeBuilder(container, feat, isActive);
        };

        // GSAP Initialization
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded for StackedFeatures.');
            return;
        }

        const track = document.getElementById('sf-track');
        const wrapper = document.getElementById('sf-wrapper');

        gsap.to(track, {
            xPercent: -((NUM_SLIDES - 1) * 100) / NUM_SLIDES,
            ease: 'none',
            scrollTrigger: {
                trigger: wrapper,
                start: 'top top',
                end: () => `+=${(NUM_SLIDES - 1) * (window.innerWidth < 600 ? 600 : Math.max(window.innerWidth, 500))}`,
                scrub: 0.1,
                snap: {
                    snapTo: 1 / (NUM_SLIDES - 1),
                    duration: { min: 0.2, max: 0.5 },
                    delay: 0,
                    ease: "power1.inOut"
                },
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const newIdx = Math.round(self.progress * (NUM_SLIDES - 1));
                    if (newIdx !== activeSlideIdx && newIdx >= 0 && newIdx < NUM_SLIDES) {
                        if(activeSlideIdx !== -1) renderDemo(activeSlideIdx, false);
                        activeSlideIdx = newIdx;
                        renderDemo(activeSlideIdx, true);
                    }
                },
                onEnter: () => {
                    if(activeSlideIdx !== 0) {
                        activeSlideIdx = 0;
                        renderDemo(0, true);
                    }
                },
                onLeaveBack: () => {
                    if(activeSlideIdx !== -1) {
                        renderDemo(activeSlideIdx, false);
                        activeSlideIdx = -1;
                    }
                }
            }
        });

        // Initial render for the first slide
        activeSlideIdx = 0;
        renderDemo(0, true);

        // Refresh ScrollTrigger after a short delay to ensure layout is complete
        setTimeout(() => ScrollTrigger.refresh(), 300);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderStackedFeatures);
    } else {
        renderStackedFeatures();
    }
})();
