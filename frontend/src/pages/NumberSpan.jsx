import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, Hash, Eye, EyeOff, RotateCcw } from 'lucide-react';

const DIFFICULTY = [
  { name: 'Easy', startLen: 3, maxLen: 6, showMs: 1200 },
  { name: 'Medium', startLen: 4, maxLen: 8, showMs: 900 },
  { name: 'Hard', startLen: 5, maxLen: 10, showMs: 700 },
];

const NumberSpan = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('setup'); // setup | show | input | result
  const [difficulty, setDifficulty] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [currentLen, setCurrentLen] = useState(3);
  const [displayIdx, setDisplayIdx] = useState(-1);
  const [userInput, setUserInput] = useState('');
  const [rounds, setRounds] = useState([]);
  const [roundNum, setRoundNum] = useState(0);
  const [score, setScore] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const generateSequence = useCallback((len) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
  }, []);

  const startGame = useCallback(() => {
    const level = DIFFICULTY[difficulty];
    const len = level.startLen;
    const seq = generateSequence(len);
    setCurrentLen(len);
    setSequence(seq);
    setRounds([]);
    setRoundNum(1);
    setScore(null);
    setDisplayIdx(0);
    setPhase('show');
  }, [difficulty, generateSequence]);

  // Flash digits one by one
  useEffect(() => {
    if (phase !== 'show') return;
    if (displayIdx >= sequence.length) {
      // Done showing, go to input
      timerRef.current = setTimeout(() => {
        setPhase('input');
        setUserInput('');
      }, 400);
      return;
    }
    timerRef.current = setTimeout(() => {
      setDisplayIdx(i => i + 1);
    }, DIFFICULTY[difficulty].showMs);

    return () => clearTimeout(timerRef.current);
  }, [phase, displayIdx, sequence.length, difficulty]);

  useEffect(() => {
    if (phase === 'input' && inputRef.current) inputRef.current.focus();
  }, [phase]);

  const handleSubmitRound = useCallback(async () => {
    const entered = userInput.split('').map(Number);
    const correct = entered.length === sequence.length && entered.every((d, i) => d === sequence[i]);

    const newRounds = [...rounds, { round: roundNum, length: currentLen, correct, sequence: [...sequence], entered }];
    setRounds(newRounds);

    if (correct && currentLen < DIFFICULTY[difficulty].maxLen) {
      // Next round: increase length
      const newLen = currentLen + 1;
      const newSeq = generateSequence(newLen);
      setCurrentLen(newLen);
      setSequence(newSeq);
      setRoundNum(r => r + 1);
      setDisplayIdx(0);
      setPhase('show');
    } else {
      // Game over
      const correctCount = newRounds.filter(r => r.correct).length;
      const maxSpan = Math.max(...newRounds.filter(r => r.correct).map(r => r.length), 0);
      const finalScore = Math.min(100, Math.round((maxSpan / DIFFICULTY[difficulty].maxLen) * 80 + (correctCount / newRounds.length) * 20));

      setScore({ finalScore, correctCount, totalRounds: newRounds.length, maxSpan });
      setPhase('result');

      setSaving(true);
      try {
        await api.post('/assessments', {
          type: 'game',
          gameType: 'number_span',
          score: finalScore,
          accuracy: Math.round((correctCount / newRounds.length) * 100),
          details: { difficulty: DIFFICULTY[difficulty].name, maxSpan, rounds: newRounds.length }
        });
      } catch (err) {
        console.error('Error saving number span result:', err);
      } finally {
        setSaving(false);
      }
    }
  }, [userInput, sequence, rounds, roundNum, currentLen, difficulty, generateSequence]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/games')} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-sm text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display text-slate-900">Number Span Recall</h1>
            <p className="text-gray-400 text-xs mt-0.5">Remember and repeat increasing digit sequences</p>
          </div>
        </div>

        {/* Setup */}
        {phase === 'setup' && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <Hash className="w-16 h-16 text-teal-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 font-display">Select Difficulty</h2>
            <div className="flex justify-center gap-4">
              {DIFFICULTY.map((lvl, idx) => (
                <button key={idx} onClick={() => setDifficulty(idx)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                    difficulty === idx ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {lvl.name}
                  <p className="text-[10px] text-slate-500 mt-1">Start: {lvl.startLen} digits</p>
                </button>
              ))}
            </div>
            <button onClick={startGame} className="px-8 py-3 bg-teal-600 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-teal-700 transition-all shadow-md">
              Start Test
            </button>
          </div>
        )}

        {/* Show Phase - flash digits */}
        {phase === 'show' && (
          <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-teal-600">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-bold">Round {roundNum} — Watch carefully!</span>
            </div>
            <div className="h-32 flex items-center justify-center">
              {displayIdx < sequence.length ? (
                <span className="text-7xl font-black text-slate-900 animate-pulse tabular-nums" key={displayIdx}>
                  {sequence[displayIdx]}
                </span>
              ) : (
                <span className="text-lg text-slate-400 font-medium">Get ready to type...</span>
              )}
            </div>
            <div className="flex justify-center gap-1.5">
              {sequence.map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < displayIdx ? 'bg-teal-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Input Phase */}
        {phase === 'input' && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-rose-600">
              <EyeOff className="w-5 h-5" />
              <span className="text-sm font-bold">Type the {sequence.length}-digit sequence</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => { const v = e.target.value.replace(/\D/g, ''); setUserInput(v); }}
              maxLength={sequence.length}
              placeholder={'_ '.repeat(sequence.length)}
              className="w-full max-w-xs mx-auto bg-slate-50 border border-slate-200 px-6 py-4 text-3xl text-center text-slate-900 rounded-xl focus:outline-none focus:border-teal-500 tracking-[0.5em] font-mono"
            />
            <p className="text-xs text-slate-500 font-semibold">{userInput.length} / {sequence.length} digits entered</p>
            <button
              onClick={handleSubmitRound}
              disabled={userInput.length !== sequence.length}
              className="px-8 py-3 bg-teal-600 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-teal-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              Submit
            </button>
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && score && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="text-5xl font-black text-slate-900 font-display">{score.finalScore}</div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Working Memory Score</p>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-emerald-700">{score.maxSpan}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Max Span</p>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-teal-700">{score.correctCount}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Correct</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                <p className="text-2xl font-bold text-blue-700">{score.totalRounds}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Rounds</p>
              </div>
            </div>

            {/* Round History */}
            <div className="text-left bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
              {rounds.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-200 pb-1.5 font-medium">
                  <span className="text-slate-500">Round {r.round} ({r.length} digits): <span className="font-mono text-slate-800 font-bold">{r.sequence.join('')}</span></span>
                  <span className={r.correct ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {r.correct ? '✓' : `✗ (${r.entered.join('')})`}
                  </span>
                </div>
              ))}
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

export default NumberSpan;
