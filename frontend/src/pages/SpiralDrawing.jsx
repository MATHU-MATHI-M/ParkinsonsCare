import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, RefreshCw, Check, ShieldAlert, Cpu } from 'lucide-react';
import axios from 'axios';

const SpiralDrawing = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const CANVAS_SIZE = 500;
  const CENTER = CANVAS_SIZE / 2;

  // Render spiral guide on the background
  const drawSpiralGuide = (ctx) => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();

    // Renders ideal Archimedean spiral: r = b * theta
    // Let's use b = 4.5. Up to 3.5 revolutions
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]); // Dashed guide

    const b = 4.5;
    for (let theta = 0; theta < 7 * Math.PI; theta += 0.05) {
      const r = b * theta;
      const x = CENTER + r * Math.cos(theta);
      const y = CENTER + r * Math.sin(theta);
      
      if (theta === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset line style
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    contextRef.current = ctx;

    drawSpiralGuide(ctx);
  }, []);

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    
    const newPoint = { x, y, t: performance.now() };
    setPoints([newPoint]);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();

    const newPoint = { x, y, t: performance.now() };
    setPoints((prev) => [...prev, newPoint]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    drawSpiralGuide(contextRef.current);
    setPoints([]);
    setResult(null);
    setError('');
  };

  // Perform JS client-side math if FastAPI server is unavailable
  const calculateLocalMetrics = () => {
    if (points.length < 10) {
      return { score: 70, metrics: { deviation: 15.2, tremorIndex: 1.8, smoothness: 72.0 } };
    }

    // Translate coordinates relative to center (250, 250)
    let totalDev = 0;
    const b = 4.5;
    let prevTheta = 0;
    let revs = 0;
    let speeds = [];

    const processedPoints = points.map((p, idx) => {
      const dx = p.x - CENTER;
      const dy = p.y - CENTER;
      const r = Math.sqrt(dx * dx + dy * dy);
      
      let theta = Math.atan2(dy, dx);
      if (theta < 0) theta += 2 * Math.PI;

      // Handle unrolling of angles
      if (idx > 0) {
        const diff = theta - prevTheta;
        if (diff < -Math.PI) revs += 1;
        else if (diff > Math.PI) revs -= 1;
      }
      prevTheta = theta;
      const unwrappedTheta = theta + revs * 2 * Math.PI;

      // Ideal r at this theta
      const rExpected = b * unwrappedTheta;
      const dev = Math.abs(r - rExpected);
      totalDev += dev;

      // Calculate speed
      if (idx > 0) {
        const prev = points[idx - 1];
        const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
        const dt = (p.t - prev.t) / 1000.0;
        speeds.push(dist / (dt || 0.001));
      }

      return { r, unwrappedTheta, dev };
    });

    const meanDev = totalDev / points.length;
    // Scale deviation to percentage
    const deviationPercent = Math.min(50, (meanDev / 100) * 100);

    // Speed standard deviation acts as tremor index
    let speedVar = 30;
    if (speeds.length > 1) {
      const meanSpeed = speeds.reduce((s, a) => s + a, 0) / speeds.length;
      const variance = speeds.reduce((sq, a) => sq + Math.pow(a - meanSpeed, 2), 0) / speeds.length;
      speedVar = Math.sqrt(variance);
    }
    const tremorIndex = Math.min(10.0, Math.max(0.5, speedVar / 150));
    const smoothness = Math.max(10, Math.min(100, 100 - speedVar / 8));

    // Overall motor score
    const score = Math.max(10, Math.round(100 - deviationPercent - tremorIndex * 5.5));

    return {
      score,
      metrics: {
        deviation: Math.round(deviationPercent * 10) / 10,
        tremorIndex: Math.round(tremorIndex * 10) / 10,
        smoothness: Math.round(smoothness * 10) / 10,
      }
    };
  };

  const handleAnalyze = async () => {
    if (points.length < 15) {
      setError('Please draw a continuous tracing along the spiral guide first.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // 1. Post to FastAPI AI Service
      const res = await axios.post('http://127.0.0.1:8000/api/analyze/spiral', {
        points: points,
        center_x: CENTER,
        center_y: CENTER,
      }, { timeout: 3000 }); // Short timeout to fallback quickly

      if (res.data.success) {
        // Save to Express Backend
        await api.post('/assessments', {
          type: 'spiral_drawing',
          score: res.data.score,
          metrics: res.data.metrics,
        });

        setResult({
          score: res.data.score,
          metrics: res.data.metrics,
          source: 'Python AI Service'
        });
      }
    } catch (err) {
      console.warn('FastAPI offline or failed. Falling back to local JS motor calculations.', err.message);
      
      // Fallback calculations
      const fallback = calculateLocalMetrics();

      try {
        await api.post('/assessments', {
          type: 'spiral_drawing',
          score: fallback.score,
          metrics: fallback.metrics,
        });

        setResult({
          score: fallback.score,
          metrics: fallback.metrics,
          source: 'Client-Side Regression (Offline Fallback)'
        });
      } catch (dbErr) {
        setError('Failed to write assessment scores to Node.js backend. Verify API service.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Drawing space columns */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Spiral Drawing Assessment</h1>
                <p className="text-gray-400 text-xs mt-0.5">Trace the guide from the center dot outward</p>
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-slate-950/70 p-2 shadow-2xl">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-slate-950 rounded-xl canvas-crosshair"
            />
          </div>

          <div className="flex gap-4 mt-6 w-full max-w-[500px]">
            <button
              onClick={handleClear}
              className="flex-1 py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Canvas
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || points.length === 0}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyanAccent to-blueAccent hover:from-cyanAccent hover:to-blueAccent/80 text-slate-900 font-bold text-sm rounded-xl shadow-lg glow-cyan transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {analyzing ? 'Analyzing Drawing...' : 'Submit Drawing'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
        </div>

        {/* Diagnostic parameters side panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold mb-4 text-white">Digital Biomarker Metrics</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                This test tracks kinetic tremors and bradykinesia by comparing your hand velocity and deviation against an Archimedean spiral formula.
              </p>

              {!result ? (
                <div className="p-4 border border-dashed border-white/10 rounded-xl text-center text-xs text-gray-500 py-12">
                  Draw and submit a tracing to view fine-motor spectral coordinates.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fine Motor Score</span>
                    <p className="text-3xl font-black text-cyanAccent mt-1 text-glow-cyan">{result.score}/100</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                      <span className="text-gray-400">Archimedean Deviation</span>
                      <span className="font-bold text-white">{result.metrics.deviation}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                      <span className="text-gray-400">Kinetic Tremor Index</span>
                      <span className="font-bold text-white">{result.metrics.tremorIndex} Hz</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                      <span className="text-gray-400">Drawing Smoothness</span>
                      <span className="font-bold text-white">{result.metrics.smoothness}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyanAccent" />
                <span>Processed via {result.source}</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default SpiralDrawing;
