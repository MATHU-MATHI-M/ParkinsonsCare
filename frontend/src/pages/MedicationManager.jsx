import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Pill, Plus, X, Edit2, Trash2, PhoneCall, Check, Clock, History, AlertTriangle } from 'lucide-react';

const MedicationManager = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', dosage: '', time: '08:00',
    morning: true, afternoon: false, night: false,
    beforeFood: false, afterFood: true,
    repeatType: 'daily', startDate: '', endDate: '',
    doctorName: '', doctorNotes: '', pharmacyName: '',
    customInstructions: '',
    countryCode: '+91', phoneNumber: '',
    reminderType: 'Email'
  });

  const resetForm = () => {
    setForm({
      name: '', dosage: '', time: '08:00',
      morning: true, afternoon: false, night: false,
      beforeFood: false, afterFood: true,
      repeatType: 'daily', startDate: '', endDate: '',
      doctorName: '', doctorNotes: '', pharmacyName: '',
      customInstructions: '',
      countryCode: '+91', phoneNumber: '',
      reminderType: 'Email'
    });
    setEditingId(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medsRes, callsRes] = await Promise.all([
        api.get('/medications'),
        api.get('/medications/calls')
      ]);
      if (medsRes.data.success) setMedications(medsRes.data.data || []);
      if (callsRes.data.success) setCallLogs(callsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      if (editingId) {
        const res = await api.put(`/medications/${editingId}`, {
          medicineName: form.name,
          dosage: form.dosage,
          time: form.time,
          morning: form.morning,
          afternoon: form.afternoon,
          night: form.night,
          beforeFood: form.beforeFood,
          afterFood: form.afterFood,
          repeatType: form.repeatType,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          doctorName: form.doctorName,
          doctorNotes: form.doctorNotes,
          pharmacyName: form.pharmacyName,
          customInstructions: form.customInstructions,
          countryCode: form.countryCode,
          phoneNumber: form.phoneNumber,
          reminderType: form.reminderType
        });
        if (res.data.success) {
          await fetchData();
          resetForm();
          setShowForm(false);
        }
      } else {
        const res = await api.post('/medications', form);
        if (res.data.success) {
          await fetchData();
          resetForm();
          setShowForm(false);
        }
      }
    } catch (err) {
      console.error('Error saving medication:', err);
    }
  };

  const handleEdit = (med) => {
    setForm({
      name: med.medicineName,
      dosage: med.dosage || '',
      time: med.time || '08:00',
      morning: med.morning || false,
      afternoon: med.afternoon || false,
      night: med.night || false,
      beforeFood: med.beforeFood || false,
      afterFood: med.afterFood !== undefined ? med.afterFood : true,
      repeatType: med.repeatType || 'daily',
      startDate: med.startDate ? new Date(med.startDate).toISOString().split('T')[0] : '',
      endDate: med.endDate ? new Date(med.endDate).toISOString().split('T')[0] : '',
      doctorName: med.doctorName || '',
      doctorNotes: med.doctorNotes || '',
      pharmacyName: med.pharmacyName || '',
      customInstructions: med.customInstructions || '',
      countryCode: med.countryCode || '+91',
      phoneNumber: med.phoneNumber || '',
      reminderType: med.reminderType || 'Email'
    });
    setEditingId(med._id);
    setShowForm(true);
  };

  const handleDelete = async (medId) => {
    try {
      await api.delete(`/medications/${medId}`);
      await fetchData();
    } catch (err) {
      console.error('Error deleting medication:', err);
    }
  };

  const handleToggleTaken = async (medId) => {
    try {
      await api.post(`/medications/${medId}/take`);
      await fetchData();
    } catch (err) {
      console.error('Error toggling intake:', err);
    }
  };

  const handleSimulateCall = async (medId) => {
    try {
      const res = await api.post(`/medications/${medId}/call`);
      if (res.data.success) {
        alert(res.data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Error simulating call:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  const inputClass = 'w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-cyanAccent/50 transition-colors';
  const labelClass = 'block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1';

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {t('medication_reminders')}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">Manage prescriptions, schedules, and voice call reminders</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyanAccent text-slate-900 font-bold text-xs rounded-xl cursor-pointer hover:bg-cyanAccent/90 transition-all"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? t('cancel') : t('add_medicine')}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-cyanAccent/15 space-y-5">
            <h3 className="text-sm font-bold text-cyanAccent border-b border-white/5 pb-2">
              {editingId ? 'Edit Prescription' : 'New Prescription'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t('medicine_name')} *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="E.g. Syndopa Plus" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('dosage')}</label>
                <input type="text" value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} placeholder="25/100 mg" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('time')} (24h)</label>
                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className={inputClass} />
              </div>
            </div>

            {/* Dose Timing */}
            <div>
              <label className={labelClass}>Dose Schedule</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {[{key:'morning',label:'Morning'},{key:'afternoon',label:'Afternoon'},{key:'night',label:'Night'}].map(s => (
                  <label key={s.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={form[s.key]} onChange={e => setForm({...form, [s.key]: e.target.checked})}
                      className="w-4 h-4 rounded border-white/20 bg-slate-950 accent-cyanAccent" />
                    <span className="text-gray-300">{s.label}</span>
                  </label>
                ))}
                <span className="text-gray-600 mx-2">|</span>
                {[{key:'beforeFood',label:'Before Food'},{key:'afterFood',label:'After Food'}].map(s => (
                  <label key={s.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={form[s.key]} onChange={e => setForm({...form, [s.key]: e.target.checked})}
                      className="w-4 h-4 rounded border-white/20 bg-slate-950 accent-cyanAccent" />
                    <span className="text-gray-300">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Repeat & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Repeat</label>
                <select value={form.repeatType} onChange={e => setForm({...form, repeatType: e.target.value})} className={inputClass}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className={inputClass} />
              </div>
            </div>

            {/* Doctor & Pharmacy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Doctor Name</label>
                <input type="text" value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} placeholder="Dr. Martinez" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pharmacy Name</label>
                <input type="text" value={form.pharmacyName} onChange={e => setForm({...form, pharmacyName: e.target.value})} placeholder="Apollo Pharmacy" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Custom Instructions</label>
                <input type="text" value={form.customInstructions} onChange={e => setForm({...form, customInstructions: e.target.value})} placeholder="Take with warm water" className={inputClass} />
              </div>
            </div>

            {/* Doctor Notes */}
            <div>
              <label className={labelClass}>Doctor Notes</label>
              <textarea value={form.doctorNotes} onChange={e => setForm({...form, doctorNotes: e.target.value})} placeholder="Special instructions from the treating physician..." rows={2} className={inputClass + ' resize-none'} />
            </div>

            {/* Phone & Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Country Code</label>
                <select value={form.countryCode} onChange={e => setForm({...form, countryCode: e.target.value})} className={inputClass}>
                  <option value="+91">+91 (India)</option>
                  <option value="+1">+1 (USA/Canada)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (Australia)</option>
                  <option value="+49">+49 (Germany)</option>
                  <option value="+33">+33 (France)</option>
                  <option value="+81">+81 (Japan)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('phone_number')}</label>
                <input type="tel" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} placeholder="9876543210" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('reminder_type')}</label>
                <select value={form.reminderType} onChange={e => setForm({...form, reminderType: e.target.value})} className={inputClass}>
                  <option value="Notification">Notification</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="Voice Call">Voice Call</option>
                </select>
              </div>
            </div>

            <button type="submit" className="px-6 py-2.5 bg-cyanAccent text-slate-900 font-bold text-xs rounded-xl cursor-pointer hover:bg-cyanAccent/90 transition-all">
              {editingId ? t('save') : t('save_prescription')}
            </button>
          </form>
        )}

        {/* Medications Grid */}
        {medications.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center py-16">
            <Pill className="w-16 h-16 text-cyanAccent/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Prescriptions Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">{t('no_medications')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications.map(med => {
              const taken = med.takenHistory?.some(h => h.date === todayStr);
              return (
                <div key={med._id} className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 hover:border-cyanAccent/20 transition-all">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyanAccent/10 rounded-lg mt-0.5">
                        <Pill className="w-5 h-5 text-cyanAccent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{med.medicineName}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{med.dosage} • {med.time}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {med.morning && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20">AM</span>}
                          {med.afternoon && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">NOON</span>}
                          {med.night && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">PM</span>}
                          {med.beforeFood && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-800 text-gray-400 rounded">Before Food</span>}
                          {med.afterFood && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-800 text-gray-400 rounded">After Food</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(med)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyanAccent cursor-pointer transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(med._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-roseAccent cursor-pointer transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Meta */}
                  {(med.doctorName || med.pharmacyName) && (
                    <div className="text-[10px] text-gray-500 space-y-0.5 border-t border-white/5 pt-2">
                      {med.doctorName && <p>Doctor: <span className="text-gray-300">{med.doctorName}</span></p>}
                      {med.pharmacyName && <p>Pharmacy: <span className="text-gray-300">{med.pharmacyName}</span></p>}
                      {med.customInstructions && <p>Note: <span className="text-gray-300 italic">{med.customInstructions}</span></p>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    <button
                      onClick={() => handleToggleTaken(med._id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        taken
                          ? 'bg-emerald-500/10 text-emeraldAccent border-emerald-500/20'
                          : 'bg-slate-900 text-gray-400 border-white/10 hover:border-cyanAccent/20'
                      }`}
                    >
                      {taken ? <><Check className="w-3 h-3" /> {t('taken_today')}</> : <><Clock className="w-3 h-3" /> {t('mark_taken')}</>}
                    </button>

                    {med.reminderType === 'Voice Call' && (
                      <button
                        onClick={() => handleSimulateCall(med._id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-cyanAccent/10 border border-cyanAccent/20 hover:bg-cyanAccent/20 text-cyanAccent text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        <PhoneCall className="w-3 h-3" />
                        {t('simulate_call')}
                      </button>
                    )}

                    <span className="ml-auto px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-gray-400 rounded border border-white/5">
                      {med.reminderType}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call Logs */}
        {callLogs.length > 0 && (
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <History className="w-4 h-4 text-cyanAccent" />
              Twilio Voice Call History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
              {callLogs.map(log => (
                <div key={log._id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-white">{log.medicineName}</p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                    {log.phoneNumber && <p className="text-[9px] text-gray-500 mt-0.5">To: {log.phoneNumber}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      log.callStatus === 'Answered' ? 'bg-emerald-500/10 text-emeraldAccent' :
                      log.callStatus === 'Missed' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-roseAccent'
                    }`}>
                      {log.callStatus}
                    </span>
                    <p className="text-[9px] text-gray-500">
                      {log.duration > 0 ? `${log.duration}s` : ''} {log.retryCount > 0 ? `• ${log.retryCount} retries` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MedicationManager;
