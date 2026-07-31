import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Zap, Activity, BookOpen, Hash, Layers, ArrowRight } from 'lucide-react';

const GAMES = [
  {
    path: '/game/memory',
    titleKey: 'memory_match',
    desc: 'Flip cards and find pairs. Evaluates short-term recall accuracy and error frequency.',
    icon: Brain,
    accent: 'text-teal-700 border-teal-200 bg-teal-50',
  },
  {
    path: '/game/reaction',
    titleKey: 'reaction_tap',
    desc: 'Rapid target speed tapping. Measures visual processing delay and reflex velocity.',
    icon: Zap,
    accent: 'text-sky-700 border-sky-200 bg-sky-50',
  },
  {
    path: '/game/spiral',
    titleKey: 'spiral_drawing',
    desc: 'Archimedean spiral tracing. Tracks cursor deviation and kinetic tremors.',
    icon: Activity,
    accent: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  },
  {
    path: '/game/word-recall',
    titleKey: 'word_recall',
    desc: 'Memorize a set of clinical words, then recall as many as possible within a time limit.',
    icon: BookOpen,
    accent: 'text-purple-700 border-purple-200 bg-purple-50',
  },
  {
    path: '/game/number-span',
    titleKey: 'number_span',
    desc: 'Increasing digit sequences flash one by one. Repeat them to test working memory span.',
    icon: Hash,
    accent: 'text-amber-700 border-amber-200 bg-amber-50',
  },
  {
    path: '/game/dual-task',
    titleKey: 'dual_task',
    desc: 'Tap appearing circles while solving math problems. Measures divided attention and multitasking.',
    icon: Layers,
    accent: 'text-rose-700 border-rose-200 bg-rose-50',
  },
];

const GamesHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight font-display text-slate-900">{t('games_title')}</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">{t('games_desc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.path}
                className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between h-64 shadow-sm relative overflow-hidden hover:border-teal-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${game.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-900 mb-2">{t(game.titleKey)}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-normal">{game.desc}</p>
                </div>

                <button
                  onClick={() => navigate(game.path)}
                  className="w-full mt-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {t('launch_test')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GamesHub;
