import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, User, Activity, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, register, errorMsg, setErrorMsg } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isLogin) {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        navigate('/');
      }
    } else {
      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      if (res.success) {
        navigate('/');
      }
    }
    setLoading(false);
  };

  const setDemoCredentials = (email, role) => {
    setFormData({
      name: '',
      email: email,
      password: 'password123',
      role: role,
    });
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyanAccent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blueAccent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md glass-card p-8 rounded-2xl z-10">
        
        {/* Title logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-cyanAccent to-blueAccent rounded-2xl glow-cyan text-slate-900 mb-3">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ParkinsonCare <span className="text-cyanAccent">AI</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Clinical-Grade Assessment & Monitoring Platform</p>
        </div>

        {/* Tab switch logic */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors cursor-pointer ${
              isLogin ? 'text-cyanAccent border-b-2 border-cyanAccent' : 'text-gray-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors cursor-pointer ${
              !isLogin ? 'text-cyanAccent border-b-2 border-cyanAccent' : 'text-gray-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Display backend validation error */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sign Up fields */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="E.g. Robert Miller"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyanAccent transition-all"
                />
              </div>
            </div>
          )}

          {/* Role selector for registration */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Role Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('patient')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    formData.role === 'patient'
                      ? 'border-cyanAccent bg-cyanAccent/10 text-cyanAccent'
                      : 'border-white/10 bg-slate-900/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-4 h-4 mb-1" />
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('caregiver')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    formData.role === 'caregiver'
                      ? 'border-cyanAccent bg-cyanAccent/10 text-cyanAccent'
                      : 'border-white/10 bg-slate-900/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4 mb-1" />
                  Caregiver
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('doctor')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    formData.role === 'doctor'
                      ? 'border-cyanAccent bg-cyanAccent/10 text-cyanAccent'
                      : 'border-white/10 bg-slate-900/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mb-1" />
                  Doctor
                </button>
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="yourname@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyanAccent transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyanAccent transition-all"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyanAccent to-blueAccent hover:from-cyanAccent hover:to-blueAccent/80 text-slate-900 font-bold text-sm rounded-lg shadow-lg glow-cyan transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Credentials Section */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs font-semibold text-cyanAccent uppercase tracking-wider mb-3">Clinical Demo Profiles</p>
          <div className="space-y-2">
            <button
              onClick={() => setDemoCredentials('patient@parkinsoncare.com', 'patient')}
              className="w-full text-left p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs hover:border-white/20 transition-all flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-semibold text-white">Robert Miller <span className="text-[10px] text-cyanAccent">(Patient)</span></p>
                <p className="text-gray-400 font-mono">patient@parkinsoncare.com</p>
              </div>
              <span className="text-[10px] bg-cyanAccent/10 text-cyanAccent px-1.5 py-0.5 rounded">Load</span>
            </button>

            <button
              onClick={() => setDemoCredentials('caregiver@parkinsoncare.com', 'caregiver')}
              className="w-full text-left p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs hover:border-white/20 transition-all flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-semibold text-white">Sarah Chen <span className="text-[10px] text-emeraldAccent">(Caregiver)</span></p>
                <p className="text-gray-400 font-mono">caregiver@parkinsoncare.com</p>
              </div>
              <span className="text-[10px] bg-emeraldAccent/10 text-emeraldAccent px-1.5 py-0.5 rounded">Load</span>
            </button>

            <button
              onClick={() => setDemoCredentials('doctor@parkinsoncare.com', 'doctor')}
              className="w-full text-left p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs hover:border-white/20 transition-all flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-semibold text-white">Dr. Evelyn Martinez <span className="text-[10px] text-blueAccent">(Doctor)</span></p>
                <p className="text-gray-400 font-mono">doctor@parkinsoncare.com</p>
              </div>
              <span className="text-[10px] bg-blueAccent/10 text-blueAccent px-1.5 py-0.5 rounded">Load</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 text-center">All demo profiles use password: <strong className="font-mono text-gray-300">password123</strong></p>
        </div>

      </div>
    </div>
  );
};

export default Login;
