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
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/games')} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Number Span Recall</h1>
            <p className="text-gray-400 text-xs mt-0.5">Remember and repeat increasing digit sequences</p>
          </div>
        </div>

        {/* Setup */}
        {phase === 'setup' && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-6">
            <Hash className="w-16 h-16 text-blueAccent mx-auto" />
            <h2 className="text-lg font-bold">Select Difficulty</h2>
            <div className="flex justify-center gap-4">
              {DIFFICULTY.map((lvl, idx) => (
                <button key={idx} onClick={() => setDifficulty(idx)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    difficulty === idx ? 'bg-cyanAccent/15 border-cyanAccent text-cyanAccent' : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white'
                  }`}>
                  {lvl.name}
                  <p className="text-[9px] text-gray-500 mt-1">Start: {lvl.startLen} digits</p>
                </button>
              ))}
            </div>
            <button onClick={startGame} className="px-8 py-3 bg-cyanAccent text-slate-900 font-bold text-sm rounded-xl cursor-pointer hover:bg-cyanAccent/90 transition-all">
              Start Test
            </button>
          </div>
        )}

        {/* Show Phase - flash digits */}
        {phase === 'show' && (
          <div className="glass-card p-12 rounded-2xl text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-cyanAccent">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-bold">Round {roundNum} — Watch carefully!</span>
            </div>
            <div className="h-32 flex items-center justify-center">
              {displayIdx < sequence.length ? (
                <span className="text-7xl font-black text-white animate-pulse tabular-nums" key={displayIdx}>
                  {sequence[displayIdx]}
                </span>
              ) : (
                <span className="text-lg text-gray-500">Get ready to type...</span>
              )}
            </div>
            <div className="flex justify-center gap-1">
              {sequence.map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < displayIdx ? 'bg-cyanAccent' : 'bg-slate-700'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Input Phase */}
        {phase === 'input' && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-roseAccent">
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
              className="w-full max-w-xs mx-auto bg-slate-950 border border-white/10 px-6 py-4 text-3xl text-center text-white rounded-xl focus:outline-none focus:border-cyanAccent/50 tracking-[0.5em] font-mono"
            />
            <p className="text-xs text-gray-500">{userInput.length} / {sequence.length} digits entered</p>
            <button
              onClick={handleSubmitRound}
              disabled={userInput.length !== sequence.length}
              className="px-8 py-3 bg-emeraldAccent text-slate-900 font-bold text-sm rounded-xl cursor-pointer hover:bg-emeraldAccent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && score && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-6">
            <div className="text-5xl font-black text-white text-glow-cyan">{score.finalScore}</div>
            <p className="text-xs text-gray-400">Working Memory Score</p>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-2xl font-bold text-emeraldAccent">{score.maxSpan}</p>
                <p className="text-[10px] text-gray-400">Max Span</p>
              </div>
              <div className="p-3 bg-cyanAccent/10 border border-cyanAccent/20 rounded-xl">
                <p className="text-2xl font-bold text-cyanAccent">{score.correctCount}</p>
                <p className="text-[10px] text-gray-400">Correct</p>
              </div>
              <div className="p-3 bg-blueAccent/10 border border-blueAccent/20 rounded-xl">
                <p className="text-2xl font-bold text-blueAccent">{score.totalRounds}</p>
                <p className="text-[10px] text-gray-400">Rounds</p>
              </div>
            </div>

            {/* Round History */}
            <div className="text-left bg-slate-900/60 p-4 rounded-xl space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {rounds.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5">
                  <span className="text-gray-400">Round {r.round} ({r.length} digits): <span className="font-mono text-gray-200">{r.sequence.join('')}</span></span>
                  <span className={r.correct ? 'text-emeraldAccent font-bold' : 'text-roseAccent font-bold'}>
                    {r.correct ? '✓' : `✗ (${r.entered.join('')})`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={() => setPhase('setup')} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 border border-white/10 text-xs font-bold rounded-xl cursor-pointer text-gray-200">
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
              <button onClick={() => navigate('/games')} className="px-5 py-2.5 bg-cyanAccent text-slate-900 text-xs font-bold rounded-xl cursor-pointer hover:bg-cyanAccent/90">
                Back to Hub
              </button>
            </div>
            {saving && <p className="text-[10px] text-gray-500 animate-pulse">Saving to MongoDB...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberSpan;
