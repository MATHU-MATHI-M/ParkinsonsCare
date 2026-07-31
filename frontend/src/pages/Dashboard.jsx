import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Clock, Pill, Brain, Activity, User, Plus, X, Heart, Settings, PhoneCall, History, Info } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [medications, setMedications] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '08:00', phoneNumber: '', reminderType: 'Email' });
  const [showAddMed, setShowAddMed] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch profile metadata
      const profileRes = await api.get('/auth/me');
      if (profileRes.data.success) {
        setPatientProfile(profileRes.data.profile);
      }

      // 2. Fetch wellness stats from MongoDB (no mock curves)
      const wellnessRes = await api.get('/assessments/wellness');
      if (wellnessRes.data.success) {
        setStats(wellnessRes.data.data);
      }

      // 3. Fetch medications schedule
      const medsRes = await api.get('/medications');
      if (medsRes.data.success) {
        setMedications(medsRes.data.data);
      }

      // 4. Fetch Twilio reminder logs
      const callsRes = await api.get('/medications/calls');
      if (callsRes.data.success) {
        setCallLogs(callsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard database records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleMed = async (medId) => {
    try {
      const res = await api.post(`/medications/${medId}/take`);
      if (res.data.success) {
        // Refresh medication schedules list
        const medsRes = await api.get('/medications');
        if (medsRes.data.success) {
          setMedications(medsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error toggling medication intake:', err);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.time) return;

    try {
      const res = await api.post('/medications', {
        name: newMed.name,
        dosage: newMed.dosage,
        time: newMed.time,
        phoneNumber: newMed.phoneNumber || patientProfile?.emergencyContact?.phone || '',
        reminderType: newMed.reminderType
      });
      if (res.data.success) {
        setMedications([...medications, res.data.data]);
        setNewMed({ name: '', dosage: '', time: '08:00', phoneNumber: '', reminderType: 'Email' });
        setShowAddMed(false);
      }
    } catch (err) {
      console.error('Error adding prescription:', err);
    }
  };

  const handleDeleteMedication = async (medId) => {
    try {
      const res = await api.delete(`/medications/${medId}`);
      if (res.data.success) {
        setMedications(medications.filter(m => m._id !== medId));
      }
    } catch (err) {
      console.error('Error deleting medication:', err);
    }
  };

  const triggerVoiceReminder = async (medId) => {
    try {
      const res = await api.post(`/medications/${medId}/call`);
      if (res.data.success) {
        alert(res.data.message);
        // Refresh logs
        const callsRes = await api.get('/medications/calls');
        if (callsRes.data.success) {
          setCallLogs(callsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error placing voice reminder call:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const zeroState = stats?.zeroState;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 md:px-8 py-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dynamic Profile info banner */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">{user.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                <span>Age: <strong className="text-slate-800 font-semibold">{patientProfile?.age || 'Unconfigured'}</strong></span>
                <span>Stage: <strong className="text-slate-800 font-semibold">{patientProfile?.diseaseStage || 'Unconfigured'}</strong></span>
                <span>Height: <strong className="text-slate-800 font-semibold">{patientProfile?.height ? `${patientProfile.height}cm` : 'Unconfigured'}</strong></span>
                <span>Weight: <strong className="text-slate-800 font-semibold">{patientProfile?.weight ? `${patientProfile.weight}kg` : 'Unconfigured'}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer text-slate-700"
          >
            <Settings className="w-3.5 h-3.5 text-teal-600" />
            Configure Profile
          </button>
        </div>

        {/* ONBOARDING STATE (No assessments exist in MongoDB) */}
        {zeroState ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Onboarding block */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/50 rounded-full blur-3xl pointer-events-none" />
              
              <Info className="w-10 h-10 text-teal-600 mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2 font-display">Welcome to ParkinsonCare AI</h1>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-xl font-medium">
                This platform tracks kinetic tremors, speech clarity, and cognitive indices. Complete your profile details and baseline tests to unlock progress charts and clinician assessments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/settings')}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-white rounded-xl text-left cursor-pointer transition-all shadow-sm group"
                >
                  <h4 className="text-sm font-bold text-teal-700 mb-1 group-hover:text-teal-800 font-display">1. Update Clinical Profile</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Save age, height, weight, and link assigned doctor and caregivers.</p>
                </button>
                <button
                  onClick={() => navigate('/questionnaire')}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-white rounded-xl text-left cursor-pointer transition-all shadow-sm group"
                >
                  <h4 className="text-sm font-bold text-emerald-700 mb-1 group-hover:text-emerald-800 font-display">2. Daily Questionnaire</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Log sleep, mood, fatigue, and digestive logs for Non-Motor rating.</p>
                </button>
                <button
                  onClick={() => navigate('/game/spiral')}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-white rounded-xl text-left cursor-pointer transition-all shadow-sm group"
                >
                  <h4 className="text-sm font-bold text-sky-700 mb-1 group-hover:text-sky-800 font-display">3. Spiral Tracing Challenge</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Trace Archimedean shapes on canvas to log baseline kinetic tremor metrics.</p>
                </button>
                <button
                  onClick={() => navigate('/game/memory')}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-white rounded-xl text-left cursor-pointer transition-all shadow-sm group"
                >
                  <h4 className="text-sm font-bold text-purple-700 mb-1 group-hover:text-purple-800 font-display">4. Cognitive Match Challenge</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Flip matching cards to check baseline recall speed and errors.</p>
                </button>
              </div>
            </div>

            {/* Right: Empty Medication Schedule */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 font-display">Medication Reminders</h3>
                  <button
                    onClick={() => setShowAddMed(!showAddMed)}
                    className="p-1.5 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 cursor-pointer shadow-sm"
                  >
                    {showAddMed ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {showAddMed && (
                  <form onSubmit={handleAddMedication} className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 space-y-3 shadow-inner">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Medicine Name</label>
                      <input
                        type="text"
                        required
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                        placeholder="E.g. Sinemet"
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Dosage</label>
                        <input
                          type="text"
                          value={newMed.dosage}
                          onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                          placeholder="25/100 mg"
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Time (24h)</label>
                        <input
                          type="text"
                          required
                          value={newMed.time}
                          onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                          placeholder="08:00"
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={newMed.phoneNumber}
                          onChange={(e) => setNewMed({ ...newMed, phoneNumber: e.target.value })}
                          placeholder="+15550199"
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Reminder Type</label>
                        <select
                          value={newMed.reminderType}
                          onChange={(e) => setNewMed({ ...newMed, reminderType: e.target.value })}
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:border-teal-600 font-semibold"
                        >
                          <option value="Email">Email</option>
                          <option value="Voice Call">Voice Call</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Save Prescription
                    </button>
                  </form>
                )}

                {medications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8 font-medium">Your medication schedules are empty. Click the plus button to configure prescriptions.</p>
                ) : (
                  <div className="space-y-3">
                    {medications.map(med => (
                      <div key={med._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 font-display">{med.medicineName}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">{med.dosage} • {med.time}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMedication(med._id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ACTIVE DATABASE STATE (Dynamic data populated from MongoDB) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Wellness Circle & Breakdown */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 font-display">Aggregated Wellness</h3>
                
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-teal-600 transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * stats.wellnessScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black text-slate-900 font-display">{stats.wellnessScore}</span>
                    <span className="text-[10px] text-teal-700 uppercase tracking-widest font-bold mt-1">Index</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-slate-500 font-semibold">Risk Assessment: </span>
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                    stats.riskCategory === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    stats.riskCategory === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {stats.riskCategory} Risk
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 text-left leading-relaxed w-full">
                  <p className="font-bold text-teal-700 mb-1">AI Recommendation:</p>
                  {stats.recommendation}
                </div>
              </div>

              {/* Core sub-scores */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 font-display">Biomarker breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  {stats.scores?.nonMotorScore !== undefined && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] text-slate-500 font-bold">Non-Motor</p>
                      <p className="text-xl font-bold text-emerald-700 mt-1">{stats.scores.nonMotorScore}</p>
                    </div>
                  )}
                  {stats.scores?.cognitiveScore !== undefined && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] text-slate-500 font-bold">Cognitive</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">{stats.scores.cognitiveScore}</p>
                    </div>
                  )}
                  {stats.scores?.motorScore !== undefined && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] text-slate-500 font-bold">Fine Motor</p>
                      <p className="text-xl font-bold text-teal-700 mt-1">{stats.scores.motorScore}</p>
                    </div>
                  )}
                  {stats.scores?.voiceScore !== undefined && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-[10px] text-slate-500 font-bold">Acoustic</p>
                      <p className="text-xl font-bold text-purple-700 mt-1">{stats.scores.voiceScore}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Active Tasks Checklist */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-base font-bold text-slate-800 font-display mb-4">Diagnostics Checklist</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      {stats.assessmentsCompletedToday?.questionnaire ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-display">Daily Symptoms Survey</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Log mood, fatigue levels</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/questionnaire')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stats.assessmentsCompletedToday?.questionnaire ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                      }`}
                    >
                      {stats.assessmentsCompletedToday?.questionnaire ? 'Retake' : 'Start'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      {stats.assessmentsCompletedToday?.games ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-display">Memory card challenge</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Check accuracy metrics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/game/memory')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stats.assessmentsCompletedToday?.games ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                      }`}
                    >
                      {stats.assessmentsCompletedToday?.games ? 'Replay' : 'Start'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      {stats.assessmentsCompletedToday?.motor ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-display">Spiral Drawing assessment</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Trace coordinates guide</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/game/spiral')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stats.assessmentsCompletedToday?.motor ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                      }`}
                    >
                      {stats.assessmentsCompletedToday?.motor ? 'Redraw' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Twilio call outcome logs */}
              {callLogs.length > 0 && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-teal-600" />
                    Medication Call Status logs
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {callLogs.map((log) => (
                      <div key={log._id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs shadow-inner">
                        <div>
                          <p className="font-bold text-slate-900 font-display">{log.medicineName}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.callStatus === 'Answered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.callStatus === 'Missed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {log.callStatus}
                          </span>
                          {log.retryCount > 0 && (
                            <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Retries: {log.retryCount}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Active Medication Schedules */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-800 font-display">Medication Reminders</h3>
                  <button
                    onClick={() => setShowAddMed(!showAddMed)}
                    className="p-1.5 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 cursor-pointer shadow-sm"
                  >
                    {showAddMed ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {showAddMed && (
                  <form onSubmit={handleAddMedication} className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 space-y-3 shadow-inner">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Medicine Name</label>
                      <input
                        type="text"
                        required
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                        placeholder="E.g. Sinemet"
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Dosage</label>
                        <input
                          type="text"
                          value={newMed.dosage}
                          onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                          placeholder="25/100 mg"
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Time (24h)</label>
                        <input
                          type="text"
                          required
                          value={newMed.time}
                          onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                          placeholder="08:00"
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={newMed.phoneNumber}
                          onChange={(e) => setNewMed({ ...newMed, phoneNumber: e.target.value })}
                          placeholder="+15550199"
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Reminder Type</label>
                        <select
                          value={newMed.reminderType}
                          onChange={(e) => setNewMed({ ...newMed, reminderType: e.target.value })}
                          className="w-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 rounded-lg focus:outline-none"
                        >
                          <option value="Email">Email</option>
                          <option value="Voice Call">Voice Call</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Save Prescription
                    </button>
                  </form>
                )}

                <div className="space-y-4">
                  {medications.map((med) => {
                    const taken = med.takenHistory?.some(h => h.date === todayStr);
                    return (
                      <div key={med._id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                              <Pill className="w-4 h-4 text-teal-600" />
                              {med.medicineName}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{med.dosage} • {med.time}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMedication(med._id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-2 pt-2.5 border-t border-slate-200 justify-between items-center">
                          <button
                            onClick={() => handleToggleMed(med._id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                              taken
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {taken ? '✓ Taken Today' : 'Mark Taken'}
                          </button>

                          {med.reminderType === 'Voice Call' && (
                            <button
                              onClick={() => triggerVoiceReminder(med._id)}
                              className="flex items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-xl cursor-pointer shadow-sm"
                            >
                              <PhoneCall className="w-3 h-3 text-teal-600" />
                              Simulate Twilio Call
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
