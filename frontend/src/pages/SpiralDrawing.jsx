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
    ctx.arc(CENTER, CENTER, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d9488';
    ctx.fill();

    // Renders ideal Archimedean spiral: r = b * theta
    // Let's use b = 4.5. Up to 3.5 revolutions
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.3)';
    ctx.lineWidth = 2.5;
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
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3.5;
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
      setError('Please draw a longer trace around the spiral guide before submitting.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // Send raw trajectory points to Python FastAPI microservice
      const res = await axios.post('http://127.0.0.1:8000/api/analyze/spiral', {
        points: points.map((p) => ({ x: p.x, y: p.y, t: p.t })),
      }, { timeout: 3000 });

      if (res.data.success) {
        const data = res.data;
        setResult({
          score: data.score,
          metrics: {
            deviation: data.metrics.deviation_percentage,
            tremorIndex: data.metrics.tremor_index_hz,
            smoothness: data.metrics.smoothness_score,
          },
          source: 'FastAPI Microservice',
        });

        // Save motor assessment to Node MongoDB backend
        await api.post('/assessments/motor', {
          type: 'Spiral Drawing',
          score: data.score,
          metrics: {
            deviation: data.metrics.deviation_percentage,
            tremorIndex: data.metrics.tremor_index_hz,
            smoothness: data.metrics.smoothness_score,
          },
        });
      }
    } catch (err) {
      console.warn('FastAPI Service Offline, failing back to local client math engine.', err.message);

      // Local fallback calculation
      const localRes = calculateLocalMetrics();
      setResult({
        ...localRes,
        source: 'Local Math Engine',
      });

      // Save to database
      try {
        await api.post('/assessments/motor', {
          type: 'Spiral Drawing',
          score: localRes.score,
          metrics: localRes.metrics,
        });
      } catch (dbErr) {
        console.error('Error saving local motor assessment to DB:', dbErr);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Drawing space columns */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-sm text-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold font-display text-slate-900">Spiral Drawing Assessment</h1>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">Trace the guide from the center dot outward</p>
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-white p-3 shadow-md">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-slate-50 rounded-xl canvas-crosshair border border-slate-200"
            />
          </div>

          <div className="flex gap-4 mt-6 w-full max-w-[500px]">
            <button
              onClick={handleClear}
              className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Clear Canvas
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || points.length === 0}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {analyzing ? 'Analyzing Drawing...' : 'Submit Drawing'}
            </button>
          </div>
          {error && <p className="text-rose-600 text-xs mt-3 text-center font-medium">{error}</p>}
        </div>

        {/* Diagnostic parameters side panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl h-full flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-base font-bold font-display mb-3 text-slate-900">Digital Biomarker Metrics</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                This test tracks kinetic tremors and bradykinesia by comparing your hand velocity and deviation against an Archimedean spiral formula.
              </p>

              {!result ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 py-12 font-medium">
                  Draw and submit a tracing to view fine-motor spectral coordinates.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider">Fine Motor Score</span>
                    <p className="text-3xl font-black text-teal-700 mt-1 font-display">{result.score}/100</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Archimedean Deviation</span>
                      <span className="font-bold text-slate-900">{result.metrics.deviation}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Kinetic Tremor Index</span>
                      <span className="font-bold text-slate-900">{result.metrics.tremorIndex} Hz</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Drawing Smoothness</span>
                      <span className="font-bold text-slate-900">{result.metrics.smoothness}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-600" />
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
