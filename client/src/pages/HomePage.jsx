import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    title: 'Room Designer',
    desc: 'Draw custom room layouts with exact dimensions, walls, doors and windows.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
    title: 'Furniture Library',
    desc: 'Browse hundreds of 3D furniture models organized by room and category.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title: '3D Visualizer',
    desc: 'Walk through your design with a real-time 3D view, lighting and shadows.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2"/>
        <rect x="7" y="7" width="10" height="10" rx="1"/>
      </svg>
    ),
    title: 'AR Preview',
    desc: 'Point your phone camera and see furniture placed in your actual space.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Auto-Save',
    desc: 'Your work is saved continuously. Never lose a design change again.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    title: 'AI Suggestions',
    desc: 'Get smart layout recommendations powered by AI based on your room size.',
  },
];

const STATS = [
  { value: '70+', label: 'Furniture models' },
  { value: '3D', label: 'Real-time render' },
  { value: 'AR', label: 'WebXR powered' },
  { value: '∞', label: 'Saved projects' },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950 pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Eyebrow tag */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 mb-8
                          border border-gray-800 rounded-full px-4 py-2
                          bg-gray-900/60 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-slow" />
            <span className="text-xs font-mono text-gray-400 tracking-wider">WebXR Augmented Reality</span>
          </div>

          <h1 className="animate-fade-up delay-100 font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl
                         font-bold text-white leading-[1.05] tracking-tight mb-6">
            Design rooms.
            <br />
            <span className="text-gradient-accent italic">See them in AR.</span>
          </h1>

          <p className="animate-fade-up delay-200 text-gray-400 text-lg md:text-xl leading-relaxed
                        max-w-2xl mx-auto mb-10">
            The all-in-one interior design platform. Create layouts, place 3D furniture,
            and preview everything in your real space — before you buy a single piece.
          </p>

          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 justify-center mb-16">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm px-8 py-3 rounded-xl">
                Open Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-sm px-8 py-3 rounded-xl">
                  Start for free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/login" className="btn-ghost text-sm px-8 py-3 rounded-xl">
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="animate-fade-up delay-400 grid grid-cols-2 sm:grid-cols-4 gap-px
                          border border-gray-800 rounded-2xl overflow-hidden max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-gray-900 px-6 py-5 text-center">
                <div className="text-2xl font-bold text-white font-display mb-1">{s.value}</div>
                <div className="text-xs text-gray-600 font-mono tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-gray-600 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="relative py-28 px-5">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <div className="section-tag mx-auto">
              <span className="text-accent">✦</span> Features
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Everything to design with confidence
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
              From blank canvas to AR walkthrough — every tool you need in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group card card-hover cursor-default"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gray-800 border border-gray-700
                                flex items-center justify-center text-gray-400
                                group-hover:border-gray-600 group-hover:text-white
                                transition-all duration-300 mb-5">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-accent
                               transition-colors duration-200">
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="py-28 px-5 border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-tag mx-auto">
              <span className="text-accent">✦</span> Workflow
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              From idea to reality in 4 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '01', title: 'Draw your room', desc: 'Set dimensions and place walls on the 2D canvas.' },
              { n: '02', title: 'Add furniture', desc: 'Pick from 70+ 3D models and arrange them freely.' },
              { n: '03', title: 'Preview in 3D', desc: 'Walk through your design in real-time 3D view.' },
              { n: '04', title: 'View in AR', desc: 'See furniture placed in your real room via camera.' },
            ].map((step, i) => (
              <div key={step.n} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px
                                  bg-gradient-to-r from-gray-700 to-transparent z-0" />
                )}
                <div className="card relative z-10">
                  <div className="font-mono text-xs text-gray-700 mb-4">{step.n}</div>
                  <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-gray-800 p-12 text-center"
               style={{ background: 'linear-gradient(135deg, #141414 0%, #1a1a1a 100%)' }}>
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px
                            bg-gradient-to-r from-transparent via-gray-600 to-transparent" />

            <div className="section-tag mx-auto mb-6">
              <span className="text-accent">✦</span> Get started
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to redesign your space?
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Free to start. No credit card required.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="btn-primary text-sm px-8 py-3 rounded-xl">
                  Create free account
                </Link>
                <Link to="/login" className="btn-ghost text-sm px-8 py-3 rounded-xl">
                  Sign in
                </Link>
              </div>
            )}
            {user && (
              <Link to="/dashboard" className="btn-primary text-sm px-8 py-3 rounded-xl">
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-900 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke="#080808" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-display font-bold text-white">InteriorAR</span>
          </div>
          <p className="text-xs text-gray-700 font-mono">
            © {new Date().getFullYear()} InteriorAR. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
