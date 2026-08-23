import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { MOCK_BOT_RESPONSES } from '../data/mockData';

function AuraChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "Hi, I'm AURA 👋 Your 24/7 AI Health Assistant. How can I support your wellbeing today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Hide floating widget completely on Emergency route to avoid crowding critical SOS controls
  const isEmergencyPage = location.pathname === '/emergency';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (isEmergencyPage) {
    return null;
  }

  const suggestedPrompts = [
    { label: 'Check my symptoms', query: 'I want to check my symptoms' },
    { label: 'Find nearby hospital', query: 'Find a nearby emergency hospital' },
    { label: 'Emergency advice', query: 'What should I do in an emergency?' },
    { label: 'Explain my prediction', query: 'How does disease prediction work?' },
  ];

  const handleSendMessage = (textToSend = inputMessage) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (textToSend === inputMessage) {
      setInputMessage('');
    }
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let matched = MOCK_BOT_RESPONSES.find(item =>
        item.keywords.some(kw => lower.includes(kw))
      );

      let botText = matched
        ? matched.response
        : "I'm here to assist with your medical questions, symptom tracking, and emergency hospital discovery. Would you like to analyze symptoms or find a local healthcare facility?";
      
      let actionLink = matched?.actionLink || null;
      let actionText = matched?.actionText || null;

      if (!matched && lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        botText = "Hello! I can guide you through symptom assessment, health profile updates, and locating emergency services.";
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        actionLink,
        actionText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mb-4">
          
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-4 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
                <Sparkles size={20} className="text-blue-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight">AURA AI Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-blue-200 font-medium">Clinical RAG Health Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Minimize Chat"
              >
                <ChevronDown size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Disclaimer Ribbon */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-amber-800 font-medium shrink-0">
            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
            <span className="truncate">AI guidance only. Not a medical diagnosis.</span>
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

                  <div className={`max-w-[80%] space-y-2`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isBot
                          ? 'bg-white text-slate-800 border border-slate-200/90 shadow-2xs rounded-tl-xs'
                          : 'bg-blue-600 text-white shadow-xs rounded-tr-xs font-medium'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Action shortcut button inside bot reply */}
                      {msg.actionLink && (
                        <button
                          onClick={() => handleNavigate(msg.actionLink)}
                          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-[11px] transition-colors cursor-pointer"
                        >
                          <span>{msg.actionText || 'Open Action'}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                    
                    <span className={`text-[10px] text-slate-400 block px-1 ${isBot ? 'text-left' : 'text-right'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                className="whitespace-nowrap text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 px-2.5 py-1 rounded-full transition-colors shrink-0 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AURA a health question..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-slate-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-xs cursor-pointer"
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-xl shadow-blue-600/30 border border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer"
        aria-label="Toggle AURA Health Assistant"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 fill-white/20 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-600" />
        </div>
        <span className="text-xs font-black tracking-wide pr-1">Ask AURA</span>

        {/* Pulse Ring */}
        <span className="absolute -inset-1 rounded-full bg-blue-400/20 animate-ping -z-10" />
      </button>

    </div>
  );
}

export default AuraChatWidget;
