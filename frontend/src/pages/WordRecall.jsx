import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, Brain, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const WORD_BANKS = [
  ['apple', 'river', 'piano', 'garden', 'sunset', 'mountain', 'violin', 'ocean'],
  ['window', 'pencil', 'candle', 'forest', 'mirror', 'blanket', 'dolphin', 'crystal'],
  ['bridge', 'feather', 'lantern', 'compass', 'marble', 'rainbow', 'anchor', 'harvest'],
  ['silver', 'valley', 'basket', 'temple', 'orchid', 'glacier', 'beacon', 'velvet'],
];

const DIFFICULTY_LEVELS = [
  { name: 'Easy', wordCount: 4, showTimeSec: 8 },
  { name: 'Medium', wordCount: 6, showTimeSec: 6 },
  { name: 'Hard', wordCount: 8, showTimeSec: 5 },
];

const WordRecall = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('setup'); // setup | memorize | recall | result
  const [difficulty, setDifficulty] = useState(1); // 0, 1, 2
  const [words, setWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const startGame = useCallback(() => {
    const level = DIFFICULTY_LEVELS[difficulty];
    const bank = WORD_BANKS[Math.floor(Math.random() * WORD_BANKS.length)];
    const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, level.wordCount);
    setWords(shuffled);
    setUserAnswers([]);
    setCurrentInput('');
    setResults(null);
    setTimeLeft(level.showTimeSec);
    setPhase('memorize');
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'memorize' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (phase === 'memorize' && timeLeft === 0) {
      setPhase('recall');
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'recall' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  const handleAddWord = (e) => {
    e.preventDefault();
    const word = currentInput.trim().toLowerCase();
    if (word && !userAnswers.includes(word)) {
      setUserAnswers([...userAnswers, word]);
      setCurrentInput('');
    }
  };

  const handleRemoveWord = (idx) => {
    setUserAnswers(userAnswers.filter((_, i) => i !== idx));
  };

  const handleSubmitRecall = async () => {
    const correctWords = words.map(w => w.toLowerCase());
    const correct = userAnswers.filter(a => correctWords.includes(a));
    const missed = correctWords.filter(w => !userAnswers.includes(w));
    const wrong = userAnswers.filter(a => !correctWords.includes(a));
    const accuracy = Math.round((correct.length / correctWords.length) * 100);
    const score = Math.max(0, Math.min(100, accuracy - (wrong.length * 5)));

    setResults({ correct, missed, wrong, accuracy, score });
    setPhase('result');

    // Save to MongoDB
    setSaving(true);
    try {
      await api.post('/assessments', {
        type: 'game',
        gameType: 'word_recall',
        score,
        accuracy,
        details: {
          difficulty: DIFFICULTY_LEVELS[difficulty].name,
          totalWords: correctWords.length,
          correctRecalls: correct.length,
          wrongRecalls: wrong.length,
          missedWords: missed
        }
      });
    } catch (err) {
      console.error('Error saving word recall:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/games')} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Word Recall Test</h1>
            <p className="text-gray-400 text-xs mt-0.5">Memorize words, then recall as many as possible</p>
          </div>
        </div>

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-6">
            <Brain className="w-16 h-16 text-emeraldAccent mx-auto" />
            <h2 className="text-lg font-bold text-white">Select Difficulty</h2>
            <div className="flex justify-center gap-4">
              {DIFFICULTY_LEVELS.map((level, idx) => (
                <button
                  key={idx}
                  onClick={() => setDifficulty(idx)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    difficulty === idx
                      ? 'bg-cyanAccent/15 border-cyanAccent text-cyanAccent'
                      : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {level.name}
                  <p className="text-[9px] text-gray-500 mt-1">{level.wordCount} words • {level.showTimeSec}s</p>
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyanAccent text-slate-900 font-bold text-sm rounded-xl cursor-pointer hover:bg-cyanAccent/90 transition-all"
            >
              Start Test
            </button>
          </div>
        )}

        {/* Memorize Phase */}
        {phase === 'memorize' && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-cyanAccent">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-bold">Memorize these words</span>
            </div>
            <div className="text-3xl font-black text-roseAccent tabular-nums">{timeLeft}s</div>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {words.map((word, idx) => (
                <div key={idx} className="p-4 bg-slate-900/60 border border-cyanAccent/20 rounded-xl text-base font-bold text-white animate-fade-in">
                  {word}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500">Words will be hidden when the timer reaches zero</p>
          </div>
        )}

        {/* Recall Phase */}
        {phase === 'recall' && (
          <div className="glass-card p-8 rounded-2xl space-y-6">
            <div className="flex items-center justify-center gap-2 text-roseAccent">
              <EyeOff className="w-5 h-5" />
              <span className="text-sm font-bold">Words are now hidden. Type what you remember!</span>
            </div>

            <form onSubmit={handleAddWord} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={e => setCurrentInput(e.target.value)}
                placeholder="Type a word and press Enter..."
                className="flex-1 bg-slate-950 border border-white/10 px-4 py-2.5 text-sm text-white rounded-xl focus:outline-none focus:border-cyanAccent/50"
              />
              <button type="submit" className="px-4 py-2.5 bg-cyanAccent text-slate-900 font-bold text-xs rounded-xl cursor-pointer">
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {userAnswers.map((ans, idx) => (
                <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-cyanAccent/10 border border-cyanAccent/20 text-cyanAccent text-xs font-bold rounded-lg">
                  {ans}
                  <button onClick={() => handleRemoveWord(idx)} className="ml-1 text-gray-400 hover:text-roseAccent cursor-pointer">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <p className="text-xs text-gray-500">{userAnswers.length} / {words.length} words entered</p>

            <button
              onClick={handleSubmitRecall}
              className="w-full py-3 bg-emeraldAccent text-slate-900 font-bold text-sm rounded-xl cursor-pointer hover:bg-emeraldAccent/90 transition-all"
            >
              Submit Recall
            </button>
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && results && (
          <div className="glass-card p-8 rounded-2xl space-y-6 text-center">
            <div className="text-5xl font-black text-white text-glow-cyan">{results.score}</div>
            <p className="text-xs text-gray-400">Memory Recall Score</p>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-2xl font-bold text-emeraldAccent">{results.correct.length}</p>
                <p className="text-[10px] text-gray-400">Correct</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-2xl font-bold text-yellow-400">{results.missed.length}</p>
                <p className="text-[10px] text-gray-400">Missed</p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-2xl font-bold text-roseAccent">{results.wrong.length}</p>
                <p className="text-[10px] text-gray-400">Wrong</p>
              </div>
            </div>

            {results.missed.length > 0 && (
              <div className="text-left bg-slate-900/60 p-4 rounded-xl text-xs">
                <p className="font-bold text-gray-300 mb-2">Missed Words:</p>
                <div className="flex flex-wrap gap-2">
                  {results.missed.map((w, i) => (
                    <span key={i} className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-bold">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button onClick={() => { setPhase('setup'); }} className="px-5 py-2.5 bg-slate-900 border border-white/10 text-xs font-bold rounded-xl cursor-pointer text-gray-200 hover:border-cyanAccent/20">
                Try Again
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

export default WordRecall;
