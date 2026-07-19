import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { User, Activity, FileText, ChevronRight, FilePlus, Download, CheckCircle, ShieldAlert, Heart, Calendar } from 'lucide-react';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch assigned patients
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
      console.error('Error fetching patients roster:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual patient diagnostic details
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

  const handleGenerateReport = async () => {
    if (!selectedPatientId) return;
    setGeneratingReport(true);
    try {
      const res = await api.post(`/clinicians/patient/${selectedPatientId}/report`, { type: 'weekly' });
      if (res.data.success) {
        alert('AI clinical progress report successfully compiled and saved to MongoDB!');
        fetchPatientDetails(selectedPatientId); // Refresh details
      }
    } catch (err) {
      console.error('Error generating AI report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportPDF = () => {
    window.print(); // Simple, clean printing trigger configured with print styles
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 md:px-8 py-8 print:bg-white print:text-black">
      <div className="max-w-7xl mx-auto space-y-8 print:space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4 print:border-black print:pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent print:text-black">
              Clinician Roster Control
            </h1>
            <p className="text-gray-400 text-xs mt-0.5 print:hidden">Monitor motor tremors and medication logs for assigned patients</p>
          </div>
          {selectedPatientId && summary && (
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-white/10 hover:bg-slate-950 text-xs font-bold rounded-xl cursor-pointer text-gray-200 print:hidden transition-all"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>

        {patients.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl border border-white/5 text-center py-16">
            <User className="w-16 h-16 text-cyanAccent/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Assigned Patients</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              There are currently no patients mapped to your clinician credentials in MongoDB. Link patients via Settings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Patients List */}
            <div className="lg:col-span-1 space-y-3 print:hidden">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 font-mono">My Patients</h3>
              <div className="space-y-2">
                {patients.map((p) => (
                  <button
                    key={p.user._id}
                    onClick={() => setSelectedPatientId(p.user._id)}
                    className={`w-full p-4 rounded-xl text-left border flex justify-between items-center transition-all cursor-pointer ${
                      selectedPatientId === p.user._id
                        ? 'bg-cyanAccent/10 border-cyanAccent text-white glow-cyan'
                        : 'bg-slate-900/60 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-white">{p.user.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.user.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Patient Diagnostic Details Panel */}
            <div className="lg:col-span-3 space-y-6">
              {detailLoading || !summary ? (
                <div className="glass-card p-12 rounded-2xl border border-white/5 flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Grid layout for Patient Profile metadata */}
                  <div className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden print:border-black">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Patient Index</h4>
                      <p className="text-base font-bold text-white">{summary.profile.user.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{summary.profile.user.email}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clinician Biometrics</h4>
                      <div className="text-xs text-gray-300 space-y-1">
                        <p>Age: <strong className="text-white">{summary.profile.age || 'N/A'}</strong></p>
                        <p>Hoehn & Yahr Stage: <strong className="text-white">{summary.profile.diseaseStage || 'N/A'}</strong></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Emergency Contact</h4>
                      <div className="text-xs text-gray-300 space-y-0.5">
                        <p className="font-semibold text-white">{summary.profile.emergencyContact?.name || 'N/A'}</p>
                        <p className="text-[10px] text-gray-400">({summary.profile.emergencyContact?.relation || 'N/A'})</p>
                        <p className="font-mono text-cyanAccent">{summary.profile.emergencyContact?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Diagnostic counts */}
                    <div className="glass-card p-6 rounded-2xl md:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Activity className="w-4 h-4 text-cyanAccent" />
                        Diagnostic Records (MongoDB)
                      </h3>

                      {summary.assessments.questionnaires.length === 0 &&
                       summary.assessments.games.length === 0 &&
                       summary.assessments.motor.length === 0 &&
                       summary.assessments.voice.length === 0 ? (
                        <p className="text-xs text-gray-500 py-6 text-center">Patient hasn't recorded any digital biomarkers yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {summary.assessments.questionnaires.length > 0 && (
                            <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                              <span className="text-gray-400">Latest Survey Non-Motor Score</span>
                              <span className="font-bold text-emeraldAccent text-sm">{summary.assessments.questionnaires[0].score}/100</span>
                            </div>
                          )}
                          {summary.assessments.games.map((g) => (
                            <div key={g._id} className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                              <span className="text-gray-400 uppercase tracking-wider text-[10px]">{g.gameType.replace('_', ' ')} Score</span>
                              <span className="font-bold text-cyanAccent text-sm">{g.score}/100</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Prescription compliance */}
                    <div className="glass-card p-6 rounded-2xl md:col-span-1 space-y-4 text-center flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 font-mono">Dose Compliance Today</h3>
                        <p className="text-5xl font-black text-white text-glow-cyan">{summary.complianceRate}%</p>
                      </div>
                      <div className="text-left bg-slate-950/60 p-3 border border-white/5 rounded-xl text-[10px] text-gray-400 leading-relaxed mt-4">
                        Compliance measures the ratio of morning, noon, or evening doses signed off by the patient.
                      </div>
                    </div>

                  </div>

                  {/* Twilio logs */}
                  {summary.callLogs.length > 0 && (
                    <div className="glass-card p-6 rounded-2xl space-y-4 print:hidden">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Calendar className="w-4 h-4 text-roseAccent" />
                        Twilio Calling logs
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto custom-scrollbar">
                        {summary.callLogs.map((log) => (
                          <div key={log._id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-white">{log.medicineName}</p>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                log.callStatus === 'Answered' ? 'bg-emerald-500/10 text-emeraldAccent border border-emerald-500/20' :
                                'bg-red-500/10 text-roseAccent border border-red-500/20'
                              }`}>
                                {log.callStatus}
                              </span>
                              <p className="text-[9px] text-gray-500 mt-1">Retries: {log.retryCount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Clinical Reports */}
                  <div className="glass-card p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyanAccent" />
                        AI Progress Reports (Llama)
                      </h3>
                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyanAccent text-slate-900 font-bold text-xs rounded-xl cursor-pointer hover:bg-cyanAccent/90 transition-all print:hidden"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        {generatingReport ? 'Compiling AI Report...' : 'Compile Progress Report'}
                      </button>
                    </div>

                    {summary.reports.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-6">No clinical progress reports generated. Click the button above to compile a Llama report.</p>
                    ) : (
                      <div className="space-y-4">
                        {summary.reports.map((report) => (
                          <div key={report._id} className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-3 print:border-black print:text-black">
                            <div className="flex justify-between items-center text-xs font-semibold text-cyanAccent">
                              <span>{report.type.toUpperCase()} CLINICAL RECORD</span>
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs space-y-2 text-gray-300 print:text-black">
                              <p><strong className="text-white print:text-black font-semibold">Summary Analysis:</strong> {report.summary}</p>
                              <p><strong className="text-white print:text-black font-semibold">Areas of Concern:</strong> {report.concerns}</p>
                              <p><strong className="text-white print:text-black font-semibold">Positive Improvements:</strong> {report.improvements}</p>
                              <p><strong className="text-white print:text-black font-semibold">Recommended Follow-up:</strong> {report.recommendations}</p>
                            </div>
                          </div>
                        ))}
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

export default DoctorDashboard;
