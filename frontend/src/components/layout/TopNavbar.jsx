import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Sliders, LogOut } from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Optimization Results', path: '/results' },
  { label: 'Scenarios', path: '/scenarios' },
  { label: 'Audit Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
];

export default function TopNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { 
    backendStatus,
    currentUser, 
    logoutUser 
  } = useScenario();
  
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close mobile menu on Escape key press and return focus to trigger
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          triggerRef.current?.focus();
        }
        if (userDropdownOpen) {
          setUserDropdownOpen(false);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, userDropdownOpen]);

  // Click outside listener for user dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-page border-b border-border-hairline transition-colors">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          
          {/* ================= ZONE 1: BRAND (LEFT) ================= */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              aria-label="ImpactOS Home"
            >
              {/* Monogram */}
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-obsidian text-page">
                <span className="font-display text-base font-semibold leading-none">I</span>
              </div>

              {/* Wordmark */}
              <div className="flex items-baseline">
                <span className="font-display text-[1.45rem] font-semibold tracking-[-0.025em] text-obsidian">
                  Impact
                </span>
                <span className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-terracotta ml-0.5">
                  OS
                </span>
              </div>
            </Link>

          </div>

          {/* ================= ZONE 2: NAVIGATION LINKS (CENTER) ================= */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Primary Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 text-[11px] font-sans tracking-[0.01em] font-medium border-b transition-colors duration-150 ${
                    isActive
                      ? 'text-burgundy border-burgundy'
                      : 'text-secondary-text border-transparent hover:text-obsidian hover:border-border-hairline'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* ================= ZONE 3: STATUS & ACTIONS (RIGHT) ================= */}
          <div className="flex items-center space-x-3">
            
            {/* User Account / Auth Dropdown */}
            {currentUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full text-charcoal hover:bg-surface-alt/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                >
                  <div className="w-7 h-7 rounded-full bg-taupe/30 border border-border-hairline flex items-center justify-center text-charcoal font-medium text-xs">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-surface rounded-panel border border-border-hairline shadow-elevated py-2 z-50 animate-in fade-in slide-in-from-top-1"
                    role="menu"
                  >
                    <div className="px-4 py-2 border-b border-border-hairline">
                      <p className="text-xs font-semibold text-obsidian truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-secondary-text truncate">{currentUser.email}</p>
                      {currentUser.isDemoAuth && (
                        <span className="inline-block mt-1 text-[10px] text-taupe-dark bg-surface-alt px-1.5 py-0.5 rounded">
                          Local Demo Session
                        </span>
                      )}
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs text-charcoal hover:bg-surface-alt transition-colors"
                      role="menuitem"
                    >
                      <Sliders className="w-3.5 h-3.5 mr-2.5 text-secondary-text" />
                      System Settings
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-xs text-status-error hover:bg-status-error-bg transition-colors text-left"
                      role="menuitem"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2.5" />
                      Sign Out (Reset Session)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs uppercase tracking-wider font-semibold text-terracotta hover:text-terracotta-hover px-3 py-1.5 rounded border border-terracotta/40 hover:border-terracotta transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Trigger (<1100px) */}
            <div className="flex lg:hidden">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-charcoal hover:bg-surface-alt/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ================= MOBILE NAVIGATION MENU (<1100px) ================= */}
      {mobileMenuOpen && (
        <div 
          id="mobile-navigation"
          ref={menuRef}
          className="lg:hidden border-t border-border-hairline bg-surface px-4 pt-3 pb-6 space-y-2 shadow-elevated"
        >
          {/* Mobile status banner */}
          <div className="flex items-center justify-between pb-3 border-b border-border-hairline text-xs">
            <span className="text-secondary-text font-medium">Environment Status:</span>
            {backendStatus.connected ? (
              <span className="text-status-success font-medium">FastAPI Connected</span>
            ) : (
              <span className="text-taupe-dark font-medium bg-surface-alt px-2 py-0.5 rounded">
                Local Demo Mode
              </span>
            )}
          </div>

          <nav className="flex flex-col space-y-1 pt-1" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-xs font-sans uppercase tracking-[0.12em] font-medium transition-colors ${
                    isActive
                      ? 'bg-burgundy text-page font-semibold'
                      : 'text-charcoal hover:bg-surface-alt'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

