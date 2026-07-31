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
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-sm text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display text-slate-900">Daily Non-Motor Assessment</h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">UPDRS Part I symptoms monitoring</p>
          </div>
        </div>

        {/* Survey list */}
        <div className="space-y-6 mb-8">
          {QUESTIONS.map((q) => {
            const Icon = q.icon;
            const score = answers[q.key];
            return (
              <div key={q.key} className="bg-white border border-slate-200 p-6 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">{q.label}</h3>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed font-medium">{q.desc}</p>
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
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>1 - None / Best</span>
                    <span>2 - Mild</span>
                    <span>3 - Moderate</span>
                    <span>4 - Marked</span>
                    <span>5 - Severe / Worst</span>
                  </div>
                </div>

                {/* Score badge */}
                <div className="absolute top-6 right-6 flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 border border-teal-200">
                  <span className="text-xs font-black text-teal-700">{score}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card and Save */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h4 className="text-sm font-bold text-slate-800 font-display">Estimated Non-Motor Score</h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Calculated dynamically based on symptom severity levels</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-4xl font-extrabold text-teal-600 font-display">{calculateNonMotorScore()}/100</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
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
