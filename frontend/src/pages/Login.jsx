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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background medical gradient subtle mesh */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-teal-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-sky-100/60 rounded-full blur-[140px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl p-8 rounded-2xl z-10">
        
        {/* Title logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-teal-600 rounded-2xl shadow-md text-white mb-3">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-display text-slate-900">
            ParkinsonCare <span className="text-teal-600 font-extrabold">AI</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium text-center">Clinical-Grade Assessment & Self-Management Platform</p>
        </div>

        {/* Tab switch logic */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors cursor-pointer ${
              isLogin ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors cursor-pointer ${
              !isLogin ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Display backend validation error */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl mb-5 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          
          {/* Sign Up fields */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="E.g. Robert Miller"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Role selector for registration */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Role Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('patient')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    formData.role === 'patient'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Heart className="w-4 h-4 mb-1 text-teal-600" />
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('caregiver')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    formData.role === 'caregiver'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4 mb-1 text-emerald-600" />
                  Caregiver
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('doctor')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    formData.role === 'doctor'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mb-1 text-sky-600" />
                  Doctor
                </button>
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="yourname@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Credentials Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3">Clinical Demo Profiles</p>
          <div className="space-y-2">
            <button
              onClick={() => setDemoCredentials('patient@parkinsoncare.com', 'patient')}
              className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:bg-teal-50/60 hover:border-teal-200 transition-all flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-900">Robert Miller <span className="text-[10px] text-teal-700 font-semibold">(Patient)</span></p>
                <p className="text-slate-500 font-mono text-[11px]">patient@parkinsoncare.com</p>
              </div>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">Load</span>
            </button>

            <button
              onClick={() => setDemoCredentials('caregiver@parkinsoncare.com', 'caregiver')}
              className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:bg-emerald-50/60 hover:border-emerald-200 transition-all flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-900">Sarah Chen <span className="text-[10px] text-emerald-700 font-semibold">(Caregiver)</span></p>
                <p className="text-slate-500 font-mono text-[11px]">caregiver@parkinsoncare.com</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Load</span>
            </button>

            <button
              onClick={() => setDemoCredentials('doctor@parkinsoncare.com', 'doctor')}
              className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:bg-sky-50/60 hover:border-sky-200 transition-all flex justify-between items-center cursor-pointer"
            >
              <div>
                <p className="font-bold text-slate-900">Dr. Evelyn Martinez <span className="text-[10px] text-sky-700 font-semibold">(Doctor)</span></p>
                <p className="text-slate-500 font-mono text-[11px]">doctor@parkinsoncare.com</p>
              </div>
              <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">Load</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 text-center">All demo profiles use password: <strong className="font-mono text-slate-700">password123</strong></p>
        </div>

      </div>
    </div>
  );
};

export default Login;
