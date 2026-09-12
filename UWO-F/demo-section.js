const DemoSectionMain = () => {
  const root = document.getElementById('demo-section-root');
  if(!root) return;

  root.style.cssText = `
    position: relative; padding: clamp(30px, 6vh, 100px) 1.5rem;
    display: flex; flex-direction: column; align-items: center;
    overflow: hidden;
    background: #060612;
    min-height: auto;
    z-index: 15;
  `;

  const CODE_SNIPPET = `import requests, time\nfrom bs4 import BeautifulSoup\n\ndef search(query, n=10):\n  headers = {"User-Agent": "Mozilla/5.0"}\n  try:\n    r = requests.get(\n      f"https://google.com/search?q={query}&num={n}",\n      headers=headers, timeout=10\n    )\n    soup = BeautifulSoup(r.text, "html.parser")\n    time.sleep(1)  # rate limit\n    return [x.text for x in soup.select(".LC20lb")]\n  except Exception as e:\n    return {"error": str(e)}`;

  const FEATURES = [
    { id: 'intro', label: 'Intro', icon: 'fa-sparkles', color: '#818cf8', glow: 'rgba(99,102,241,0.5)', bgAccent: 'rgba(30,27,75,0.4)', type: 'title', text: 'HOW DOES AISA™ WORK', steps: [
        { from: 'ai', text: 'Welcome to the AISA™ ecosystem. 🚀', ms: 400 },
        { from: 'ai', text: 'Our multi-modal engine handles everything from research to creation.', ms: 600 }
    ] },
    { id: 0, label: 'Deep Search', icon: 'fa-magnifying-glass', color: '#60a5fa', glow: 'rgba(59,130,246,0.4)', bgAccent: 'rgba(30,58,138,0.3)', steps: [ { from: 'user', text: 'Research latest LLM breakthroughs in 2025.' }, { from: 'ai', text: '🔍 Scanning 200+ sources…', typing: true, ms: 450 }, { from: 'ai', text: '📄 63 papers found:\\n• GPT-5 reasoning +47%\\n• MoE scaling laws\\n• Multimodal alignment', card: 'search', ms: 150 }, { from: 'user', text: 'Summarize the top finding.' }, { from: 'ai', text: '🧠 Chain-of-thought self-verification reduces hallucination by 47%.', ms: 400 } ] },
    { id: 1, label: 'Image Gen', icon: 'fa-image', color: '#a78bfa', glow: 'rgba(139,92,246,0.4)', bgAccent: 'rgba(76,29,149,0.3)', steps: [ { from: 'user', text: 'Generate a cyberpunk city at night.' }, { from: 'ai', text: '🎨 Generating with AISA Image Engine…', typing: true, ms: 450 }, { from: 'ai', text: '✅ Image ready!', card: 'image', ms: 150 }, { from: 'user', text: 'Add pink and blue neon tones.' }, { from: 'ai', text: '🎨 Re-rendering with neon palette…', typing: true, ms: 400 }, { from: 'ai', text: '✅ Updated version generated!', card: 'image2', ms: 150 } ] },
    { id: 2, label: 'Video Gen', icon: 'fa-video', color: '#f472b6', glow: 'rgba(236,72,153,0.4)', bgAccent: 'rgba(131,24,67,0.3)', steps: [ { from: 'user', text: 'Create a 5s cinematic AI robot in space.' }, { from: 'ai', text: '🎬 Rendering frames 0%…', typing: true, ms: 380 }, { from: 'ai', text: '⏳ 40%… 75%… 100% ✅', typing: true, ms: 420 }, { from: 'ai', text: '🎬 Video ready! 5s · 4K · 24fps', card: 'video', ms: 150 }, { from: 'user', text: 'Add orchestral music.' }, { from: 'ai', text: '🎵 Audio layer added. Final export done!', ms: 350 } ] },
    { id: 3, label: 'Web Browse', icon: 'fa-globe', color: '#2dd4bf', glow: 'rgba(45,212,191,0.4)', bgAccent: 'rgba(19,78,74,0.3)', steps: [ { from: 'user', text: 'Current Bitcoin price and market sentiment?' }, { from: 'ai', text: '🌐 Browsing live data…', typing: true, ms: 380 }, { from: 'ai', text: '📊 BTC: $67,420 (+3.2%)\\n🟢 Sentiment: Bullish\\nETF inflows: $2.1B this week', card: 'web', ms: 150 }, { from: 'user', text: 'Price prediction next month?' }, { from: 'ai', text: '📈 78% analysts bullish.\\nTarget: $70K–$80K by April.', ms: 380 } ] },
    { id: 4, label: 'Code AI', icon: 'fa-code', color: '#818cf8', glow: 'rgba(99,102,241,0.4)', bgAccent: 'rgba(49,46,129,0.3)', steps: [ { from: 'user', text: 'Write a Python Google scraper function.' }, { from: 'ai', text: '💻 Writing code…', typing: true, ms: 420 }, { from: 'ai', text: '', card: 'code', ms: 150 }, { from: 'user', text: 'Add error handling + rate limiting.' }, { from: 'ai', text: '🔧 Added try/except + 1s delay. ✅', ms: 350 } ] },
    { id: 'outro', label: 'Finish', icon: 'fa-sparkles', color: '#ffffff', glow: 'rgba(236,72,153,0.5)', bgAccent: 'rgba(70,20,50,0.4)', type: 'title', text: 'ONE AI ANYTHING IS POSSIBLE', steps: [] }
  ];

  /* ── Result cards ── */
  const getCardHtml = (type) => {
    if (type === 'search') return `
      <div style="margin-top: 8px; background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); border-radius: 8px; padding: 8px 12px;">
        ${['MIT AI Lab — LLM Reasoning 2025', 'Stanford HAI — Foundation Models', 'DeepMind — Gemini Ultra'].map((t, i) => `
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: ${i < 2 ? 4 : 0}px;">
            <i class="fa-solid fa-arrow-up-right-from-square" style="color: #60a5fa; font-size: 10px;"></i>
            <span style="font-size: 0.72rem; color: #93c5fd; font-weight: 400;">${t}</span>
          </div>
        `).join('')}
      </div>`;
    if (type === 'image' || type === 'image2') return `
      <div style="
        margin-top: 8px; height: 90px; border-radius: 8px;
        background: ${type === 'image' ? 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' : 'linear-gradient(135deg,#6a0572,#11998e,#1a1a2e)'};
        display: flex; align-items: center; justify-content: center;
        border: 1px solid rgba(167,139,250,0.2); position: relative; overflow: hidden;
      ">
        <div style="position: absolute; inset: 0; background: linear-gradient(135deg,rgba(255,0,150,0.1),rgba(0,150,255,0.1));"></div>
        <i class="fa-solid fa-sparkles" style="color: #c4b5fd; font-size: 22px; position: relative; z-index: 1;"></i>
        <span style="margin-left: 6px; color: #c4b5fd; font-size: 0.75rem; font-weight: 600; position: relative; z-index: 1;">
          ${type === 'image' ? 'Cyberpunk City' : 'Neon Edition'}
        </span>
      </div>`;
    if (type === 'video') return `
      <div style="
        margin-top: 8px; height: 70px; border-radius: 8px;
        background: linear-gradient(135deg,rgba(50,0,30,1),rgba(15,0,50,1));
        border: 1px solid rgba(244,114,182,0.2);
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 0 16px;
      ">
        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: 100%; background: linear-gradient(90deg,#f472b6,#a855f7); border-radius: 2px; animation: dsVprog 2s ease-out forwards;"></div>
        </div>
        <span style="font-size: 0.7rem; color: rgba(244,114,182,0.8); font-weight: 600;">▶ 5s · 4K · 24fps · +Audio</span>
      </div>`;
    if (type === 'web') return `
      <div style="margin-top: 8px; background: rgba(45,212,191,0.07); border: 1px solid rgba(45,212,191,0.2); border-radius: 8px; padding: 8px 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #6ee7b7;">BTC/USD</span>
          <span style="font-size: 0.73rem; color: #34d399; font-weight: 700;">$67,420 ▲3.2%</span>
        </div>
        <div style="height: 28px; background: rgba(45,212,191,0.08); border-radius: 5px; display: flex; align-items: center; padding-left: 8px;">
          <span style="font-size: 0.68rem; color: rgba(45,212,191,0.5); font-weight: 400;">Live chart ↗ CoinGecko</span>
        </div>
      </div>`;
    if (type === 'code') return `
      <div style="margin-top: 8px; background: rgba(5,5,20,0.9); border: 1px solid rgba(129,140,248,0.2); border-radius: 8px; overflow: hidden;">
        <div style="padding: 5px 10px; background: rgba(99,102,241,0.1); display: flex; align-items: center; gap: 5px; border-bottom: 1px solid rgba(129,140,248,0.1);">
          <i class="fa-solid fa-terminal" style="color: #818cf8; font-size: 10px;"></i>
          <span style="font-size: 0.65rem; color: #818cf8; font-weight: 600;">python</span>
        </div>
        <pre style="margin: 0; padding: 8px 10px; font-size: 0.62rem; color: #a5b4fc; font-weight: 500; line-height: 1.55; white-space: pre-wrap; overflow-x: hidden; font-family: monospace;">${CODE_SNIPPET}</pre>
      </div>`;
    return '';
  };

  const getDots = (color) => `
    <span style="display: inline-flex; gap: 4px; align-items: center; height: 14px;">
      <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${color}; animation: dsTd 1s ease-in-out 0s infinite;"></span>
      <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${color}; animation: dsTd 1s ease-in-out 0.15s infinite;"></span>
      <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${color}; animation: dsTd 1s ease-in-out 0.3s infinite;"></span>
    </span>`;

  // Inject Styles for this section
  if(!document.getElementById('demo-section-styles')) {
      const style = document.createElement('style');
      style.id = 'demo-section-styles';
      style.innerHTML = `
        @keyframes dsTd {
          0%,70%,100%{transform:scale(1);opacity:0.35}
          35%{transform:scale(1.7);opacity:1}
        }
        @keyframes dsBIn {
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes dsPulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.4;transform:scale(0.6)}
        }
        @keyframes dsVprog {
          from{transform:scaleX(0);transform-origin:left}
          to{transform:scaleX(1);transform-origin:left}
        }
        div::-webkit-scrollbar{width:3px}
        .demo-scroll-thumb::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        
        @media (max-width: 600px) {
          #demo-pills { flex-wrap: wrap; justify-content: center; gap: 8px !important; }
          #demo-card { border-radius: 16px !important; margin-bottom: 30px; width: 95%; max-width: 400px; }
          .demo-scroll-thumb { min-height: 520px !important; max-height: 700px !important; }
          #demo-card-inner > div:first-child { padding: 12px 14px !important; }
        }
      `;
      document.head.appendChild(style);
  }

  // Layout Container HTML
  root.innerHTML = `
      <!-- Label -->
      <div style="display: inline-flex; align-items: center; gap: 7px; padding: 5px 15px; border-radius: 999px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.28); margin-bottom: 1.25rem; z-index: 10; position: relative;">
        <i class="fa-solid fa-bolt" style="font-size: 11px; color: #818cf8;"></i>
        <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; color: #818cf8;">LIVE DEMO</span>
      </div>

      <!-- Heading -->
      <h2 style="font-size: clamp(1.8rem,5vw,3.2rem); font-weight: 900; color: #f8fafc; text-align: center; margin-bottom: 0.6rem; letter-spacing: -0.03em; line-height: 1.1; z-index: 10; position: relative;">
        See AISA™ <span style="background: linear-gradient(135deg,#4F46E5,#7C3AED,#EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">in Action</span>
      </h2>
      <p style="color: rgba(148,163,184,0.65); font-size: 0.95rem; text-align: center; max-width: 440px; line-height: 1.6; margin-bottom: 2.8rem; position: relative; z-index: 10;">
        Every feature flips automatically — watch the full demo.
      </p>

      <!-- Ambient glow -->
      <div id="demoglow" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 700px; height: 500px; border-radius: 50%; filter: blur(50px); pointer-events: none; z-index: 1; transition: background 0.5s ease;"></div>

      <!-- Feature indicator pills -->
      <div id="demo-pills" style="display: flex; gap: 6px; margin-bottom: 1.2rem; z-index: 10; position: relative;"></div>

      <!-- DEMO CARD -->
      <div id="demo-card" style="
          position: relative; z-index: 10; width: 100%; max-width: 840px; border-radius: 20px;
          backdrop-filter: blur(40px); overflow: hidden; transform-style: preserve-3d; perspective: 1200px;
          transition: box-shadow 0.5s ease, border-color 0.5s ease, background 0.5s ease;
      ">
        <div id="demo-card-inner"></div>
      </div>
  `;

  let activeIdx = 0;
  let started = false;
  let runStatus = false;

  const glowRef = document.getElementById('demoglow');
  const cardRef = document.getElementById('demo-card');
  const pillsRef = document.getElementById('demo-pills');
  const innerRef = document.getElementById('demo-card-inner');

  // Utility to render whole card state
  const renderCardState = () => {
    const feat = FEATURES[activeIdx];
    
    // update parent wrapper gradient & glow
    glowRef.style.background = `radial-gradient(ellipse,${feat.glow} 0%,rgba(168,85,247,0.1) 50%,transparent 100%)`;
    cardRef.style.background = `linear-gradient(160deg, rgba(15,15,35,0.95) 0%, ${feat.bgAccent} 100%)`;
    cardRef.style.border = `1px solid ${feat.color}33`;
    cardRef.style.boxShadow = `0 0 70px ${feat.glow}, 0 30px 80px rgba(0,0,0,0.7)`;

    // render pills
    pillsRef.innerHTML = FEATURES.map((f, i) => {
        const isActive = i === activeIdx;
        const pbg = isActive ? `${f.color}20` : 'rgba(255,255,255,0.04)';
        const pbd = isActive ? `1px solid ${f.color}55` : '1px solid rgba(255,255,255,0.08)';
        const pcl = isActive ? f.color : 'rgba(255,255,255,0.25)';
        const fw  = isActive ? 700 : 400;
        const iconStyle = { xs: window.innerWidth < 600 ? 'none' : 'inline' };
        
        return `
            <div style="display: flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 999px; background: ${pbg}; border: ${pbd}; color: ${pcl}; font-size: 0.68rem; font-weight: ${fw}; transition: all 0.35s ease;">
                <i class="fa-solid ${f.icon}" style="font-size:11px;"></i>
                <span class="d-sm-none" style="display:${iconStyle.xs}">${f.label}</span>
                ${isActive ? `<span style="width: 5px; height: 5px; border-radius: 50%; background: ${f.color}; animation: dsPulse 1.2s infinite;"></span>` : ''}
            </div>
        `;
    }).join('');

    // render card interior
    let chatHtml = '';
    if (feat.type === 'title') {
        chatHtml = `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 40px; gap: 16px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, ${feat.color}44, ${feat.color}); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px ${feat.color}44; animation: dsPulse 2s infinite;">
                 <i class="fa-solid ${feat.icon}" style="font-size: 30px; color: #fff;"></i>
              </div>
              <h2 style="font-size: clamp(1.5rem, 4vw, 2.3rem); font-weight: 900; color: #fff; text-shadow: 0 0 30px ${feat.color}66; line-height: 1.1; letter-spacing: -0.02em;">
                ${feat.text}
              </h2>
            </div>
        `;
    }

    innerRef.innerHTML = `
        <!-- Chrome bar -->
        <div style="display: flex; align-items: center; gap: 7px; padding: 11px 16px; border-bottom: 1px solid ${feat.color}20; background: rgba(0,0,0,0.25); border-top-left-radius: 20px; border-top-right-radius: 20px;">
          ${['#ff5f57','#febc2e','#28c840'].map(c => `<div style="width: 10px; height: 10px; border-radius: 50%; background: ${c}"></div>`).join('')}
          <div style="flex: 1; text-align: center; background: rgba(255,255,255,0.05); border-radius: 7px; padding: 3px 12px; font-size: 0.68rem; color: rgba(148,163,184,0.5); max-width: 220px; margin: 0 auto; font-weight: 500;">
            aisa.ai — AI Workspace
          </div>
          <div style="display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: ${feat.color}18; border: 1px solid ${feat.color}40; font-size: 0.6rem; font-weight: 700; color: ${feat.color};">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: ${feat.color}; animation: dsPulse 1.2s infinite"></span>
            LIVE
          </div>
        </div>

        <!-- Feature header row -->
        <div style="display: flex; align-items: center; gap: 8px; padding: 9px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ${feat.color}08;">
          <i class="fa-solid ${feat.icon}" style="font-size:14px; color: ${feat.color};"></i>
          <span style="font-size: 0.7rem; font-weight: 800; color: ${feat.color}; letter-spacing: 0.1em;">${feat.label.toUpperCase()}</span>
          <i class="fa-solid fa-chevron-right" style="font-size:12px; color: rgba(255,255,255,0.2);"></i>
          <span style="font-size: 0.68rem; color: rgba(255,255,255,0.35); font-weight: 500;">${activeIdx + 1} of ${FEATURES.length}</span>
          <div style="margin-left: auto; display: flex; gap: 4px;">
            ${FEATURES.map((_, i) => `<div style="height: 3px; border-radius: 2px; width: ${i === activeIdx ? 24 : 6}px; background: ${i === activeIdx ? feat.color : 'rgba(255,255,255,0.12)'}; transition: all 0.4s ease;"></div>`).join('')}
          </div>
        </div>

        <!-- Chat body -->
        <div id="demo-chat-wrapper" class="demo-scroll-thumb" style="padding: 14px 16px 16px; min-height: 480px; max-height: 600px; overflow-y: ${feat.type==='title'?'hidden':'auto'}; display: flex; flex-direction: column; scroll-behavior: smooth;">
            ${chatHtml}
        </div>

        <!-- Input -->
        <div style="padding: 10px 14px; border-top: 1px solid ${feat.color}18; display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2);">
          <div style="flex: 1; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid ${feat.color}22; color: rgba(148,163,184,0.3); font-size: 0.78rem; font-weight: 500;">
            Message AISA™…
          </div>
          <button style="padding: 8px 16px; border-radius: 10px; border: none; background: linear-gradient(135deg,${feat.color}cc,${feat.color}); color: #fff; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 0 14px ${feat.glow}; transition: all 0.4s ease;">
            Send
          </button>
        </div>
    `;
  };

  const createBubble = (uid, step, feat, isDarkMode = true) => {
    const isUser = step.from === 'user';
    
    let avatarStr = isUser 
        ? `<div style="width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user" style="font-size: 11px; color: #94a3b8;"></i></div>`
        : `<div style="width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg,${feat.color}99,${feat.color}); box-shadow: 0 0 8px ${feat.color}55; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-robot" style="font-size: 12px; color: #fff;"></i></div>`;

    const contentBg = isUser ? `linear-gradient(135deg,${feat.color}bb,${feat.color})` : `rgba(255,255,255,0.07)`;
    const contentBorder = isUser ? `none` : `1px solid rgba(255,255,255,0.1)`;
    const contentColor = `#e2e8f0`;
    const contentRadius = isUser ? `14px 14px 4px 14px` : `4px 14px 14px 14px`;
    
    const contentStr = `
        <div style="max-width: 73%; padding: 8px 12px; border-radius: ${contentRadius}; background: ${contentBg}; border: ${contentBorder}; color: ${contentColor}; font-size: 0.8rem; line-height: 1.5; white-space: pre-wrap;">
            <span class="ds-text-content">${step.typing ? getDots(feat.color) : (step.text || '')}</span>
            ${!step.typing && step.card ? getCardHtml(step.card) : ''}
        </div>
    `;

    return `
        <div id="${uid}" style="display: flex; gap: 8px; justify-content: ${isUser ? 'flex-end' : 'flex-start'}; margin-bottom: 10px; animation: dsBIn 0.25s ease forwards;">
            ${isUser ? contentStr + avatarStr : avatarStr + contentStr}
        </div>
    `;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Sequence Player
  const runFeature = async (idx) => {
    activeIdx = idx;
    renderCardState();
    
    const feat = FEATURES[idx];
    const wrapper = document.getElementById('demo-chat-wrapper');

    if (feat.type === 'title') {
      if (idx === 0) {
        gsap.fromTo(cardRef,
          { scale: 0.9, y: 30, rotateX: 15, opacity: 0 },
          { scale: 1, y: 0, rotateX: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.75)' }
        );
      }
      await sleep(2600);
      return;
    }

    // append empty start text
    wrapper.innerHTML = `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: rgba(148,163,184,0.25); padding-bottom: 10px;"><i class="fa-solid ${feat.icon}" style="font-size:26px; color:${feat.color}; opacity:0.35;"></i><span style="font-size:0.78rem; font-weight:500;">Starting ${feat.label}…</span></div>`;

    for (let i = 0; i < feat.steps.length; i++) {
      if (!runStatus) return;
      const step = feat.steps[i];
      const uid = `uid-${idx}-${i}`;

      if (i === 0) wrapper.innerHTML = ''; // clear start text

      if (step.from === 'ai') {
        const d = document.createElement('div');
        d.innerHTML = createBubble(uid + 't', { ...step, typing: true }, feat);
        wrapper.appendChild(d.firstElementChild);
        wrapper.scrollTop = wrapper.scrollHeight;
        
        await sleep(step.ms || 450);
        if (!runStatus) return;

        const el = document.getElementById(uid + 't');
        if(el) {
            el.outerHTML = createBubble(uid, step, feat);
        }
        await sleep(150);
      } else {
        const d = document.createElement('div');
        d.innerHTML = createBubble(uid, step, feat);
        wrapper.appendChild(d.firstElementChild);
        await sleep(300);
      }
      if(wrapper) wrapper.scrollTop = wrapper.scrollHeight;
    }
    await sleep(700);
  };

  const flipToNext = async (card, nextIdx) => {
    return new Promise(res => {
        const tl = gsap.timeline({ onComplete: res });
        tl.to(card, { rotateY: 90, scale: 0.94, duration: 0.15, ease: 'power2.in' })
          .call(() => {
              activeIdx = nextIdx;
              renderCardState();
          })
          .to(card, { rotateY: 0, scale: 1, duration: 0.15, ease: 'power2.out' });
    });
  };

  const cycle = async () => {
    runStatus = true;
    let idx = 0;
    while (runStatus) {
      await runFeature(idx);
      if (!runStatus) break;
      const next = (idx + 1) % FEATURES.length;
      await flipToNext(cardRef, next);
      idx = next;
    }
  };

  // init trigger
  gsap.set(cardRef, { scale: 0.82, opacity: 0, filter: 'blur(12px)', rotateY: 0 });
  gsap.set(glowRef, { opacity: 0, scale: 0.5 });

  const revealDemo = () => {
      if (started) return;
      started = true;
      setTimeout(() => cycle(), 700);
  };

  const revealTl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top 88%',
      once: true,
      onEnter: revealDemo,
    },
  });
  revealTl.to(glowRef, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' })
    .to(cardRef, { scale: 1.04, opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }, '<0.1')
    .to(cardRef, { scale: 1, duration: 0.22, ease: 'power2.inOut' });
  revealTl.to(glowRef, { scale: 1.1, opacity: 0.6, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });

};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', DemoSectionMain);
} else {
    DemoSectionMain();
}
