import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, User, ShieldAlert, Heart, Activity } from 'lucide-react';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicians, setClinicians] = useState({ doctors: [], caregivers: [] });
  
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Prefer not to say',
    diseaseStage: 'Stage 1 (Mild)',
    height: '',
    weight: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    doctor: '',
    caregiver: '',
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch current profile
        const meRes = await api.get('/auth/me');
        if (meRes.data.success && meRes.data.profile) {
          const p = meRes.data.profile;
          setFormData({
            age: p.age || '',
            gender: p.gender || 'Prefer not to say',
            diseaseStage: p.diseaseStage || 'Stage 1 (Mild)',
            height: p.height || '',
            weight: p.weight || '',
            emergencyContactName: p.emergencyContact?.name || '',
            emergencyContactRelation: p.emergencyContact?.relation || '',
            emergencyContactPhone: p.emergencyContact?.phone || '',
            doctor: p.doctor?._id || p.doctor || '',
            caregiver: p.caregiver?._id || p.caregiver || '',
          });
        }

        // 2. Fetch all clinicians
        const clinRes = await api.get('/auth/clinicians');
        if (clinRes.data.success) {
          setClinicians({
            doctors: clinRes.data.doctors || [],
            caregivers: clinRes.data.caregivers || [],
          });
        }
      } catch (err) {
        console.error('Error loading profile settings data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await api.put('/auth/profile', {
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        diseaseStage: formData.diseaseStage,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        emergencyContact: {
          name: formData.emergencyContactName,
          relation: formData.emergencyContactRelation,
          phone: formData.emergencyContactPhone,
        },
        doctor: formData.doctor || null,
        caregiver: formData.caregiver || null,
      });

      if (res.data.success) {
        setMessage('Profile configuration successfully updated in MongoDB!');
        setTimeout(() => navigate('/'), 1200);
      }
    } catch (err) {
      console.error('Error saving profile settings:', err);
      setMessage('Failed to update settings. Please check your backend connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyanAccent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clinical Profile Configuration</h1>
            <p className="text-gray-400 text-xs mt-0.5">Edit patient biometric indices and clinician assignments</p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-cyanAccent/10 border border-cyanAccent/20 text-cyanAccent text-xs rounded-xl mb-6 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Biometrics Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <User className="w-4 h-4 text-cyanAccent" />
              Patient Biometrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Age (Years)</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="E.g. 68"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Disease Stage (Hoehn & Yahr)</label>
                <select
                  name="diseaseStage"
                  value={formData.diseaseStage}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                >
                  <option value="Stage 1 (Mild)">Stage 1 (Mild)</option>
                  <option value="Stage 2 (Bilateral)">Stage 2 (Bilateral)</option>
                  <option value="Stage 3 (Balance Impairment)">Stage 3 (Balance Impairment)</option>
                  <option value="Stage 4 (Severe Disability)">Stage 4 (Severe Disability)</option>
                  <option value="Stage 5 (Wheelchair/Bedridden)">Stage 5 (Wheelchair/Bedridden)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="E.g. 175"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="E.g. 74"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>
            </div>
          </div>

          {/* Clinician Mapping Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Activity className="w-4 h-4 text-cyanAccent" />
              Clinical Team Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Assigned Doctor</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                >
                  <option value="">-- Select Clinician --</option>
                  {clinicians.doctors.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Assigned Caregiver</label>
                <select
                  name="caregiver"
                  value={formData.caregiver}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                >
                  <option value="">-- Select Caregiver --</option>
                  {clinicians.caregivers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contacts Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Heart className="w-4 h-4 text-roseAccent" />
              Emergency Mappings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Sarah Chen"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Relationship</label>
                <input
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  placeholder="Spouse / Child"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Contact Phone</label>
                <input
                  type="text"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-9022"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-cyanAccent to-blueAccent text-slate-900 hover:from-cyanAccent hover:to-blueAccent/80 font-bold text-sm rounded-xl shadow-lg glow-cyan transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Clinical Profile'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ProfileSettings;
