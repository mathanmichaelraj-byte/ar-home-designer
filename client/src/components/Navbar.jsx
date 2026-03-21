import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AR</span>
          </div>
          <span className="font-display font-bold text-lg text-white">InteriorAR</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-brand-500' : 'text-gray-400 hover:text-white'}`}>Dashboard</Link>
              <Link to="/houses" className={`text-sm font-medium transition-colors ${isActive('/houses') ? 'text-brand-500' : 'text-gray-400 hover:text-white'}`}>Houses</Link>
              <Link to="/designer" className={`text-sm font-medium transition-colors ${isActive('/designer') ? 'text-brand-500' : 'text-gray-400 hover:text-white'}`}>Designer</Link>
              <Link to="/profile" className={`text-sm font-medium transition-colors ${isActive('/profile') ? 'text-brand-500' : 'text-gray-400 hover:text-white'}`}>{user.name}</Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-panel border-t border-line px-4 py-4 flex flex-col gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/designer" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>Designer</Link>
              <Link to="/profile" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>{user.name}</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-left text-red-400 text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn-primary text-sm text-center" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
