import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, RefreshCw, ClipboardList, Brain, Activity, Mic,
  Phone, Pill, Clock
} from 'lucide-react';

const ICON_MAP = {
  clipboard: ClipboardList,
  brain: Brain,
  activity: Activity,
  mic: Mic,
  phone: Phone,
  pill: Pill,
};

const COLOR_MAP = {
  questionnaire: 'text-emeraldAccent bg-emerald-500/10 border-emerald-500/20',
  game: 'text-blueAccent bg-blue-500/10 border-blue-500/20',
  motor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  voice: 'text-roseAccent bg-red-500/10 border-red-500/20',
  medication_call: 'text-cyanAccent bg-cyan-500/10 border-cyan-500/20',
  medication_taken: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

const Timeline = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/timeline');
      if (res.data.success) {
        setEvents(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimeline(); }, []);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  // Group by date
  const grouped = {};
  filtered.forEach(event => {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(event);
  });

  const filterOptions = [
    { key: 'all', label: 'All Events' },
    { key: 'questionnaire', label: 'Surveys' },
    { key: 'game', label: 'Games' },
    { key: 'motor', label: 'Motor' },
    { key: 'voice', label: 'Voice' },
    { key: 'medication_call', label: 'Calls' },
    { key: 'medication_taken', label: 'Medications' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('timeline_title')}</h1>
              <p className="text-gray-400 text-xs mt-0.5">{t('timeline_desc')}</p>
            </div>
          </div>
          <button onClick={fetchTimeline} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-cyanAccent cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterOptions.map(opt => (
            <button key={opt.key} onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                filter === opt.key
                  ? 'bg-cyanAccent/15 text-cyanAccent border-cyanAccent/20'
                  : 'bg-slate-900 text-gray-400 border-white/10 hover:text-white'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {events.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center py-16">
            <Clock className="w-16 h-16 text-cyanAccent/30 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">No Timeline Events</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">Complete assessments, take medications, and interact with the platform to build your clinical timeline.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <p className="text-xs text-gray-400">No events matching the selected filter.</p>
          </div>
        ) : (
          /* Timeline */
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

            {Object.entries(grouped).map(([dateStr, dayEvents]) => (
              <div key={dateStr} className="mb-8">
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-cyanAccent uppercase">{dateStr.split(',')[0]}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-300">{dateStr}</span>
                </div>

                {/* Events for this day */}
                <div className="ml-14 space-y-3">
                  {dayEvents.map((event, idx) => {
                    const IconComp = ICON_MAP[event.icon] || ClipboardList;
                    const colorClass = COLOR_MAP[event.type] || 'text-gray-400 bg-slate-800 border-white/10';

                    return (
                      <div key={idx} className="glass-card p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-start gap-3">
                        <div className={`p-2 rounded-lg border shrink-0 ${colorClass}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-white">{event.title}</h4>
                            <span className="text-[9px] text-gray-500 font-mono shrink-0 ml-2">
                              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {event.score !== undefined && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Score: <strong className="text-cyanAccent">{event.score}/100</strong>
                            </p>
                          )}
                          {event.meta && (
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {event.meta.accuracy !== undefined && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-gray-400">Accuracy: {event.meta.accuracy}%</span>
                              )}
                              {event.meta.time !== undefined && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-gray-400">Time: {event.meta.time}s</span>
                              )}
                              {event.meta.status && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                  event.meta.status === 'Answered' ? 'bg-emerald-500/10 text-emeraldAccent' : 'bg-red-500/10 text-roseAccent'
                                }`}>{event.meta.status}</span>
                              )}
                              {event.meta.duration !== undefined && event.meta.duration > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-gray-400">{event.meta.duration}s call</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
