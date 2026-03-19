import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🏠', title: 'Room Designer', desc: 'Draw custom room shapes with exact dimensions and wall placements.' },
  { icon: '🪑', title: 'Furniture Library', desc: 'Browse hundreds of 3D furniture models and drag them into your room.' },
  { icon: '🌐', title: '3D Visualizer', desc: 'See your complete design in photorealistic 3D with lighting and shadows.' },
  { icon: '📱', title: 'AR Preview', desc: 'Point your phone camera and see furniture placed in your real space.' },
  { icon: '💾', title: 'Save & Share', desc: 'Save unlimited designs and share them with a public link.' },
  { icon: '🤖', title: 'AI Suggestions', desc: 'Get smart layout recommendations powered by AI.' },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-surface to-surface pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-500 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
            Now with WebXR Augmented Reality
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Design rooms.<br />
            <span className="text-brand-500">See them in AR.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            The all-in-one interior design platform — create layouts, place 3D furniture, and preview everything in your real space before you buy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-base px-8 py-3">Open Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-base px-8 py-3">Start for free</Link>
                <Link to="/login" className="btn-ghost text-base px-8 py-3">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="font-display text-3xl font-bold text-white text-center mb-12">Everything you need to design with confidence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card hover:border-brand-500/50 group">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-brand-500 transition-colors">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line py-20 px-4 text-center">
        <h2 className="font-display text-4xl font-bold text-white mb-4">Ready to redesign your space?</h2>
        <p className="text-gray-400 mb-8">Free to start. No credit card required.</p>
        {!user && <Link to="/register" className="btn-primary text-base px-10 py-3">Get started free</Link>}
      </section>
    </div>
  );
};
export default HomePage;
