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
    accent: 'text-blueAccent border-blueAccent/20 bg-blueAccent/10',
  },
  {
    path: '/game/reaction',
    titleKey: 'reaction_tap',
    desc: 'Rapid target speed tapping. Measures visual processing delay and reflex velocity.',
    icon: Zap,
    accent: 'text-cyanAccent border-cyanAccent/20 bg-cyanAccent/10',
  },
  {
    path: '/game/spiral',
    titleKey: 'spiral_drawing',
    desc: 'Archimedean spiral tracing. Tracks cursor deviation and kinetic tremors.',
    icon: Activity,
    accent: 'text-emeraldAccent border-emeraldAccent/20 bg-emeraldAccent/10',
  },
  {
    path: '/game/word-recall',
    titleKey: 'word_recall',
    desc: 'Memorize a set of clinical words, then recall as many as possible within a time limit.',
    icon: BookOpen,
    accent: 'text-purple-400 border-purple-400/20 bg-purple-400/10',
  },
  {
    path: '/game/number-span',
    titleKey: 'number_span',
    desc: 'Increasing digit sequences flash one by one. Repeat them to test working memory span.',
    icon: Hash,
    accent: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
  },
  {
    path: '/game/dual-task',
    titleKey: 'dual_task',
    desc: 'Tap appearing circles while solving math problems. Measures divided attention and multitasking.',
    icon: Layers,
    accent: 'text-roseAccent border-roseAccent/20 bg-roseAccent/10',
  },
];

const GamesHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{t('games_title')}</h1>
          <p className="text-gray-400 text-xs mt-1">{t('games_desc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.path}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between h-64 border border-white/5 shadow-xl relative overflow-hidden hover:border-cyanAccent/20 transition-all"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${game.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{t(game.titleKey)}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{game.desc}</p>
                </div>

                <button
                  onClick={() => navigate(game.path)}
                  className="w-full mt-6 py-2 bg-slate-900 border border-white/10 hover:border-cyanAccent/30 hover:bg-slate-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-gray-200"
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
