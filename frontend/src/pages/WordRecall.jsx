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
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/games')} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-sm text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display text-slate-900">Word Recall Test</h1>
            <p className="text-gray-400 text-xs mt-0.5">Memorize words, then recall as many as possible</p>
          </div>
        </div>

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <Brain className="w-16 h-16 text-teal-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 font-display">Select Difficulty</h2>
            <div className="flex justify-center gap-4">
              {DIFFICULTY_LEVELS.map((level, idx) => (
                <button
                  key={idx}
                  onClick={() => setDifficulty(idx)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                    difficulty === idx
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {level.name}
                  <p className="text-[10px] text-slate-500 mt-1">{level.wordCount} words • {level.showTimeSec}s</p>
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-teal-600 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-teal-700 transition-all shadow-md"
            >
              Start Test
            </button>
          </div>
        )}

        {/* Memorize Phase */}
        {phase === 'memorize' && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-teal-600">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-bold">Memorize these words</span>
            </div>
            <div className="text-3xl font-black text-rose-600 tabular-nums">{timeLeft}s</div>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {words.map((word, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 shadow-inner">
                  {word}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Words will be hidden when the timer reaches zero</p>
          </div>
        )}

        {/* Recall Phase */}
        {phase === 'recall' && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-rose-600">
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
                className="flex-1 bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-900 rounded-xl focus:outline-none focus:border-teal-500"
              />
              <button type="submit" className="px-4.5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-teal-700 transition-all">
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {userAnswers.map((ans, idx) => (
                <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold rounded-lg shadow-sm">
                  {ans}
                  <button onClick={() => handleRemoveWord(idx)} className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-500 font-semibold">{userAnswers.length} / {words.length} words entered</p>

            <button
              onClick={handleSubmitRecall}
              className="w-full py-3 bg-teal-600 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-teal-700 transition-all shadow-md"
            >
              Submit Recall
            </button>
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && results && (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6 text-center shadow-sm">
            <div className="text-5xl font-black text-slate-900 font-display">{results.score}</div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Memory Recall Score</p>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-bold text-emerald-700">{results.correct.length}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Correct</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-bold text-amber-700">{results.missed.length}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Missed</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-bold text-rose-700">{results.wrong.length}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Wrong</p>
              </div>
            </div>

            {results.missed.length > 0 && (
              <div className="text-left bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs shadow-inner">
                <p className="font-bold text-slate-700 mb-2 font-display">Missed Words:</p>
                <div className="flex flex-wrap gap-2">
                  {results.missed.map((w, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold shadow-sm">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button onClick={() => { setPhase('setup'); }} className="px-5 py-2.5 bg-slate-100 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer text-slate-700 hover:bg-slate-200 transition-all shadow-sm">
                Try Again
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

export default WordRecall;
