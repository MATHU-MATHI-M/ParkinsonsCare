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
  ];

  const renderNavLinks = () => {
    return navLinks.map((link) => {
      const Icon = link.icon;
      const active = isActive(link.path) || (link.matchPrefix && isActivePrefix(link.matchPrefix));
      return (
        <Link
          key={link.path}
          to={link.path}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
            active
              ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium'
          }`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-2.5 shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Top Row: Logo & Controls (and Desktop Navigation in between) */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 bg-teal-600 rounded-xl shadow-sm text-white">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display text-slate-900">
              ParkinsonCare <span className="text-teal-600 font-extrabold">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links (Middle of top row on desktop) */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {renderNavLinks()}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Voice Navigation Mic */}
            {supported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-100 hover:border-slate-300'
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
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                {i18n.language}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[140px] py-1 max-h-64 overflow-y-auto">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                        i18n.language === lang.code
                          ? 'bg-teal-50 text-teal-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
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
              <span className="text-xs font-semibold text-slate-900">{user.name}</span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                {user.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
              title={t('nav_logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Horizontally Scrollable Links on Mobile/Tablet */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto no-scrollbar py-1 border-t border-slate-100">
          {renderNavLinks()}
        </div>
      </div>

      {/* Voice transcript indicator */}
      {isListening && transcript && (
        <div className="max-w-7xl mx-auto mt-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
          🎤 Heard: "{transcript}"
        </div>
      )}
    </nav>
  );
};

export default Navbar;
