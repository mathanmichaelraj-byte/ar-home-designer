import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const isProjectsActive = 
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/designer') ||
    location.pathname.startsWith('/houses');

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowProjects(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AR</span>
          </div>
          <span className="font-display font-bold text-lg text-white">InteriorAR</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {/* Projects dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProjects(!showProjects)}
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    isProjectsActive ? 'text-brand-500' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Projects
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showProjects && (
                  <div className="absolute top-8 left-0 w-44 bg-panel border border-border rounded-xl shadow-2xl py-1 z-50">
                    <Link to="/dashboard" onClick={() => setShowProjects(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface transition-colors rounded-t-xl">
                      🛋️ Room Designer
                    </Link>
                    <Link to="/houses" onClick={() => setShowProjects(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface transition-colors rounded-b-xl">
                      🏡 House Designer
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/profile"
                className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-brand-500' : 'text-gray-400 hover:text-white'}`}>
                {user.name}
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-panel border-t border-border px-4 py-4 flex flex-col gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
                🛋️ Room Designer
              </Link>
              <Link to="/houses" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
                🏡 House Designer
              </Link>
              <Link to="/profile" className="text-gray-300 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
                {user.name}
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-left text-red-400 text-sm">
                Logout
              </button>
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