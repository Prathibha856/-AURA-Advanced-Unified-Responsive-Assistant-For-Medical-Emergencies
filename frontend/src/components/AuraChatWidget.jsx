import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { sendMessage } from '../services/chatbotService';

const CHAT_STORAGE_KEY = 'aura_chat_history';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome-widget-default',
  sender: 'bot',
  text: "Hello! I'm AURA, your 24/7 AI-assisted medical assistant. How can I help you with your symptoms, treatments, or health questions today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isEmergency: false,
  sources: []
};

function AuraChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. State
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse aura_chat_history from localStorage:', err);
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const messagesEndRef = useRef(null);

  // Hide floating widget on Emergency route to avoid crowding critical SOS controls
  const isEmergencyPage = location.pathname === '/emergency';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Persist messages to localStorage whenever messages array updates
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save aura_chat_history to localStorage:', err);
    }
  }, [messages]);

  if (isEmergencyPage) {
    return null;
  }

  // 2. Submit Handler
  const handleSubmit = async (textToSend = input) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (textToSend === input) {
      setInput('');
    }
    setLoading(true);

    try {
      const data = await sendMessage(trimmed);

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data?.response || 'I was unable to synthesize a response from the available medical evidence.',
        isEmergency: Boolean(data?.isEmergency || data?.is_emergency),
        sources: Array.isArray(data?.sources) ? data.sources : [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot API request failed:', err);
      const errorMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Service unavailable. Try again.',
        isEmergency: false,
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearChat = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear aura_chat_history:', err);
    }
  };

  const handleOpenEmergency = () => {
    setIsOpen(false);
    navigate('/emergency');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 3. Chat Panel (400px wide, 600px tall) */}
      {isOpen && (
        <div className="w-[400px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mb-4">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-4 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
                <Sparkles size={20} className="text-blue-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight">AURA Medical Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-blue-200 font-medium">Evidence-Grounded RAG Clinical Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <RotateCcw size={13} />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isBot
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-700 text-white shadow-xs'
                    }`}
                  >
                    {isBot ? <Bot size={15} /> : <User size={15} />}
                  </div>

                  <div className="max-w-[80%] space-y-1.5">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        isBot
                          ? 'bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs rounded-tl-xs'
                          : 'bg-blue-600 text-white shadow-xs rounded-tr-xs font-medium'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Red Open Emergency Page button if emergency detected */}
                      {isBot && msg.isEmergency && (
                        <button
                          onClick={handleOpenEmergency}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer animate-pulse"
                        >
                          <AlertTriangle size={15} className="shrink-0" />
                          <span>Open Emergency Page (SOS)</span>
                        </button>
                      )}

                      {/* Sources Display: "Source: MedQuAD" */}
                      {isBot && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="font-semibold text-slate-600">Source:</span>
                              <span className="text-slate-500 truncate">
                                {src.source || 'MedQuAD'}
                                {src.qtype ? ` (${src.qtype})` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[10px] text-slate-400 block px-1 ${
                        isBot ? 'text-left' : 'text-right'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 4. Loading state: Animated dots "AURA is thinking..." */}
            {loading && (
              <div className="flex items-center gap-2.5 text-slate-500 text-xs py-1">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="font-medium text-slate-700">AURA is thinking...</span>
                  <div className="flex items-center gap-1 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Disclaimer at bottom */}
          <div className="bg-slate-100/90 border-t border-slate-200/80 px-3 py-1.5 text-center text-[10px] text-slate-500 font-medium shrink-0">
            For informational purposes only. Consult a doctor.
          </div>

          {/* Input & Send Button */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={loading ? 'Waiting for response...' : 'Ask AURA a health question...'}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-slate-50 disabled:opacity-60"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-xs cursor-pointer"
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Floating Button (bottom-right, blue circle with chat icon) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer relative group"
        aria-label="Open AURA Medical Assistant"
        title="Open AURA Medical Assistant"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-600" />
        {/* Subtle Ping Animation */}
        <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping -z-10" />
      </button>
    </div>
  );
}

export default AuraChatWidget;
