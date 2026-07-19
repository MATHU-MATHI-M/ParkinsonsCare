import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import useVoiceNavigation from '../hooks/useVoiceNavigation';
import {
  Activity, Brain, LogOut, BarChart2, MessageSquare, ShieldCheck,
  Heart, Pill, Clock, TrendingUp, Dumbbell, Mic, MicOff, Globe,
  ChevronDown, Menu, X
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isListening, supported, startListening, stopListening, transcript } = useVoiceNavigation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;
  const isActivePrefix = (prefix) => location.pathname.startsWith(prefix);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  const navLinks = [
    { path: '/', label: t('nav_dashboard'), icon: Activity },
    { path: '/questionnaire', label: t('nav_survey'), icon: Heart },
    { path: '/games', label: t('nav_cognitive'), icon: Brain, matchPrefix: '/game' },
    { path: '/medications', label: t('nav_medications'), icon: Pill },
    { path: '/analytics', label: t('nav_analytics'), icon: BarChart2 },
    { path: '/forecast', label: t('nav_forecast'), icon: TrendingUp },
    { path: '/timeline', label: t('nav_timeline'), icon: Clock },
    { path: '/motion-coach', label: t('nav_motion'), icon: Dumbbell },
    { path: '/chatbot', label: t('nav_assistant'), icon: MessageSquare },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 px-4 md:px-6 py-3 shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="p-2 bg-gradient-to-tr from-cyanAccent to-blueAccent rounded-lg glow-cyan text-slate-900">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hidden sm:inline">
            ParkinsonCare <span className="text-cyanAccent font-extrabold">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path) || (link.matchPrefix && isActivePrefix(link.matchPrefix));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-cyanAccent/10 text-cyanAccent border border-cyanAccent/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">

          {/* Voice Navigation Mic */}
          {supported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isListening
                  ? 'bg-roseAccent/20 border-roseAccent/40 text-roseAccent animate-pulse'
                  : 'bg-slate-900/60 border-white/10 text-gray-400 hover:text-cyanAccent hover:border-cyanAccent/20'
              }`}
              title={isListening ? 'Listening...' : 'Voice Navigation'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/60 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider"
            >
              <Globe className="w-3.5 h-3.5" />
              {i18n.language}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 min-w-[140px] py-1 max-h-64 overflow-y-auto custom-scrollbar">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                      i18n.language === lang.code
                        ? 'bg-cyanAccent/10 text-cyanAccent font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-white">{user.name}</span>
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-cyanAccent bg-cyanAccent/10 px-1.5 py-0.5 rounded border border-cyanAccent/20">
              <ShieldCheck className="w-2.5 h-2.5" />
              {user.role}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center justify-center p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
            title={t('nav_logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Voice transcript indicator */}
      {isListening && transcript && (
        <div className="max-w-7xl mx-auto mt-2 px-3 py-1.5 bg-cyanAccent/10 border border-cyanAccent/20 rounded-lg text-xs text-cyanAccent">
          🎤 Heard: "{transcript}"
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 border-t border-white/10 pt-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path) || (link.matchPrefix && isActivePrefix(link.matchPrefix));
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-cyanAccent/10 text-cyanAccent'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
