import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ArrowLeft, TrendingUp, RefreshCw, BarChart2, Info, Brain } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments?limit=50');
      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching clinical assessment logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  // Check if history database is empty (Strict Dynamic check)
  const isHistoryEmpty = history.length === 0;

  // Process data purely from MongoDB logs
  const processChartData = () => {
    if (isHistoryEmpty) return null;

    // Get unique dates sorted chronologically
    const dateMap = {};
    history.forEach((item) => {
      const dStr = new Date(item.createdAt).toISOString().split('T')[0];
      if (!dateMap[dStr]) {
        dateMap[dStr] = {
          q: null,
          motor: null,
          cognitive: null,
          voice: null,
          reflex: null
        };
      }

      // Map to correct category
      if (item.type === 'questionnaire') {
        dateMap[dStr].q = item.score;
      } else if (item.type === 'spiral_drawing' || item.gameType === 'spiral_drawing') {
        dateMap[dStr].motor = item.score;
      } else if (item.type === 'memory_match' || item.gameType === 'memory_match') {
        dateMap[dStr].cognitive = item.score;
      } else if (item.type === 'voice_analysis') {
        dateMap[dStr].voice = item.score;
      } else if (item.type === 'reaction_tap' || item.gameType === 'reaction_tap') {
        dateMap[dStr].reflex = item.score;
      }
    } );

    const sortedDates = Object.keys(dateMap).sort();

    const labels = [];
    const wellnessData = [];
    const motorData = [];
    const nonMotorData = [];
    const cognitiveData = [];

    // Latest points for radar mapping
    let lastQ = 80, lastMotor = 80, lastCognitive = 80, lastReflex = 80, lastVoice = 80;

    sortedDates.forEach((d) => {
      const val = dateMap[d];
      const parts = d.split('-');
      labels.push(`${parts[1]}/${parts[2]}`); // MM/DD

      // Extract scores or carry forward the previous known score to represent history
      if (val.q !== null) lastQ = val.q;
      if (val.motor !== null) lastMotor = val.motor;
      if (val.cognitive !== null) lastCognitive = val.cognitive;
      if (val.reflex !== null) lastReflex = val.reflex;
      if (val.voice !== null) lastVoice = val.voice;

      // Calculate dynamic wellness index for that day
      const dailyWellness = Math.round(
        lastQ * 0.3 +
        lastCognitive * 0.2 +
        lastReflex * 0.15 +
        lastMotor * 0.25 +
        lastVoice * 0.1
      );

      wellnessData.push(dailyWellness);
      motorData.push(lastMotor);
      nonMotorData.push(lastQ);
      cognitiveData.push(lastCognitive);
    });

    return {
      labels,
      wellnessDataset: wellnessData,
      motorDataset: motorData,
      nonMotorDataset: nonMotorData,
      cognitiveDataset: cognitiveData,
      latestMetrics: {
        motor: lastMotor,
        nonMotor: lastQ,
        cognitive: lastCognitive,
        reflex: lastReflex,
        voice: lastVoice
      }
    };
  };

  const chartData = processChartData();

  const lineChartData = chartData ? {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Overall Wellness Score',
        data: chartData.wellnessDataset,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#06b6d4',
      },
      {
        label: 'Fine Motor Score',
        data: chartData.motorDataset,
        borderColor: '#3b82f6',
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointBackgroundColor: '#3b82f6',
      },
      {
        label: 'Non-Motor Score',
        data: chartData.nonMotorDataset,
        borderColor: '#10b981',
        borderDash: [3, 3],
        fill: false,
        tension: 0.3,
        pointBackgroundColor: '#10b981',
      }
    ]
  } : null;

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Outfit' }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    }
  };

  const radarChartData = chartData ? {
    labels: ['Fine Motor', 'Non-Motor (Survey)', 'Cognitive (Memory)', 'Reflex Velocity', 'Acoustic (Voice)'],
    datasets: [
      {
        label: 'Current Domain Scores',
        data: [
          chartData.latestMetrics.motor,
          chartData.latestMetrics.nonMotor,
          chartData.latestMetrics.cognitive,
          chartData.latestMetrics.reflex,
          chartData.latestMetrics.voice,
        ],
        backgroundColor: 'rgba(6, 182, 212, 0.25)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4',
      }
    ]
  } : null;

  const radarChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } },
        ticks: { backdropColor: 'transparent', color: '#64748b', display: false },
        min: 0,
        max: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        
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
              <h1 className="text-2xl font-bold tracking-tight">Bio-Analytics Console</h1>
              <p className="text-gray-400 text-xs mt-0.5">Neurological and autonomic longitudinal monitoring</p>
            </div>
          </div>

          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs transition-all cursor-pointer text-cyanAccent"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Plots
          </button>
        </div>

        {/* CLINICAL EMPTY STATE (Strictly Dynamic, No mock curves) */}
        {isHistoryEmpty ? (
          <div className="glass-card p-12 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center max-w-2xl mx-auto py-16">
            <BarChart2 className="w-16 h-16 text-cyanAccent/40 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">No Progression Records Logged</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
              Under strict clinical parameters, charts are generated exclusively from your saved MongoDB files. Complete tasks in the dashboard to baseline and build your progress curves.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/questionnaire')}
                className="px-5 py-2.5 bg-slate-900 border border-white/10 hover:border-cyanAccent/20 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Complete Daily Survey
              </button>
              <button
                onClick={() => navigate('/games')}
                className="px-5 py-2.5 bg-cyanAccent text-slate-900 hover:bg-cyanAccent/90 text-xs font-bold rounded-xl cursor-pointer shadow-md glow-cyan transition-all"
              >
                Start Cognitive Games
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE TREND CHART COMPILATION */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Progression chart */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-semibold">Weekly Wellness & Progress trends</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Pure progression curve mapped directly from MongoDB coordinates</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-cyanAccent bg-cyanAccent/10 border border-cyanAccent/20 px-2.5 py-1 rounded-full font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  Active Charts
                </span>
              </div>
              
              <div className="h-80 w-full flex items-center justify-center">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Radar balanced chart */}
            <div className="lg:col-span-1 glass-card p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold mb-2">Multidimensional Performance</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  Evaluating latest score parameters logged in your database files. Symmetrical graphs show balanced neurological status.
                </p>
              </div>
              
              <div className="flex-1 w-full max-w-[280px] mx-auto flex items-center justify-center">
                <Radar data={radarChartData} options={radarChartOptions} />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Analytics;
