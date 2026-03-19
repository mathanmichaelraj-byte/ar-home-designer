import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await authAPI.updateMe(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 px-4 max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-bold text-white mb-8">Profile</h1>
      <div className="card space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              {saved ? '✓ Saved' : 'Save changes'}
            </button>
            <button type="button" onClick={logout}
              className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm transition-colors">
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProfilePage;
