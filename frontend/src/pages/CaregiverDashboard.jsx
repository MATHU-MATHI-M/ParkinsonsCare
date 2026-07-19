import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Heart, Activity, CheckCircle, Clock, Pill, ShieldAlert, Phone, BookOpen, AlertTriangle } from 'lucide-react';

const CaregiverDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clinicians/patients');
      if (res.data.success) {
        setPatients(res.data.data || []);
        if (res.data.data.length > 0) {
          setSelectedPatientId(res.data.data[0].user._id);
        }
      }
    } catch (err) {
      console.error('Error fetching caregiver patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    if (!patientId) return;
    try {
      setDetailLoading(true);
      const res = await api.get(`/clinicians/patient/${patientId}/summary`);
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Caregiver Monitor Center
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">Track daily task checklists and prescription safety compliance for assigned patients</p>
        </div>

        {patients.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl border border-white/5 text-center py-16">
            <Heart className="w-16 h-16 text-roseAccent/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Patients Assigned</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              There are currently no patient profiles mapped to your caregiver email inside MongoDB.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Patients List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 font-mono">Assigned Patients</h3>
              <div className="space-y-2">
                {patients.map((p) => (
                  <button
                    key={p.user._id}
                    onClick={() => setSelectedPatientId(p.user._id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedPatientId === p.user._id
                        ? 'bg-cyanAccent/10 border-cyanAccent text-white'
                        : 'bg-slate-900/60 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <p className="font-semibold text-xs text-white">{p.user.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.user.email}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-3 space-y-6">
              {detailLoading || !summary ? (
                <div className="glass-card p-12 rounded-2xl border border-white/5 flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Tasks checklist */}
                    <div className="glass-card p-6 rounded-2xl md:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Activity className="w-4 h-4 text-cyanAccent" />
                        Today's Assessment Progress
                      </h3>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl text-xs">
                          <span className="text-gray-400 font-medium">Daily Symptoms Survey</span>
                          {summary.assessments.questionnaires.some(q => new Date(q.createdAt).toDateString() === new Date().toDateString()) ? (
                            <span className="flex items-center gap-1 text-emeraldAccent font-bold"><CheckCircle className="w-4 h-4" /> Complete</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Clock className="w-4 h-4" /> Pending</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl text-xs">
                          <span className="text-gray-400 font-medium">Archimedean Spiral Tracing</span>
                          {summary.assessments.games.some(g => g.gameType === 'spiral_drawing' && new Date(g.createdAt).toDateString() === new Date().toDateString()) ? (
                            <span className="flex items-center gap-1 text-emeraldAccent font-bold"><CheckCircle className="w-4 h-4" /> Complete</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Clock className="w-4 h-4" /> Pending</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl text-xs">
                          <span className="text-gray-400 font-medium">Cognitive Memory Match</span>
                          {summary.assessments.games.some(g => g.gameType === 'memory_match' && new Date(g.createdAt).toDateString() === new Date().toDateString()) ? (
                            <span className="flex items-center gap-1 text-emeraldAccent font-bold"><CheckCircle className="w-4 h-4" /> Complete</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Clock className="w-4 h-4" /> Pending</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contacts */}
                    <div className="glass-card p-6 rounded-2xl md:col-span-1 space-y-4">
                      <h3 className="text-xs font-bold text-roseAccent uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Emergency Contacts
                      </h3>
                      <div className="bg-slate-900/40 p-4 rounded-xl space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Emergency Contact</p>
                          <p className="font-semibold text-white mt-0.5">{summary.profile.emergencyContact?.name || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400">({summary.profile.emergencyContact?.relation || 'N/A'})</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</p>
                          <a
                            href={`tel:${summary.profile.emergencyContact?.phone}`}
                            className="flex items-center gap-1 text-cyanAccent font-bold hover:underline mt-1 font-mono"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {summary.profile.emergencyContact?.phone || 'N/A'}
                          </a>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Medications schedules and compliance checks */}
                  <div className="glass-card p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Pill className="w-4 h-4 text-cyanAccent" />
                      Medication Adherence logs
                    </h3>

                    {summary.medications.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6">No medication schedules configured for this patient.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {summary.medications.map((med) => {
                          const taken = med.takenHistory.some(h => h.date === todayStr);
                          return (
                            <div key={med._id} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-white">{med.medicineName}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{med.dosage} • {med.time}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                taken ? 'bg-emerald-500/10 text-emeraldAccent' : 'bg-yellow-500/10 text-yellow-400'
                              }`}>
                                {taken ? '✓ Taken' : 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CaregiverDashboard;
