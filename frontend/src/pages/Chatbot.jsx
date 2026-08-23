import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  ArrowRight,
  Activity,
  Building2,
  AlertTriangle,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { MOCK_BOT_RESPONSES } from '../data/mockData';

function Chatbot() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = location.state?.initialPrompt || '';

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome-full-1',
      sender: 'bot',
      text: "Hello! I'm AURA, your 24/7 AI-assisted medical assistant. Ask me anything about symptom evaluation, preventive healthcare guides, or discovering nearby emergency services.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = (textToSend = inputMessage) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg = {
      id: `usr-full-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (textToSend === inputMessage) {
      setInputMessage('');
    }
    setIsTyping(true);

    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let matched = MOCK_BOT_RESPONSES.find(item =>
        item.keywords.some(kw => lower.includes(kw))
      );

      let botText = matched
        ? matched.response
        : "AURA is powered by clinical risk evaluation models and medical reference libraries. I can help interpret symptom patterns, guide emergency preparation, or locate 24/7 hospital care.";
      
      let actionLink = matched?.actionLink || null;
      let actionText = matched?.actionText || null;

      const botMsg = {
        id: `bot-full-${Date.now()}`,
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

  const categoryCards = [
    { title: 'Check Symptoms', desc: 'Predict disease risk using ML models', path: '/predict', icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { title: 'Find Hospitals', desc: 'Locate 24/7 ER & live ICU beds', path: '/hospitals', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { title: 'Emergency SOS', desc: 'Instant GPS ambulance dispatch', path: '/emergency', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
    { title: 'Health Profile', desc: 'Manage allergies & medications', path: '/patient/medical-information', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER */}
      <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider">
              <Sparkles size={14} className="text-purple-400" />
              <span>RAG Clinical AI Engine</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AURA AI Medical Assistant
            </h1>

            <p className="text-purple-100 text-xs sm:text-sm font-medium max-w-xl">
              Instant 24/7 medical guidance, symptom triage, condition explanations, and hospital lookup.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-purple-300 font-bold shrink-0 shadow-inner">
            <MessageSquare size={32} />
          </div>
        </div>
      </section>

      {/* QUICK CATEGORIES BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(c.path)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all text-left flex items-center gap-3.5 group cursor-pointer"
            >
              <div className={`p-2.5 rounded-xl border ${c.color} shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                  {c.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">{c.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* CHATBOT MAIN CONTAINER */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[600px] overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm">AURA Health Assistant</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">Clinical Knowledge Base Connected</p>
            </div>
          </div>

          <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert size={14} />
            <span>AI guidance — Not a medical diagnosis</span>
          </div>
        </div>

        {/* Conversation Area */}
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
                    isBot ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-700 text-white shadow-xs'
                  }`}
                >
                  {isBot ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isBot
                        ? 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
                        : 'bg-purple-600 text-white shadow-xs rounded-tr-xs font-medium'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.actionLink && (
                      <button
                        onClick={() => navigate(msg.actionLink)}
                        className="mt-3 inline-flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3.5 py-2 rounded-xl border border-purple-200 text-xs transition-colors cursor-pointer"
                      >
                        <span>{msg.actionText || 'Open Feature'}</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  <span className={`text-[10px] text-slate-400 block ${isBot ? 'text-left' : 'text-right'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your medical query here..."
            className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 bg-slate-50 font-medium"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-extrabold px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </div>

      </section>

    </div>
  );
}

export default Chatbot;
