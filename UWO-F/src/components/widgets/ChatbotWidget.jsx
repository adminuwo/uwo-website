import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../services/api';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(() => !!localStorage.getItem('uwo_registered_email'));
  const [regEmail, setRegEmail] = useState('');
  const [regStatus, setRegStatus] = useState(null); // 'registering', 'done', or null
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize messages on first open or registration state change
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!isRegistered) {
      setMessages([
        {
          sender: 'bot',
          text: 'Welcome to the **UWO™ Intelligent Hub**. I am your dedicated digital assistant here to guide you through the future of **AI Automation**.\n\nBefore we unlock the full potential of our digital ecosystem, may I ask for your professional email to personalize your experience?',
          time: timeStr
        }
      ]);
      setSuggestions([]);
    } else {
      setMessages([
        {
          sender: 'bot',
          text: 'Welcome back to the **UWO™ Ecosystem**. I am fully synchronized and ready to assist you with your **AI Integration** or digital strategy.\n\nHow can I accelerate your business goals today?',
          time: timeStr
        }
      ]);
      setSuggestions(['What is UWO™?', 'Our Services', 'AI Solutions']);
    }
  }, [isRegistered]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  // Auto-scroll chat area
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading, regStatus, suggestions]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && isRegistered) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen, isRegistered]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const email = regEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    setRegStatus('registering');
    try {
      const res = await fetch(`${API_URL}/register-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        localStorage.setItem('uwo_registered_email', email);
        setRegStatus('done');
        setTimeout(() => {
          setIsRegistered(true);
          setRegStatus(null);
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: 'Thank you! Everything is set. How can I help you today?',
              time: timeStr
            }
          ]);
          setSuggestions(['Our Services', 'Digital Partnerships', 'AI Solutions']);
        }, 1200);
      } else {
        throw new Error('Registration failed');
      }
    } catch {
      alert('Connection issue. Please try again.');
      setRegStatus(null);
    }
  };

  const handleSend = async (customText) => {
    const text = (customText || inputValue).trim();
    if (!text || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { sender: 'user', text, time: userTime }];
    setMessages(newMessages);
    setInputValue('');
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const botReply = data.reply || data.response || "Thank you for reaching out! Our team is available to assist you at admin@uwo24.com.";
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages([...newMessages, { sender: 'bot', text: botReply, time: botTime }]);
    } catch {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: "I'm experiencing a brief connectivity hiccup. Feel free to explore our platforms or reach our team at **admin@uwo24.com**.",
          time: botTime
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageText = (text) => {
    // Render bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="uwo-chatbot-widget">
      {/* Floating Toggle Button */}
      <div 
        className="chatbot-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with UWO™ AI"
      >
        <i className={isOpen ? "fa-solid fa-xmark" : "fa-solid fa-robot"}></i>
      </div>

      {/* Main Chatbot Panel (Docked to Bottom-Right Corner) */}
      <div className={`chatbot-panel ${isOpen ? 'active' : ''}`} style={{ display: isOpen ? 'flex' : 'none' }}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="bot-avatar">
            <img src="/images/uwo-logo.png" alt="UWO Logo" onError={(e) => { e.currentTarget.src = '/images/logo..webp'; }} />
          </div>
          <div className="header-info">
            <h3>UWO<sup>&trade;</sup> AI Assistant</h3>
            <p>Always Intelligent</p>
          </div>
          <button type="button" className="chatbot-close-btn" onClick={() => setIsOpen(false)} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Chat Area */}
        <div className="chat-area" ref={chatAreaRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`message-wrapper ${m.sender === 'bot' ? 'bot-wrapper' : 'user-wrapper'}`}>
              <div className={`message ${m.sender === 'bot' ? 'bot-message' : 'user-message'}`}>
                <div className="message-content">
                  {formatMessageText(m.text)}
                </div>
                <span className="message-time">{m.time}</span>
              </div>
            </div>
          ))}

          {/* Inline Email Registration Card if not registered */}
          {!isRegistered && (
            <div className="reg-card">
              {regStatus === 'done' ? (
                <div style={{ color: '#22c55e', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>
                  ✓ Registration Complete
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <h4>Join UWO AI</h4>
                  <div className="input-group">
                    <input 
                      type="email" 
                      id="reg-email" 
                      placeholder="Enter your business email..." 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required 
                      disabled={regStatus === 'registering'}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="reg-submit-btn" 
                    id="reg-submit"
                    disabled={regStatus === 'registering'}
                  >
                    {regStatus === 'registering' ? 'Registering...' : 'Get Started'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Thinking Indicator */}
          {loading && (
            <div className="message-wrapper bot-wrapper">
              <div className="message bot-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="typing" style={{ padding: 0 }}>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>AI IS TYPING...</span>
              </div>
            </div>
          )}

          {/* Suggestion Chips */}
          {suggestions.length > 0 && !loading && (
            <div className="suggestion-container">
              {suggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  className="suggestion-chip" 
                  onClick={() => handleSend(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form 
          className="chatbot-input-area" 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          {isListening && (
            <div className="waveform-container">
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
            </div>
          )}
          <input 
            ref={inputRef}
            type="text" 
            id="chatbot-input" 
            placeholder={isListening ? "Listening..." : "How can I help you today?"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="button" 
            className={`chatbot-mic-btn ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            <i className={isListening ? "fa-solid fa-stop" : "fa-solid fa-microphone"}></i>
          </button>
          <button type="submit" className="chatbot-send-btn" aria-label="Send message">
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>

        <div className="powered-by">
          Powered by UWO<sup>&trade;</sup> Ecosystem &bull; D-U-N-S® Registered™
        </div>
      </div>
    </div>
  );
}
