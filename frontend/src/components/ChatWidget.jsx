import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, AlertCircle, Bot, X, Maximize2, Minimize2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Local knowledge fallback base matching the FastAPI knowledge rules
const KNOWLEDGE_FALLBACK = {
  updrs: "The Unified Parkinson's Disease Rating Scale (UPDRS) is the clinical gold standard used to follow the course of Parkinson's disease. Our platform helps log metrics relating to Part I (Daily Questionnaire) and Part III (Spiral Drawing motor assessments).",
  symptoms: "Parkinson's symptoms include motor symptoms (tremors, slowness/bradykinesia, stiffness/rigidity, balance difficulty) and non-motor symptoms (sleep troubles, anxiety, depression, fatigue).",
  tremor: "Parkinsonian tremors typically occur at rest at a frequency of 4-6 Hz. Our Spiral Tracing tool measures high-frequency velocities to help detect tremor indices.",
  exercise: "Aerobic exercise, strength training, yoga, and Tai Chi are clinically shown to enhance neuroplasticity and improve balance and gait in Parkinson's.",
  medication: "Levodopa (Sinemet) increases brain dopamine. Others include Rasagiline (MAO-B inhibitor) and Dopamine Agonists. Take them exactly on schedule to avoid 'off' symptoms.",
  diet: "A fiber-rich diet and high hydration combat constipation. Remember that high-protein meals can sometimes restrict Levodopa absorption.",
  hello: "Hello! I am your ParkinsonCare AI wellness chatbot. Ask me about UPDRS, symptoms, medications, or exercise plans!",
};

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Welcome! I am your ParkinsonCare AI Wellness Assistant. I can explain your trends, answer FAQ questions, or suggest exercises. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const streamEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!user) return null;

  const handleOfflineQuery = (msgText) => {
    const text = msgText.toLowerCase();
    let reply = "";
    
    if (text.includes("updrs") || text.includes("rating")) reply = KNOWLEDGE_FALLBACK.updrs;
    else if (text.includes("symptom") || text.includes("stiff") || text.includes("bradykinesia")) reply = KNOWLEDGE_FALLBACK.symptoms;
    else if (text.includes("tremor") || text.includes("shake")) reply = KNOWLEDGE_FALLBACK.tremor;
    else if (text.includes("exercise") || text.includes("physio") || text.includes("yoga")) reply = KNOWLEDGE_FALLBACK.exercise;
    else if (text.includes("medication") || text.includes("drug") || text.includes("sinemet")) reply = KNOWLEDGE_FALLBACK.medication;
    else if (text.includes("diet") || text.includes("food") || text.includes("protein")) reply = KNOWLEDGE_FALLBACK.diet;
    else if (text.includes("hello") || text.includes("hi")) reply = KNOWLEDGE_FALLBACK.hello;
    else {
      reply = "I understand you are managing your health records. Regular finger tapping, memory match, and spiral tracing tasks help record valuable biomarkers. Let me know if you want information on symptoms, exercise, or UPDRS ratings.";
    }

    const disclaimer = "\n\n*Disclaimer: I am an AI assistant and do not provide medical diagnoses, treatment prescriptions, or clinical orders. Please consult your physician or neurologist for medical decisions.*";
    return reply + disclaimer;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      // Post to python service
      const res = await axios.post('http://127.0.0.1:8000/api/chat', {
        message: userMsg.text,
      }, { timeout: 2500 });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: res.data.response,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.warn('FastAPI chatbot service offline. Swapping to local knowledge base router.', err.message);
      
      const localReply = handleOfflineQuery(userMsg.text);
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: localReply,
            timestamp: new Date(),
          },
        ]);
      }, 600);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div 
          className={`mb-4 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 glass-card origin-bottom-right ${
            isExpanded 
              ? 'w-[450px] h-[650px] max-w-[90vw] max-h-[80vh]' 
              : 'w-[360px] h-[480px] max-w-[90vw]'
          }`}
        >
          {/* Header */}
          <div className="p-3 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyanAccent/10 rounded-lg text-cyanAccent">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white flex items-center gap-1">
                  AI Wellness Assistant
                  <span className="text-[8px] bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20 px-1 py-0.2 rounded uppercase font-semibold">Llama 3.2</span>
                </h2>
                <p className="text-[9px] text-gray-400">Online Cognitive & Wellness Guide</p>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col">
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'}`}
                >
                  {isAI ? (
                    <div className="w-7 h-7 rounded-lg bg-cyanAccent/10 border border-cyanAccent/20 flex items-center justify-center text-cyanAccent shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 font-bold text-[10px] uppercase">
                      Me
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                      isAI
                        ? 'bg-slate-900/60 border border-white/5 text-gray-200 rounded-tl-none'
                        : 'bg-gradient-to-r from-cyanAccent to-blueAccent text-slate-900 font-medium rounded-tr-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex gap-2 max-w-[85%] self-start animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-cyanAccent/10 border border-cyanAccent/20 flex items-center justify-center text-cyanAccent shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl rounded-tl-none text-[11px] text-gray-500">
                  AI Agent is thinking...
                </div>
              </div>
            )}
            <div ref={streamEndRef} />
          </div>

          {/* Disclaimer banner */}
          <div className="px-3 py-1.5 bg-yellow-500/5 border-t border-b border-yellow-500/10 flex items-center gap-1.5 text-[9px] text-yellow-400">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>AI assistant is for educational support, not professional medical care.</span>
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900/80 border-t border-white/5 flex gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about symptoms, medication, etc."
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyanAccent"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-2 bg-cyanAccent hover:bg-cyanAccent/90 disabled:opacity-50 text-slate-900 rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-md glow-cyan"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-cyanAccent to-blueAccent text-slate-900 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 glow-cyan relative group"
        title="AI Assistant Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-white" />
            {/* Pulsing indicator dot */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyanAccent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyanAccent border border-slate-900"></span>
            </span>
          </>
        )}
      </button>

    </div>
  );
};

export default ChatWidget;
