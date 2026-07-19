import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Heart, Save, AlertCircle, ArrowLeft, Moon, Smile, Zap, RefreshCw } from 'lucide-react';

const QUESTIONS = [
  { key: 'sleep', label: 'Sleep Quality & Duration', desc: 'Did you experience insomnia, fragmented sleep, or excessive daytime drowsiness?', icon: Moon },
  { key: 'mood', label: 'Mood Fluctuations', desc: 'Did you feel low, irritable, or undergo sudden emotional changes today?', icon: Smile },
  { key: 'fatigue', label: 'Physical Fatigue', desc: 'Assess your muscle fatigue, lack of physical energy, or exhaustion.', icon: Zap },
  { key: 'anxiety', label: 'Anxiety & Tension', desc: 'Rate any feelings of panic, muscle tension, or worry.', icon: AlertCircle },
  { key: 'constipation', label: 'Digestive Function (Constipation)', desc: 'Rate any bowel symptoms or discomfort today.', icon: Heart },
  { key: 'memory', label: 'Memory & Attention', desc: 'Any forgetfulness, misplacing items, or concentration lapses?', icon: RefreshCw },
];

const Questionnaire = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({
    sleep: 3,
    mood: 3,
    fatigue: 3,
    anxiety: 3,
    constipation: 3,
    memory: 3,
  });
  const [saving, setSaving] = useState(false);

  const handleSliderChange = (key, value) => {
    setAnswers({
      ...answers,
      [key]: parseInt(value),
    });
  };

  const calculateNonMotorScore = () => {
    // Each question is rated 1 (Excellent) to 5 (Severe).
    // Max sum = 6 * 5 = 30 (Worst). Min sum = 6 * 1 = 6 (Best).
    // Score range: 6 -> 100%, 30 -> 20%.
    const sum = Object.values(answers).reduce((acc, curr) => acc + curr, 0);
    const score = Math.round(100 - ((sum - 6) / 24) * 80);
    return score;
  };

  const handleSave = async () => {
    setSaving(true);
    const score = calculateNonMotorScore();
    try {
      const res = await api.post('/assessments', {
        type: 'questionnaire',
        score,
        metrics: answers,
      });

      if (res.data.success) {
        alert(`Assessment logged! Your daily Non-Motor Score is: ${score}/100.`);
        navigate('/');
      }
    } catch (err) {
      console.error('Error logging questionnaire run:', err);
      alert('Failed to log survey results. Please check your backend database connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Non-Motor Assessment</h1>
            <p className="text-gray-400 text-xs mt-1">UPDRS Part I symptoms monitoring</p>
          </div>
        </div>

        {/* Survey list */}
        <div className="space-y-6 mb-8">
          {QUESTIONS.map((q) => {
            const Icon = q.icon;
            const score = answers[q.key];
            return (
              <div key={q.key} className="glass-card p-6 rounded-2xl relative overflow-hidden">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-cyanAccent/10 border border-cyanAccent/20 rounded-xl text-cyanAccent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{q.label}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{q.desc}</p>
                  </div>
                </div>

                {/* Slider bar */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={score}
                    onChange={(e) => handleSliderChange(q.key, e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyanAccent"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>1 - None / Best</span>
                    <span>2 - Mild</span>
                    <span>3 - Moderate</span>
                    <span>4 - Marked</span>
                    <span>5 - Severe / Worst</span>
                  </div>
                </div>

                {/* Score badge */}
                <div className="absolute top-6 right-6 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900/60 border border-white/5">
                  <span className="text-xs font-bold text-cyanAccent">{score}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card and Save */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-cyanAccent/15 shadow-xl">
          <div>
            <h4 className="text-sm font-semibold text-gray-300">Estimated Non-Motor Score</h4>
            <p className="text-xs text-gray-500 mt-0.5">Calculated dynamically based on symptom severity levels</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-4xl font-extrabold text-cyanAccent text-glow-cyan">{calculateNonMotorScore()}/100</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyanAccent to-blueAccent hover:from-cyanAccent hover:to-blueAccent/80 text-slate-900 font-bold text-sm rounded-xl shadow-lg glow-cyan transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Submit Assessment'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Questionnaire;
