import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Plus,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { sendMessage } from '../services/chatbotService';

const CHAT_STORAGE_KEY = 'aura_chat_history';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome-page-default',
  sender: 'bot',
  text: "Hello! I'm AURA, your 24/7 AI-assisted medical assistant. Ask me anything about symptom evaluation, preventive healthcare guides, or discovering nearby emergency services.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isEmergency: false,
  sources: []
};

function Chatbot() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = location.state?.initialPrompt || '';

  const [inputMessage, setInputMessage] = useState('');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to persist aura_chat_history:', err);
    }
  }, [messages]);

  // Handle initial prompt passed via navigation state
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend = inputMessage) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === inputMessage) {
      setInputMessage('');
    }
    setLoading(true);

    try {
      const data = await sendMessage(trimmed);

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data?.response || 'I was unable to synthesize a response from the available medical evidence.',
        isEmergency: Boolean(data?.isEmergency || data?.is_emergency),
        sources: Array.isArray(data?.sources) ? data.sources : [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot API request failed:', err);
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Service unavailable. Try again.',
        isEmergency: false,
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear aura_chat_history:', err);
    }
  };

  const handleNewChat = () => {
    handleClearHistory();
  };

  // Quick Action Buttons
  const quickActions = [
    { label: 'Symptoms of anemia', query: 'What are the symptoms of anemia?' },
    { label: 'Emergency help', query: 'I need immediate emergency help' },
    { label: 'About my disease', query: 'Tell me about managing chronic conditions' },
  ];

  // Extract past user inquiries from history for sidebar list
  const userHistoryItems = messages.filter((m) => m.sender === 'user');

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold text-blue-300 uppercase tracking-wider">
              <Sparkles size={14} className="text-blue-400" />
              <span>RAG Clinical AI Assistant</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AURA AI Medical Assistant
            </h1>

            <p className="text-blue-100 text-xs sm:text-sm font-medium max-w-xl">
              Evidence-grounded medical guidance, symptom analysis, disease overview, and emergency triage.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-300 font-bold shrink-0 shadow-inner">
            <MessageSquare size={32} />
          </div>
        </div>
      </section>

      {/* QUICK ACTION BUTTONS */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Inquiries:</span>
        {quickActions.map((qa, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qa.query)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* FULL-SCREEN CHAT CONTAINER WITH SIDEBAR */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row h-[650px] overflow-hidden">
        
        {/* SIDEBAR: Conversation History */}
        <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
              <Clock size={16} className="text-blue-600" />
              <span>Chat History</span>
            </div>

            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="New Chat Session"
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {userHistoryItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No past questions in current session.
              </div>
            ) : (
              userHistoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSendMessage(item.text)}
                  disabled={loading}
                  className="w-full p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-left transition-colors text-xs text-slate-700 font-medium group cursor-pointer block truncate"
                  title={item.text}
                >
                  <p className="truncate text-slate-800 group-hover:text-blue-600">{item.text}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{item.timestamp}</span>
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-200/80 bg-white/50">
            <button
              onClick={handleClearHistory}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Clear Conversation</span>
            </button>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Header Ribbon */}
          <div className="bg-slate-900 text-white p-3.5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white">AURA Medical Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400">Spring Boot /api/chat & Hybrid RAG Connected</p>
              </div>
            </div>

            <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <ShieldAlert size={13} />
              <span>Clinical Guidance — Not a Final Diagnosis</span>
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isBot ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-700 text-white shadow-xs'
                    }`}
                  >
                    {isBot ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  <div className="max-w-[75%] space-y-1.5">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        isBot
                          ? 'bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs rounded-tl-xs'
                          : 'bg-blue-600 text-white shadow-xs rounded-tr-xs font-medium'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Red Open Emergency Page button if emergency detected */}
                      {isBot && msg.isEmergency && (
                        <button
                          onClick={() => navigate('/emergency')}
                          className="mt-3.5 w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer animate-pulse"
                        >
                          <AlertTriangle size={16} className="shrink-0" />
                          <span>Open Emergency Page (SOS)</span>
                        </button>
                      )}

                      {/* Sources Display: "Source: MedQuAD" */}
                      {isBot && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
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

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3 text-slate-500 text-xs py-1">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
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

          {/* Disclaimer at Bottom */}
          <div className="bg-slate-100/90 border-t border-slate-200/80 px-4 py-2 text-center text-xs text-slate-500 font-medium shrink-0">
            For informational purposes only. Consult a doctor.
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={loading ? 'Waiting for response...' : 'Ask AURA a medical question...'}
              className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-slate-50 font-medium disabled:opacity-60"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </div>
        </main>

      </div>
    </div>
  );
}

export default Chatbot;
