import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', w: 'w-1/4' };
    if (p.length < 8)  return { label: 'Weak',      color: 'bg-orange-500', w: 'w-2/4' };
    if (p.length < 12) return { label: 'Good',      color: 'bg-yellow-500', w: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', w: 'w-full' };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-[400px] animate-fade-up">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center
                            transition-transform duration-200 group-hover:scale-95">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke="#080808" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M1 5l7 4 7-4" stroke="#080808" strokeWidth="1.5"/>
                <path d="M8 9v6" stroke="#080808" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="font-display font-bold text-white">InteriorAR</span>
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-gray-500 text-sm">Start designing your dream space for free</p>
        </div>

        {/* Card */}
        <div className="card border-gray-800 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20
                              text-red-400 text-sm px-4 py-3 rounded-xl animate-scale-in">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPass ? 'text' : 'password'}
                  placeholder="min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600
                             hover:text-gray-400 transition-colors p-1"
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                  </div>
                  <p className={`text-xs mt-1 ${
                    strength.label === 'Strong' ? 'text-green-500' :
                    strength.label === 'Good'   ? 'text-yellow-500' : 'text-gray-600'
                  }`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <div className="divider my-5" />

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium hover:text-gray-200 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back */}
        <div className="text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-700
                                  hover:text-gray-400 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
