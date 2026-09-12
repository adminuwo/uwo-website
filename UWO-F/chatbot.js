/**
 * UWO Premium AI Chatbot - Logical Flow
 * 1. Welcome Message
 * 2. Inline Email Registration (if not yet registered)
 * 3. Intelligent Chat (Vertex AI - Gemini 2.5 Flash)
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatbotWidget = document.getElementById('uwo-chatbot-widget');
    if (!chatbotWidget) return;

    const toggleBtn = chatbotWidget.querySelector('.chatbot-toggle-btn');
    const chatbotPanel = chatbotWidget.querySelector('.chatbot-panel');
    const chatbotCloseBtn = chatbotWidget.querySelector('.chatbot-close-btn');
    const chatArea = chatbotWidget.querySelector('.chat-area');
    const chatInput = chatbotWidget.querySelector('#chatbot-input');
    const micBtn = chatbotWidget.querySelector('#chatbot-mic');
    const sendBtn = chatbotWidget.querySelector('.chatbot-send-btn');

    let welcomeSent = false;
    let isRegistering = false;
    let chatHistory = []; // To maintain context
    let isListening = false; // Flag for ChatGPT style mic toggle

    // --- Voice Input (Speech Recognition) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Stay on until manually stopped
        recognition.interimResults = true; // Feedback as user speaks
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            isListening = true;
            if (micBtn) {
                micBtn.classList.add('active');
                micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            }
            chatInput.placeholder = "Listening...";

            // Show waveform
            const inputArea = chatbotWidget.querySelector('.chatbot-input-area');
            if (inputArea && !document.querySelector('.waveform-container')) {
                const wave = document.createElement('div');
                wave.className = 'waveform-container animate__animated animate__fadeIn';
                wave.innerHTML = `<div class="waveform-bar"></div><div class="waveform-bar"></div><div class="waveform-bar"></div><div class="waveform-bar"></div><div class="waveform-bar"></div>`;
                inputArea.prepend(wave);
            }
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                // Get current value, append final part if not already present
                chatInput.value = (chatInput.value.trim() + ' ' + finalTranscript).trim();
            }

            // If we have interim results, we could show them as a placeholder or in a separate div
            // but for simplicity and to not break layout, we just update the placeholder
            if (interimTranscript) {
                chatInput.placeholder = interimTranscript + "...";
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            stopListening();
        };

        recognition.onend = () => {
            if (isListening) stopListening();
        };
    }

    const stopListening = () => {
        isListening = false;
        if (recognition) recognition.stop();
        if (micBtn) {
            micBtn.classList.remove('active');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
        chatInput.placeholder = "How can I help you today?";

        // Remove waveform
        const wave = document.querySelector('.waveform-container');
        if (wave) wave.remove();
    };

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (!recognition) {
                alert("Speech recognition is not supported in your browser or is disabled.");
                return;
            }

            // Check if context is secure for mic access
            if (!window.isSecureContext) {
                alert("Microphone access requires a secure (HTTPS) connection. Please check your URL.");
                console.error("Mic access denied: Not a secure context.");
                return;
            }

            if (isListening) {
                stopListening();
            } else {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Mic start failed:", e);
                    // Some browsers throw if already started or permission denied
                    if (e.name === 'NotAllowedError') {
                        alert("Microphone permission denied. Please allow mic access in your browser settings.");
                    } else {
                        stopListening();
                    }
                }
            }
        });
    }

    // --- Voice Output (Text to Speech) - DISABLED AS PER REQUEST ---
    const speakMessage = (text) => {
        // Disabled bot speech as requested: "ai voice me rewply n de only trext me dee"
    };

    // --- State Check ---
    const getRegisteredEmail = () => localStorage.getItem('uwo_registered_email');
    const isRegistered = () => !!getRegisteredEmail();

    // --- Overlay Creation ---
    const overlay = document.createElement('div');
    overlay.className = 'chatbot-overlay';
    document.body.appendChild(overlay);

    // --- Panel Toggle ---
    const toggleChat = () => {
        const isActive = chatbotPanel.classList.contains('active');
        if (isActive) {
            chatbotPanel.classList.remove('active');
            chatbotWidget.classList.remove('chat-open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-robot"></i>';
            window.speechSynthesis.cancel();
        } else {
            chatbotPanel.classList.add('active');
            chatbotWidget.classList.add('chat-open');
            overlay.classList.add('active');
            if (window.innerWidth <= 580) {
                document.body.style.overflow = 'hidden';
            }
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            if (!welcomeSent) {
                setTimeout(sendWelcomeMessage, 400);
                welcomeSent = true;
            }
            setTimeout(() => chatInput && chatInput.focus(), 300);
        }
    };

    toggleBtn.addEventListener('click', toggleChat);
    overlay.addEventListener('click', toggleChat);
    chatbotCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleChat();
    });

    // --- Messaging UI ---
    const formatMarkdown = (text) => {
        // Handle bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Handle lists and paragraphs
        const lines = text.split('\n');
        let inList = false;
        let result = '';

        lines.forEach(line => {
            const trimmed = line.trim();

            // Handle Horizontal Rules
            if (trimmed.startsWith('---') || trimmed.startsWith('━━━')) {
                if (inList) { result += '</ul>'; inList = false; }
                result += '<hr style="border: 0; height: 1px; background: linear-gradient(to right, transparent, rgba(250, 190, 86, 0.3), transparent); margin: 15px 0;">';
                return;
            }

            // Handle both standard markdown and the bullet character '•'
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                const liContent = trimmed.replace(/^[\*\-\•]\s*/, '');
                if (!inList) {
                    result += '<ul style="margin: 10px 0 10px 20px; list-style-type: disc;">';
                    inList = true;
                }
                result += `<li style="margin-bottom: 5px; color: #e2e8f0;">${liContent}</li>`;
            } else if (trimmed === '') {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                result += '<div style="height: 8px;"></div>';
            } else {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                // Check if it's a section header like [SECTION]
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    result += `<h4 style="color: #FABE56; margin: 15px 0 5px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">${trimmed}</h4>`;
                } else {
                    result += `<p style="margin-bottom: 8px; line-height: 1.6; color: #cbd5e1; font-weight: 400;">${line}</p>`;
                }
            }
        });

        if (inList) result += '</ul>';
        return result;
    };

    const addMessage = (text, sender) => {
        text = text.trim();
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender === 'bot' ? 'bot-wrapper' : 'user-wrapper'} animate__animated animate__fadeInUp`;
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        // Format if bot, or just escape if user
        const formattedText = sender === 'bot' ? formatMarkdown(text) : text;

        wrapper.innerHTML = `
            <div class="message ${sender === 'bot' ? 'bot-message' : 'user-message'}">
                <div class="message-content">${formattedText}</div>
                <span class="message-time">${timeStr}</span>
            </div>
        `;
        chatArea.appendChild(wrapper);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
        if (sender === 'bot' && text.length > 0) speakMessage(text);
    };

    const showLoading = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chat-loading';
        loadingDiv.className = 'message-wrapper bot-wrapper animate__animated animate__fadeIn';
        loadingDiv.innerHTML = `
            <div class="message bot-message" style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 12px 18px;">
                <div class="typing" style="padding: 0;">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <div style="font-size: 10px; opacity: 0.7; font-weight: 600; letter-spacing: 0.5px;">AI IS TYPING...</div>
            </div>
        `;
        chatArea.appendChild(loadingDiv);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
    };

    const hideLoading = () => {
        const loading = document.getElementById('chat-loading');
        if (loading) loading.remove();
    };

    // --- Welcome & Registration ---
    const sendWelcomeMessage = () => {
        if (!isRegistered()) {
            addMessage("Welcome to the **UWO™ Intelligent Hub**. I am your dedicated digital assistant here to guide you through the future of **AI Automation**. \n\nBefore we unlock the full potential of our digital ecosystem, may I ask for your professional email to personalize your experience?", "bot");
            addRegisterCard();
            isRegistering = true;
        } else {
            addMessage(`Welcome back to the **UWO™ Ecosystem**. I am fully synchronized and ready to assist you with your **AI Integration** or digital strategy. \n\nHow can I accelerate your business goals today?`, "bot");
            addSuggestions(["What is UWO™?", "Our Services", "AI Solutions"]);
        }
    };

    const addRegisterCard = () => {
        const card = document.createElement('div');
        card.className = 'reg-card';
        card.innerHTML = `
            <h4>Join UWO AI</h4>
            <div class="input-group">
                <input type="email" id="reg-email" placeholder="Enter your business email..." required>
            </div>
            <button class="reg-submit-btn" id="reg-submit">Get Started</button>
        `;
        chatArea.appendChild(card);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });

        const submitBtn = card.querySelector('#reg-submit');
        const emailInput = card.querySelector('#reg-email');

        const handleSubmit = async () => {
            const email = emailInput.value.trim();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert("Please enter a valid email address.");
                return;
            }
            submitBtn.disabled = true;
            submitBtn.innerText = "Registering...";
            try {
                const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                    ? "http://localhost:8080/api/register-email"
                    : "https://uwo-backend-977864306871.asia-south1.run.app/api/register-email";
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (res.ok) {
                    localStorage.setItem('uwo_registered_email', email);
                    card.innerHTML = `<div style="color: #22c55e; font-weight: 700; text-align: center;">✓ Registration Complete</div>`;
                    setTimeout(() => {
                        card.remove();
                        addMessage(`Thank you! Everything is set. How can I help you today?`, "bot");
                        addSuggestions(["Our Services", "Digital Partnerships", "AI Solutions"]);
                        isRegistering = false;
                    }, 1200);
                } else {
                    throw new Error("Registration failed");
                }
            } catch (err) {
                console.error(err);
                alert("Connection error. Please try again.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Get Started";
            }
        };
        submitBtn.addEventListener('click', handleSubmit);
        emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSubmit(); });
    };

    const addSuggestions = (suggestions) => {
        const container = document.createElement('div');
        container.className = 'suggestion-container';
        suggestions.forEach(text => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.innerText = text;
            chip.onclick = () => {
                chatInput.value = text;
                handleSend();
                container.remove();
            };
            container.appendChild(chip);
        });
        chatArea.appendChild(container);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
    };

    const handleSend = async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        if (isRegistering) {
            alert("Please complete registration first to start chatting!");
            return;
        }
        addMessage(message, "user");
        chatInput.value = "";
        chatInput.disabled = true;
        sendBtn.disabled = true;
        if (micBtn) micBtn.disabled = true;
        sendBtn.style.opacity = "0.5";
        sendBtn.style.cursor = "not-allowed";
        const suggestions = document.querySelector('.suggestion-container');
        if (suggestions) suggestions.remove();
        showLoading();
        try {
            const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                ? "http://localhost:8080/api/chat"
                : "https://uwo-backend-977864306871.asia-south1.run.app/api/chat";
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, email: getRegisteredEmail(), history: chatHistory })
            });
            const data = await res.json();
            hideLoading();
            if (data.reply) {
                chatHistory.push({ role: 'user', parts: [{ text: message }] });
                chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
                if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
                addMessage(data.reply, "bot");
            } else {
                addMessage("I'm sorry, I'm having trouble thinking right now. Please try again later.", "bot");
            }
        } catch (err) {
            hideLoading();
            console.error(err);
            addMessage("Connection error. Please ensure the backend is running.", "bot");
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            if (micBtn) micBtn.disabled = false;
            sendBtn.style.opacity = "1";
            sendBtn.style.cursor = "pointer";
            chatInput.focus();
        }
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
});
