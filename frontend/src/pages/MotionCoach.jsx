import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, Dumbbell, Play, Square, Volume2, RotateCcw, CheckCircle } from 'lucide-react';

const EXERCISES = [
  { id: 'finger_open', name: 'Finger Opening', targetReps: 10, instruction: 'Open and close your fingers slowly. Keep your wrist steady.', coachTips: ['Spread your fingers wider', 'Good pace, keep going', 'Relax your wrist'] },
  { id: 'finger_close', name: 'Finger Closing', targetReps: 10, instruction: 'Make a tight fist, then release fully. Focus on controlled grip strength.', coachTips: ['Squeeze tighter', 'Excellent form', 'Slow down slightly'] },
  { id: 'arm_raise', name: 'Arm Raise', targetReps: 8, instruction: 'Raise your arms to shoulder height and lower. Keep your back straight.', coachTips: ['Raise your hand a little higher', 'Keep your back straight', 'Excellent, steady rhythm'] },
  { id: 'hand_rotation', name: 'Hand Rotation', targetReps: 10, instruction: 'Rotate your wrists in circles. Alternate clockwise and counter-clockwise.', coachTips: ['Make larger circles', 'Good speed', 'Switch direction'] },
  { id: 'shoulder_rotation', name: 'Shoulder Rotation', targetReps: 8, instruction: 'Roll your shoulders forward, then backward. Maintain posture.', coachTips: ['Bigger rotation range', 'Slow down', 'Keep your neck relaxed'] },
  { id: 'sit_to_stand', name: 'Sit To Stand', targetReps: 5, instruction: 'Stand up from seated position, then sit back down. Use armrests if needed.', coachTips: ['Push through your heels', 'Stand fully upright', 'Control the descent'] },
  { id: 'neck_rotation', name: 'Neck Rotation', targetReps: 6, instruction: 'Slowly turn your head left, center, right. Avoid jerky movements.', coachTips: ['Turn further if comfortable', 'Pause at center', 'Very smooth movement'] },
  { id: 'smile_exercise', name: 'Smile Exercise', targetReps: 8, instruction: 'Exaggerate a wide smile, then relax. Helps facial muscle control.', coachTips: ['Wider smile', 'Hold the smile longer', 'Relax fully between reps'] },
  { id: 'deep_breathing', name: 'Deep Breathing', targetReps: 6, instruction: 'Inhale deeply through nose for 4 seconds, hold 2, exhale through mouth for 6 seconds.', coachTips: ['Deeper breath', 'Hold a moment longer', 'Exhale slowly'] },
  { id: 'balance', name: 'Balance Exercise', targetReps: 4, instruction: 'Stand on one foot for 10 seconds, then switch. Hold onto something if needed.', coachTips: ['Keep your core tight', 'Focus on a fixed point', 'Excellent balance'] },
];

const MotionCoach = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('select'); // select | exercise | complete
  const [selectedEx, setSelectedEx] = useState(null);
  const [reps, setReps] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const timerRef = useRef(null);
  const repIntervalRef = useRef(null);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const startExercise = useCallback((exercise) => {
    setSelectedEx(exercise);
    setReps(0);
    setTimer(0);
    setAccuracy(0);
    setCoachMessage(exercise.instruction);
    setIsActive(false);
    setPhase('exercise');
    speak(`Starting ${exercise.name}. ${exercise.instruction}`);
  }, [speak]);

  const toggleActive = () => {
    if (isActive) {
      setIsActive(false);
      clearInterval(repIntervalRef.current);
    } else {
      setIsActive(true);
      speak('Begin the exercise now');
    }
  };

  // Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  // Simulate rep detection (in production this would use MediaPipe)
  useEffect(() => {
    if (!isActive || !selectedEx) return;
    const interval = 2000 + Math.random() * 1500;
    repIntervalRef.current = setTimeout(() => {
      setReps(r => {
        const newR = r + 1;
        // Coach feedback every few reps
        if (newR % 3 === 0 && selectedEx.coachTips.length > 0) {
          const tip = selectedEx.coachTips[Math.floor(Math.random() * selectedEx.coachTips.length)];
          setCoachMessage(tip);
          speak(tip);
        } else {
          setCoachMessage(`Rep ${newR} of ${selectedEx.targetReps} completed`);
        }

        // Check if done
        if (newR >= selectedEx.targetReps) {
          completeExercise(newR);
        }

        return newR;
      });
      // Randomize accuracy slightly each rep
      setAccuracy(a => Math.min(100, Math.max(60, a + Math.floor(Math.random() * 10) - 2)));
    }, interval);
    return () => clearTimeout(repIntervalRef.current);
  }, [isActive, reps, selectedEx]);

  const completeExercise = async (finalReps) => {
    setIsActive(false);
    clearInterval(repIntervalRef.current);
    clearInterval(timerRef.current);

    const finalAccuracy = 70 + Math.floor(Math.random() * 25);
    setAccuracy(finalAccuracy);
    const score = Math.min(100, Math.round((finalReps / selectedEx.targetReps) * 60 + finalAccuracy * 0.4));

    speak(`Great job! You completed ${finalReps} repetitions of ${selectedEx.name}.`);
    setCoachMessage(`Excellent! ${finalReps} reps completed. Score: ${score}`);
    setCompletedExercises(prev => [...prev, selectedEx.id]);
    setPhase('complete');

    setSaving(true);
    try {
      await api.post('/assessments', {
        type: 'motor',
        exerciseType: selectedEx.id,
        score,
        accuracy: finalAccuracy,
        details: {
          exerciseName: selectedEx.name,
          completedReps: finalReps,
          targetReps: selectedEx.targetReps,
          duration: timer,
          accuracy: finalAccuracy
        }
      });
    } catch (err) {
      console.error('Error saving exercise:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Exercise Coach</h1>
            <p className="text-gray-400 text-xs mt-0.5">Guided therapeutic exercises with real-time voice coaching feedback</p>
          </div>
        </div>

        {/* Exercise Selector */}
        {phase === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXERCISES.map((ex) => {
                const done = completedExercises.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => startExercise(ex)}
                    className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                      done ? 'glass-card border-emerald-500/20' : 'glass-card border-white/5 hover:border-cyanAccent/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Dumbbell className={`w-6 h-6 ${done ? 'text-emeraldAccent' : 'text-cyanAccent'}`} />
                      {done && <CheckCircle className="w-4 h-4 text-emeraldAccent" />}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{ex.name}</h3>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{ex.instruction}</p>
                    <p className="text-[9px] text-cyanAccent mt-2 font-bold">{ex.targetReps} reps target</p>
                  </button>
                );
              })}
            </div>
            {completedExercises.length > 0 && (
              <div className="glass-card p-4 rounded-xl text-center text-xs text-gray-400">
                Completed <strong className="text-emeraldAccent">{completedExercises.length}</strong> / {EXERCISES.length} exercises today
              </div>
            )}
          </div>
        )}

        {/* Active Exercise */}
        {phase === 'exercise' && selectedEx && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual tracking area */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: '400px' }}>
              <div className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest text-cyanAccent/50">MOTION TRACKING</div>

              {/* Skeletal visualization placeholder */}
              <div className="w-48 h-64 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center mb-6 relative">
                <div className="text-center">
                  <Dumbbell className={`w-12 h-12 mx-auto mb-2 ${isActive ? 'text-cyanAccent animate-bounce' : 'text-gray-600'}`} />
                  <p className="text-[10px] text-gray-500">{isActive ? 'Tracking movement...' : 'Ready to begin'}</p>
                </div>
                {/* Simulated joint markers */}
                {isActive && (
                  <>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyanAccent animate-pulse" />
                    <div className="absolute top-20 left-6 w-2.5 h-2.5 rounded-full bg-emeraldAccent animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute top-20 right-6 w-2.5 h-2.5 rounded-full bg-emeraldAccent animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <div className="absolute bottom-20 left-10 w-2 h-2 rounded-full bg-blueAccent animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-20 right-10 w-2 h-2 rounded-full bg-blueAccent animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
              </div>

              {/* Rep counter ring */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                  <circle cx="50" cy="50" r="40" className="stroke-cyanAccent transition-all duration-500"
                    strokeWidth="8" fill="transparent" strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * reps) / selectedEx.targetReps}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{reps}</span>
                  <span className="text-[9px] text-gray-400">/ {selectedEx.targetReps}</span>
                </div>
              </div>
            </div>

            {/* Controls & Coaching */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-1">{selectedEx.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{selectedEx.instruction}</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-slate-900/60 rounded-xl text-center">
                    <p className="text-xl font-bold text-cyanAccent">{reps}</p>
                    <p className="text-[9px] text-gray-400">Reps</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl text-center">
                    <p className="text-xl font-bold text-emeraldAccent">{formatTime(timer)}</p>
                    <p className="text-[9px] text-gray-400">Duration</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl text-center">
                    <p className="text-xl font-bold text-blueAccent">{accuracy}%</p>
                    <p className="text-[9px] text-gray-400">Accuracy</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={toggleActive}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-roseAccent text-white hover:bg-roseAccent/90'
                        : 'bg-cyanAccent text-slate-900 hover:bg-cyanAccent/90'
                    }`}>
                    {isActive ? <><Square className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
                  </button>
                  <button onClick={() => { setIsActive(false); setPhase('select'); }}
                    className="px-4 py-3 bg-slate-900 border border-white/10 text-xs font-bold rounded-xl cursor-pointer text-gray-300">
                    Exit
                  </button>
                </div>
              </div>

              {/* Coach speech bubble */}
              <div className="glass-card p-5 rounded-2xl border border-cyanAccent/15">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-cyanAccent" />
                  <span className="text-xs font-bold text-cyanAccent">AI Coach</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic">"{coachMessage}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Complete */}
        {phase === 'complete' && selectedEx && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-6 max-w-lg mx-auto">
            <CheckCircle className="w-16 h-16 text-emeraldAccent mx-auto" />
            <h2 className="text-xl font-bold text-white">{selectedEx.name} Complete!</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-2xl font-bold text-emeraldAccent">{reps}</p>
                <p className="text-[10px] text-gray-400">Reps</p>
              </div>
              <div className="p-3 bg-cyanAccent/10 border border-cyanAccent/20 rounded-xl">
                <p className="text-2xl font-bold text-cyanAccent">{formatTime(timer)}</p>
                <p className="text-[10px] text-gray-400">Duration</p>
              </div>
              <div className="p-3 bg-blueAccent/10 border border-blueAccent/20 rounded-xl">
                <p className="text-2xl font-bold text-blueAccent">{accuracy}%</p>
                <p className="text-[10px] text-gray-400">Accuracy</p>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setPhase('select')} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 border border-white/10 text-xs font-bold rounded-xl cursor-pointer text-gray-200">
                <RotateCcw className="w-3.5 h-3.5" /> More Exercises
              </button>
              <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-cyanAccent text-slate-900 text-xs font-bold rounded-xl cursor-pointer">
                Dashboard
              </button>
            </div>
            {saving && <p className="text-[10px] text-gray-500 animate-pulse">Saving to MongoDB...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MotionCoach;
