import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name: user?.name || '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateMe(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="min-h-screen pt-24 pb-20 px-5">
      <div className="max-w-lg mx-auto">

        {/* Page title */}
        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-mono text-gray-600 mb-1 tracking-wider uppercase">Account</p>
          <h1 className="font-display text-3xl font-bold text-white">Profile</h1>
        </div>

        {/* Avatar + info card */}
        <div className="card border-gray-800 mb-5 animate-fade-up delay-100">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700
                              flex items-center justify-center text-white text-lg font-bold font-display
                              select-none">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white
                              border-2 border-gray-900" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold truncate">{user?.name}</h2>
              <p className="text-gray-500 text-sm truncate">{user?.email}</p>
              <span className="badge-white mt-1.5 text-xs">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card border-gray-800 animate-fade-up delay-200">
          <h3 className="text-white font-semibold text-sm mb-5">Account settings</h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="label">Display name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                value={user?.email}
                disabled
                placeholder="Email"
              />
              <p className="text-xs text-gray-700 mt-1.5">Email cannot be changed.</p>
            </div>

            <div className="divider" />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm px-5 py-2.5"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : saved ? (
                  <span className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Saved
                  </span>
                ) : 'Save changes'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-danger text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Sign out
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card border-red-500/10 bg-red-500/[0.03] mt-5 animate-fade-up delay-300">
          <h3 className="text-red-400 font-semibold text-sm mb-2">Danger zone</h3>
          <p className="text-gray-600 text-xs mb-4 leading-relaxed">
            Permanently delete your account and all associated projects. This action cannot be undone.
          </p>
          <button className="text-xs text-red-500 hover:text-red-300 border border-red-500/20
                             hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all duration-200">
            Delete account
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
