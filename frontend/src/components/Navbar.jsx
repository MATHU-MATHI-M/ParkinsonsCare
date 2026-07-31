import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import useVoiceNavigation from '../hooks/useVoiceNavigation';
import {
  Activity, Brain, LogOut, BarChart2, ShieldCheck,
  Heart, Pill, Clock, TrendingUp, Dumbbell, Mic, MicOff, Globe,
  ChevronDown, Grid
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
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;
  const isActivePrefix = (prefix) => location.pathname.startsWith(prefix);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  const coreLinks = [
    { path: '/', label: t('nav_dashboard'), icon: Activity },
    { path: '/questionnaire', label: t('nav_survey'), icon: Heart },
    { path: '/medications', label: t('nav_medications'), icon: Pill },
  ];

  const toolLinks = [
    { path: '/games', label: t('nav_cognitive'), icon: Brain, matchPrefix: '/game' },
    { path: '/motion-coach', label: t('nav_motion'), icon: Dumbbell },
    { path: '/analytics', label: t('nav_analytics'), icon: BarChart2 },
    { path: '/forecast', label: t('nav_forecast'), icon: TrendingUp },
    { path: '/timeline', label: t('nav_timeline'), icon: Clock },
  ];

  const allLinks = [...coreLinks, ...toolLinks];

  const isToolActive = () => {
    return toolLinks.some(link => isActive(link.path) || (link.matchPrefix && isActivePrefix(link.matchPrefix)));
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 shadow-sm border-b border-slate-200 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="p-2.5 bg-teal-600 rounded-xl shadow-sm text-white transition-transform hover:scale-105">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display text-slate-900">
              ParkinsonCare <span className="text-teal-600 font-extrabold">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5 py-0.5">
            {coreLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap font-semibold ${
                    active
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-semibold'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Grouped Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap font-semibold cursor-pointer ${
                  isToolActive()
                    ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-semibold'
                }`}
              >
                <Grid className="w-4 h-4 text-teal-600" />
                <span>Assessments & Insights</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showToolsDropdown && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden transform origin-top-left transition-all">
                  {toolLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path) || (link.matchPrefix && isActivePrefix(link.matchPrefix));
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setShowToolsDropdown(false)}
                        className={`flex items-center gap-3 px-4.5 py-3 text-xs transition-colors font-semibold ${
                          active
                            ? 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-teal-600" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Voice Navigation Mic */}
            {supported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
                title={isListening ? 'Listening...' : 'Voice Navigation'}
              >
                {isListening ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
              </button>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider shadow-sm"
              >
                <Globe className="w-4 h-4 text-teal-600" />
                {i18n.language}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 min-w-[140px] py-1.5 max-h-64 overflow-y-auto">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer ${
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
              <span className="text-xs font-bold text-slate-900 font-display">{user.name}</span>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 mt-0.5 font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                {user.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-sm"
              title={t('nav_logout')}
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Bottom Row (Mobile Scroll View) - simplified, padded, scrollable */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 border-t border-slate-100">
          {allLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path) || (link.matchPrefix && isActivePrefix(link.matchPrefix));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs transition-all whitespace-nowrap font-bold ${
                  active
                    ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-teal-600" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Voice navigation transcript display */}
      {isListening && transcript && (
        <div className="max-w-7xl mx-auto mt-2.5 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 shadow-sm">
          🎤 Voice Input: "{transcript}"
        </div>
      )}
    </nav>
  );
};

export default Navbar;
