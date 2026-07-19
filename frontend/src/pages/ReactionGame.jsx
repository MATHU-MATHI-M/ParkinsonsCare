import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, Play, Award, Zap, Crosshair } from 'lucide-react';

const TOTAL_TARGETS = 15;

const ReactionGame = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef(null);
  const spawnTimeRef = useRef(null);

  const startGame = () => {
    setIsPlaying(true);
    setTargetIndex(0);
    setReactionTimes([]);
    setHits(0);
    setMisses(0);
    setGameOver(false);
    spawnTarget();
  };

  const spawnTarget = () => {
    if (targetIndex >= TOTAL_TARGETS) {
      endGame();
      return;
    }

    if (containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      // Keep target 40px away from the edges
      const targetSize = 50;
      const x = Math.random() * (container.width - targetSize - 40) + 20;
      const y = Math.random() * (container.height - targetSize - 40) + 20;
      
      setTargetPos({
        top: `${y}px`,
        left: `${x}px`
      });
      setTargetIndex((prev) => prev + 1);
      spawnTimeRef.current = performance.now();
    }
  };

  const handleTargetClick = (e) => {
    e.stopPropagation(); // Avoid triggering container click (which is a miss)
    if (!isPlaying) return;

    const hitTime = performance.now();
    const rt = hitTime - spawnTimeRef.current;
    setReactionTimes((prev) => [...prev, rt]);
    setHits((prev) => prev + 1);
    spawnTarget();
  };

  const handleContainerClick = () => {
    if (!isPlaying) return;
    setMisses((prev) => prev + 1);
    spawnTarget();
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    submitScores();
  };

  const getAverageReactionTime = () => {
    if (reactionTimes.length === 0) return 0;
    const sum = reactionTimes.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / reactionTimes.length);
  };

  const calculateScore = () => {
    const avgRt = getAverageReactionTime();
    if (avgRt === 0) return 0;
    
    // Excellent average reaction is 250ms or lower
    // Sluggish/rigidity reaction is 750ms or higher
    // Formula: Score decreases as reaction time increases
    // Penalty for misses
    const rtPenalty = Math.max(0, (avgRt - 250) / 6);
    const missPenalty = misses * 5;
    const rawScore = 100 - rtPenalty - missPenalty;
    return Math.max(10, Math.round(rawScore));
  };

  const submitScores = async () => {
    setSaving(true);
    const score = calculateScore();
    const avgRt = getAverageReactionTime();

    try {
      await api.post('/assessments', {
        type: 'reaction_game',
        score,
        metrics: {
          reactionTime: avgRt,
          hits,
          misses,
          accuracy: Math.round((hits / TOTAL_TARGETS) * 100),
        },
      });
    } catch (err) {
      console.error('Error logging reflex test results:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col h-[85vh]">
        
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Reaction Tap Challenge</h1>
              <p className="text-gray-400 text-xs mt-0.5">Measures motor responsiveness and reflexes</p>
            </div>
          </div>

          {isPlaying && (
            <div className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              Target: <span className="font-bold text-cyanAccent">{targetIndex}</span> / {TOTAL_TARGETS}
            </div>
          )}
        </div>

        {/* Game Canvas Area */}
        <div className="flex-1 w-full bg-slate-950 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center">
          
          {!isPlaying && !gameOver && (
            <div className="text-center p-8 max-w-sm">
              <Zap className="w-12 h-12 text-cyanAccent mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold mb-2">Test Your Reflexes</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Fast-spawning cyan target rings will appear on screen. Click them as quickly as possible. Clicking blank areas counts as a miss.
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-cyanAccent text-slate-900 font-bold text-sm rounded-lg hover:bg-cyanAccent/90 transition-all cursor-pointer shadow-lg glow-cyan flex items-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4 fill-slate-900" />
                Begin Assessment
              </button>
            </div>
          )}

          {/* Target spawn space */}
          {isPlaying && (
            <div
              ref={containerRef}
              onClick={handleContainerClick}
              className="absolute inset-0 w-full h-full cursor-crosshair"
            >
              <button
                onClick={handleTargetClick}
                style={{
                  position: 'absolute',
                  top: targetPos.top,
                  left: targetPos.left,
                }}
                className="w-12 h-12 rounded-full border-2 border-cyanAccent bg-cyanAccent/30 glow-cyan flex items-center justify-center transition-all scale-100 hover:scale-95 cursor-pointer animate-ping-once"
              >
                <Crosshair className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Game Over Report */}
          {gameOver && (
            <div className="text-center p-8 max-w-md">
              <Award className="w-16 h-16 text-emeraldAccent mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2">Reflexes Logged!</h2>
              <p className="text-xs text-gray-400 mb-6">
                Clinical test parameters processed. Results have been cataloged in your medical database.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6 text-left">
                <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Reflex Score</span>
                  <p className="text-lg font-bold text-cyanAccent mt-0.5">{calculateScore()}/100</p>
                </div>
                <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Avg Speed</span>
                  <p className="text-lg font-bold text-white mt-0.5">{getAverageReactionTime()}ms</p>
                </div>
                <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Accur. Hits</span>
                  <p className="text-lg font-bold text-emeraldAccent mt-0.5">{hits}/{TOTAL_TARGETS}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-white/10 rounded-lg cursor-pointer transition-all"
                >
                  Retry Test
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2 bg-cyanAccent text-slate-900 font-bold text-xs rounded-lg hover:bg-cyanAccent/90 transition-all cursor-pointer shadow-md glow-cyan"
                >
                  Back to Cockpit
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ReactionGame;
