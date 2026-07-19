import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, BarChart2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

const DOMAIN_COLORS = {
  nonMotor: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Non-Motor' },
  cognitive: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Cognitive' },
  reaction: { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', label: 'Reaction' },
  motor: { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', label: 'Motor' },
  voice: { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', label: 'Voice' },
};

const Forecast = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('7'); // '7' or '30'

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/forecast');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForecast(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  const zeroState = data?.zeroState;

  const TrendIcon = ({ trend }) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-emeraldAccent" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-roseAccent" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Build chart data
  const buildChartData = () => {
    if (!data?.data) return null;
    const forecast = view === '7' ? data.data.forecast7 : data.data.forecast30;
    const domains = Object.keys(forecast);
    if (domains.length === 0) return null;

    const labels = forecast[domains[0]].map(p => `Day ${p.day}`);
    const datasets = domains.map(d => ({
      label: DOMAIN_COLORS[d]?.label || d,
      data: forecast[d].map(p => p.predicted),
      borderColor: DOMAIN_COLORS[d]?.border || '#94a3b8',
      backgroundColor: DOMAIN_COLORS[d]?.bg || 'transparent',
      fill: true,
      tension: 0.3,
      borderWidth: 2.5,
      pointRadius: 3,
      pointBackgroundColor: DOMAIN_COLORS[d]?.border || '#94a3b8',
    }));

    return { labels, datasets };
  };

  const chartData = buildChartData();
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } } },
      tooltip: { backgroundColor: '#0f172a', titleFont: { family: 'Outfit' }, bodyFont: { family: 'Outfit' } }
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('forecast_title')}</h1>
              <p className="text-gray-400 text-xs mt-0.5">{t('forecast_desc')}</p>
            </div>
          </div>
          <button onClick={fetchForecast} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-cyanAccent cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {zeroState ? (
          <div className="glass-card p-12 rounded-2xl text-center py-16 max-w-xl mx-auto">
            <BarChart2 className="w-16 h-16 text-cyanAccent/30 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">Insufficient Data for Forecasting</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-6">{data?.message}</p>
            <button onClick={() => navigate('/games')} className="px-5 py-2.5 bg-cyanAccent text-slate-900 text-xs font-bold rounded-xl cursor-pointer">
              Complete Assessments
            </button>
          </div>
        ) : data?.data && (
          <div className="space-y-8">
            {/* Risk & Confidence Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Risk Score</p>
                <p className={`text-4xl font-black ${data.data.riskScore > 60 ? 'text-roseAccent' : data.data.riskScore > 30 ? 'text-yellow-400' : 'text-emeraldAccent'}`}>
                  {data.data.riskScore}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">/ 100</p>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Improvement Probability</p>
                <p className="text-4xl font-black text-cyanAccent">{data.data.improvementProbability}%</p>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Data Points</p>
                <p className="text-4xl font-black text-blueAccent">{data.data.totalDataPoints}</p>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Domains Analyzed</p>
                <p className="text-4xl font-black text-emeraldAccent">{data.data.domainsAnalyzed.length}</p>
              </div>
            </div>

            {/* Trend indicators */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2">Domain Trend Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(data.data.trends).map(([domain, trend]) => (
                  <div key={domain} className="p-3 bg-slate-900/60 rounded-xl flex items-center gap-3">
                    <TrendIcon trend={trend} />
                    <div>
                      <p className="text-xs font-bold text-white capitalize">{DOMAIN_COLORS[domain]?.label || domain}</p>
                      <p className={`text-[10px] font-bold capitalize ${
                        trend === 'improving' ? 'text-emeraldAccent' : trend === 'declining' ? 'text-roseAccent' : 'text-gray-400'
                      }`}>
                        {trend}
                      </p>
                      <p className="text-[9px] text-gray-500">Confidence: {data.data.confidence[domain]}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-white">Predicted Progression</h3>
                <div className="flex gap-2">
                  <button onClick={() => setView('7')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      view === '7' ? 'bg-cyanAccent/15 text-cyanAccent border border-cyanAccent/20' : 'bg-slate-900 text-gray-400 border border-white/10'
                    }`}>
                    7-Day
                  </button>
                  <button onClick={() => setView('30')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      view === '30' ? 'bg-cyanAccent/15 text-cyanAccent border border-cyanAccent/20' : 'bg-slate-900 text-gray-400 border border-white/10'
                    }`}>
                    30-Day
                  </button>
                </div>
              </div>
              {chartData ? (
                <div className="h-80">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-12">No forecast data available for this view.</p>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/15 p-4 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <strong className="text-yellow-400">Clinical Disclaimer:</strong> These forecasts are statistical projections from linear regression models and do not constitute medical diagnoses. Always consult your treating physician for clinical decisions. Prediction confidence increases with more assessment data points.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forecast;
