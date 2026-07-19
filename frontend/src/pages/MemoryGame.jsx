import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, RefreshCw, Trophy, Clock, AlertTriangle, Eye, Brain } from 'lucide-react';

const CARD_ICONS = ['Pill', 'Brain', 'Heart', 'Shield', 'Activity', 'Smile'];

const MemoryGame = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [turns, setTurns] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);

  // Initialize and shuffle cards
  const initGame = () => {
    clearInterval(timerRef.current);
    setTime(0);
    setTurns(0);
    setMistakes(0);
    setMatchedIds([]);
    setFlippedIndices([]);
    setGameOver(false);
    setGameStarted(false);

    // Create pairs and duplicate them
    const gameDeck = [...CARD_ICONS, ...CARD_ICONS].map((icon, index) => ({
      id: index,
      icon,
      matched: false,
    }));

    // Shuffle deck
    const shuffled = gameDeck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  };

  useEffect(() => {
    initGame();
    return () => clearInterval(timerRef.current);
  }, []);

  // Timer runner
  const startTimer = () => {
    setGameStarted(true);
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const handleCardClick = (index) => {
    if (!gameStarted) {
      startTimer();
    }

    // Block clicking if two cards are already flipped, or clicking flipped/matched cards
    if (flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].id)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setTurns((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        // Match found
        setMatchedIds((prev) => [...prev, cards[firstIdx].id, cards[secondIdx].id]);
        setFlippedIndices([]);
      } else {
        // No match
        setMistakes((prev) => prev + 1);
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Check Game Over
  useEffect(() => {
    if (matchedIds.length === 12 && cards.length === 12) {
      clearInterval(timerRef.current);
      setGameOver(true);
      submitGameScore();
    }
  }, [matchedIds]);

  const calculateScore = () => {
    // Basic score calculation
    // Starts at 100, deducts 4 points per mistake, and 1 point for every 2 seconds taken
    const deduction = mistakes * 4 + Math.round(time / 2);
    return Math.max(10, 100 - deduction);
  };

  const submitGameScore = async () => {
    setSaving(true);
    const score = calculateScore();
    const accuracy = Math.round((6 / turns) * 100);

    try {
      await api.post('/assessments', {
        type: 'memory_game',
        score,
        metrics: {
          accuracy,
          timeTaken: time,
          mistakes,
          turns,
        },
      });
    } catch (err) {
      console.error('Error logging cognitive memory results:', err);
    } finally {
      setSaving(false);
    }
  };

  // Render text-based custom icons to bypass SVG file loaders
  const renderIcon = (name) => {
    const classStr = "w-6 h-6 text-cyanAccent";
    switch (name) {
      case 'Pill': return <span className="text-xl">💊</span>;
      case 'Brain': return <span className="text-xl">🧠</span>;
      case 'Heart': return <span className="text-xl">❤️</span>;
      case 'Shield': return <span className="text-xl">🛡️</span>;
      case 'Activity': return <span className="text-xl">⚡</span>;
      case 'Smile': return <span className="text-xl">😊</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Memory Match Challenge</h1>
              <p className="text-gray-400 text-xs mt-0.5">Assesses short-term cognitive retention</p>
            </div>
          </div>

          <button
            onClick={initGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs transition-all cursor-pointer text-cyanAccent"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Timer</p>
              <p className="text-lg font-bold text-white mt-1">{time}s</p>
            </div>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Mistakes</p>
              <p className="text-lg font-bold text-roseAccent mt-1">{mistakes}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-roseAccent/60" />
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Current Turns</p>
              <p className="text-lg font-bold text-cyanAccent mt-1">{turns}</p>
            </div>
            <Eye className="w-5 h-5 text-cyanAccent/60" />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {cards.map((card, idx) => {
            const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`h-24 md:h-32 rounded-xl flex items-center justify-center cursor-pointer transition-all border select-none ${
                  isFlipped
                    ? 'bg-slate-900 border-cyanAccent/50 glow-cyan shadow-md'
                    : 'bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 hover:border-cyanAccent/30'
                }`}
              >
                {isFlipped ? (
                  renderIcon(card.icon)
                ) : (
                  <Brain className="w-6 h-6 text-gray-700 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* GameOver Modal Overlay */}
        {gameOver && (
          <div className="glass-card p-8 rounded-2xl text-center border-emerald-500/25 glow-emerald">
            <Trophy className="w-16 h-16 text-emeraldAccent mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white mb-2">Assessment Completed!</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
              Cognitive match testing successfully processed. Your scores have been sent to your clinician dashboard.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6 text-left">
              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Memory Score</span>
                <p className="text-xl font-bold text-cyanAccent mt-0.5">{calculateScore()}/100</p>
              </div>
              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Time Taken</span>
                <p className="text-xl font-bold text-white mt-0.5">{time} seconds</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-cyanAccent text-slate-900 font-bold text-sm rounded-lg hover:bg-cyanAccent/90 transition-all cursor-pointer shadow-lg glow-cyan"
            >
              Return to Cockpit
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MemoryGame;
