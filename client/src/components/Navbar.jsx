import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setShowProjects(false); }, [location.pathname]);

  const NavLink = ({ to, children, active }) => (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors duration-200 pb-0.5
        ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-white rounded-full" />
      )}
    </Link>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-gray-950/90 backdrop-blur-2xl border-b border-gray-800/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]'
        : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center
                          transition-transform duration-200 group-hover:scale-95">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke="#080808" strokeWidth="1.5"
                    strokeLinejoin="round"/>
              <path d="M1 5l7 4 7-4" stroke="#080808" strokeWidth="1.5"/>
              <path d="M8 9v6" stroke="#080808" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="font-display font-bold text-base text-white tracking-tight">
            InteriorAR
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              {/* Projects dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProjects(!showProjects)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200
                    ${isProjectsActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Projects
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showProjects ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProjects && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-52
                                  bg-gray-900 border border-gray-700 rounded-2xl shadow-card
                                  py-2 animate-slide-down overflow-hidden z-50">
                    <div className="px-3 pb-2 mb-1 border-b border-gray-800">
                      <p className="text-xs text-gray-600 font-mono uppercase tracking-wider">Design tools</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setShowProjects(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300
                                 hover:text-white hover:bg-gray-800 transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-sm">🛋️</span>
                      Room Designer
                    </Link>
                    <Link to="/houses" onClick={() => setShowProjects(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300
                                 hover:text-white hover:bg-gray-800 transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-sm">🏡</span>
                      House Designer
                    </Link>
                  </div>
                )}
              </div>

              <NavLink to="/profile" active={location.pathname === '/profile'}>
                {user.name?.split(' ')[0]}
              </NavLink>

              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-white transition-colors duration-200"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" active={location.pathname === '/login'}>Sign in</NavLink>
              <Link to="/register" className="btn-primary text-xs px-4 py-2">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5
                     text-gray-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-px bg-current transition-all duration-300
            ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300
            ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-px bg-current transition-all duration-300
            ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300
        ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 px-5 py-4 flex flex-col gap-1">
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-gray-300 hover:text-white hover:bg-gray-800 text-sm transition-colors">
                <span>🛋️</span> Room Designer
              </Link>
              <Link to="/houses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-gray-300 hover:text-white hover:bg-gray-800 text-sm transition-colors">
                <span>🏡</span> House Designer
              </Link>
              <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-gray-300 hover:text-white hover:bg-gray-800 text-sm transition-colors">
                <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </span>
                {user.name}
              </Link>
              <div className="divider my-2" />
              <button onClick={handleLogout}
                className="text-left px-3 py-2.5 text-sm text-gray-500 hover:text-red-400 transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2.5 rounded-xl text-gray-300 hover:text-white
                hover:bg-gray-800 text-sm transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-center mt-1">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
