import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, AlertCircle, Bot } from 'lucide-react';
import axios from 'axios';

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

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Welcome! I am your ParkinsonCare AI Health Assistant. I can explain your trends, outline Parkinson FAQs, or suggest exercises. How can I support your wellness today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const streamEndRef = useRef(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col h-[85vh] glass-card rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-950 border border-white/5 hover:border-white/20 transition-all cursor-pointer text-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyanAccent/10 rounded-lg text-cyanAccent">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                  ParkinsonCare AI Assistant
                  <span className="text-[9px] bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20 px-1.5 py-0.5 rounded uppercase font-semibold">Llama 3.2</span>
                </h1>
                <p className="text-[10px] text-gray-400">Online Cognitive & Wellness Guide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'}`}
              >
                {isAI ? (
                  <div className="w-8 h-8 rounded-lg bg-cyanAccent/10 border border-cyanAccent/20 flex items-center justify-center text-cyanAccent shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 font-bold text-xs uppercase">
                    Me
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
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
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-8 h-8 rounded-lg bg-cyanAccent/10 border border-cyanAccent/20 flex items-center justify-center text-cyanAccent shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl rounded-tl-none text-xs text-gray-500">
                AI Agent is thinking...
              </div>
            </div>
          )}
          <div ref={streamEndRef} />
        </div>

        {/* Disclaimer Warning banner */}
        <div className="px-4 py-2 bg-yellow-500/5 border-t border-b border-yellow-500/10 flex items-center gap-2 text-[10px] text-yellow-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>This AI assistant provides educational responses and should not substitute professional neurological care.</span>
        </div>

        {/* Input form */}
        <form onSubmit={handleSend} className="p-4 bg-slate-900/80 border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="E.g. Explain Parkinson UPDRS ratings..."
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyanAccent"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 bg-cyanAccent hover:bg-cyanAccent/90 disabled:opacity-50 text-slate-900 rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-md glow-cyan"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default Chatbot;
