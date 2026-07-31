import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, Target, Brain, RotateCcw } from 'lucide-react';

const DualTask = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('setup'); // setup | playing | result
  const [score, setScore] = useState(null);
  const [saving, setSaving] = useState(false);

  // Tap task state
  const [circles, setCircles] = useState([]);
  const [tapped, setTapped] = useState(0);
  const [missed, setMissed] = useState(0);

  // Math task state
  const [mathQuestion, setMathQuestion] = useState(null);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathCorrect, setMathCorrect] = useState(0);
  const [mathWrong, setMathWrong] = useState(0);
  const [mathTotal, setMathTotal] = useState(0);

  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef(null);
  const circleTimerRef = useRef(null);
  const gameAreaRef = useRef(null);
  const mathRef = useRef(null);

  const generateMathQ = useCallback(() => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 15) + 1;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let answer;
    switch (op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '×': answer = a * b; break;
      default: answer = a + b;
    }
    return { text: `${a} ${op} ${b}`, answer };
  }, []);

  const spawnCircle = useCallback(() => {
    const id = Date.now() + Math.random();
    const size = 40 + Math.floor(Math.random() * 20);
    const x = Math.floor(Math.random() * 70) + 5;
    const y = Math.floor(Math.random() * 60) + 5;
    const lifetime = 1800 + Math.random() * 1200;

    setCircles(prev => [...prev, { id, x, y, size, born: Date.now() }]);

    // Auto-remove after lifetime (counts as miss)
    setTimeout(() => {
      setCircles(prev => {
        const still = prev.find(c => c.id === id);
        if (still) {
          setMissed(m => m + 1);
          return prev.filter(c => c.id !== id);
        }
        return prev;
      });
    }, lifetime);
  }, []);

  const startGame = useCallback(() => {
    setTapped(0);
    setMissed(0);
    setMathCorrect(0);
    setMathWrong(0);
    setMathTotal(0);
    setMathAnswer('');
    setCircles([]);
    setTimeLeft(45);
    setScore(null);
    setMathQuestion(generateMathQ());
    setPhase('playing');
  }, [generateMathQ]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      endGame();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [phase, timeLeft]);

  // Spawn circles periodically
  useEffect(() => {
    if (phase !== 'playing') return;
    spawnCircle();
    circleTimerRef.current = setInterval(() => {
      spawnCircle();
    }, 1400 + Math.random() * 800);
    return () => clearInterval(circleTimerRef.current);
  }, [phase, spawnCircle]);

  const handleTap = (id) => {
    setCircles(prev => prev.filter(c => c.id !== id));
    setTapped(t => t + 1);
  };

  const handleMathSubmit = (e) => {
    e.preventDefault();
    const ans = parseInt(mathAnswer, 10);
    setMathTotal(t => t + 1);
    if (ans === mathQuestion.answer) {
      setMathCorrect(c => c + 1);
    } else {
      setMathWrong(w => w + 1);
    }
    setMathAnswer('');
    setMathQuestion(generateMathQ());
    if (mathRef.current) mathRef.current.focus();
  };

  const endGame = useCallback(async () => {
    clearTimeout(timerRef.current);
    clearInterval(circleTimerRef.current);
    setPhase('result');

    const tapTotal = tapped + missed;
    const tapAccuracy = tapTotal > 0 ? Math.round((tapped / tapTotal) * 100) : 0;
    const mathAccuracy = mathTotal > 0 ? Math.round((mathCorrect / (mathTotal + 1)) * 100) : 0; // +1 to include current
    const finalScore = Math.min(100, Math.round(tapAccuracy * 0.5 + mathAccuracy * 0.5));

    const result = { finalScore, tapped, missed, mathCorrect, mathWrong: mathWrong, mathTotal: mathTotal, tapAccuracy, mathAccuracy };
    setScore(result);

    setSaving(true);
    try {
      await api.post('/assessments', {
        type: 'game',
        gameType: 'dual_task',
        score: finalScore,
        accuracy: Math.round((tapAccuracy + mathAccuracy) / 2),
        details: { tapped, missed, mathCorrect, mathWrong, tapAccuracy, mathAccuracy }
      });
    } catch (err) {
      console.error('Error saving dual task:', err);
    } finally {
      setSaving(false);
    }
  }, [tapped, missed, mathCorrect, mathWrong, mathTotal]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/games')} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-sm text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display text-slate-900">Dual Task Challenge</h1>
            <p className="text-gray-400 text-xs mt-0.5">Tap circles while solving math — measures divided attention</p>
          </div>
        </div>

        {/* Setup */}
        {phase === 'setup' && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="flex justify-center gap-4">
              <Target className="w-12 h-12 text-rose-600 animate-pulse" />
              <Brain className="w-12 h-12 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Divided Attention Test</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
              Circles will appear on the left — tap them before they disappear. Meanwhile, solve math problems on the right.
              You have <strong className="text-slate-900 font-bold">45 seconds</strong>. Manage both tasks simultaneously!
            </p>
            <button onClick={startGame} className="px-8 py-3 bg-teal-600 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-teal-700 transition-all shadow-md">
              Start Challenge
            </button>
          </div>
        )}

        {/* Playing */}
        {phase === 'playing' && (
          <div className="space-y-4">
            {/* Timer bar */}
            <div className="flex justify-between items-center bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
              <div className="flex gap-4 text-xs font-semibold">
                <span className="text-slate-500">Tapped: <strong className="text-emerald-700 font-bold">{tapped}</strong></span>
                <span className="text-slate-500">Missed: <strong className="text-rose-600 font-bold">{missed}</strong></span>
                <span className="text-slate-500">Math: <strong className="text-teal-700 font-bold">{mathCorrect}/{mathTotal}</strong></span>
              </div>
              <span className={`text-lg font-black tabular-nums ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-teal-600'}`}>
                {timeLeft}s
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tap Area */}
              <div
                ref={gameAreaRef}
                className="bg-white border border-slate-200 rounded-2xl relative overflow-hidden shadow-sm"
                style={{ height: '360px' }}
              >
                <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-rose-600">TAP ZONE</div>
                {circles.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleTap(c.id)}
                    className="absolute rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-md cursor-pointer hover:scale-110 transition-transform animate-pulse border-2 border-white"
                    style={{
                      left: `${c.x}%`,
                      top: `${c.y}%`,
                      width: c.size,
                      height: c.size,
                    }}
                  />
                ))}
              </div>

              {/* Math Area */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 shadow-sm" style={{ height: '360px' }}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-teal-700">MATH ZONE</div>
                {mathQuestion && (
                  <>
                    <div className="text-3xl font-black text-slate-900 font-display">{mathQuestion.text} = ?</div>
                    <form onSubmit={handleMathSubmit} className="flex gap-2">
                      <input
                        ref={mathRef}
                        type="number"
                        value={mathAnswer}
                        onChange={e => setMathAnswer(e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-200 px-4 py-2.5 text-xl text-center text-slate-900 rounded-xl focus:outline-none focus:border-teal-500 font-mono"
                        autoFocus
                      />
                      <button type="submit" className="px-4 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-teal-700 transition-all">
                        →
                      </button>
                    </form>
                  </>
                )}
                <div className="flex gap-6 text-xs font-semibold text-slate-500">
                  <span>✓ <strong className="text-emerald-700 font-bold">{mathCorrect}</strong></span>
                  <span>✗ <strong className="text-rose-600 font-bold">{mathWrong}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && score && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="text-5xl font-black text-slate-900 font-display">{score.finalScore}</div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Divided Attention Score</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-emerald-700">{score.tapped}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Circles Tapped</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-rose-700">{score.missed}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Circles Missed</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-blue-700">{score.mathCorrect}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Math Correct</p>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-teal-700">{score.tapAccuracy}%</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Tap Accuracy</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={() => setPhase('setup')} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer text-slate-700 hover:bg-slate-200 transition-all shadow-sm">
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
              <button onClick={() => navigate('/games')} className="px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-teal-700 transition-all shadow-md">
                Back to Hub
              </button>
            </div>
            {saving && <p className="text-[10px] text-teal-600 animate-pulse font-semibold">Saving to MongoDB...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DualTask;
