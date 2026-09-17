import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './AppLayout.css';

// Navigation grouped by what the person is trying to do, not by a
// numbered sequence. The old "Waypoint 01..09" rail implied the app was
// a linear trail you walk once; in practice people move between these
// freely, and the numbering made late items look optional.
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'home' }],
  },
  {
    label: 'Your evidence',
    items: [
      { to: '/profile', label: 'Profile', icon: 'user' },
      { to: '/resume', label: 'Resume', icon: 'document' },
      { to: '/skills', label: 'Skill assessments', icon: 'check' },
    ],
  },
  {
    label: 'Direction',
    items: [
      { to: '/recommendations', label: 'Recommendations', icon: 'target' },
      { to: '/careers', label: 'Explore careers', icon: 'compass' },
      { to: '/compare', label: 'Compare careers', icon: 'columns' },
      { to: '/game', label: 'Career simulator', icon: 'play' },
    ],
  },
  {
    label: 'Market',
    items: [
      { to: '/jobs', label: 'Job market', icon: 'chart' },
      { to: '/analytics', label: 'Your activity', icon: 'activity' },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const closeButtonRef = useRef(null);

  const groups = user?.role === 'admin'
    ? [...NAV_GROUPS, { label: 'Administration', items: [{ to: '/admin', label: 'Admin', icon: 'shield' }] }]
    : NAV_GROUPS;

  // Close the mobile drawer on navigation, so tapping a link doesn't
  // leave the overlay covering the page you just opened.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer — expected of anything modal.
  useEffect(() => {
    if (!navOpen) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') setNavOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>

      {/* Mobile-only bar; the sidebar itself becomes a drawer below 900px. */}
      <header className="topbar">
        <button
          type="button"
          className="topbar-toggle"
          onClick={() => setNavOpen(true)}
          aria-expanded={navOpen}
          aria-controls="app-nav"
        >
          <Icon name="menu" />
          <span className="visually-hidden">Open navigation</span>
        </button>
        <span className="topbar-brand">Career Guidance</span>
      </header>

      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      <nav
        id="app-nav"
        className={`sidebar${navOpen ? ' sidebar-open' : ''}`}
        aria-label="Main"
      >
        <div className="sidebar-head">
          <span className="sidebar-brand">Career Guidance</span>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setNavOpen(false)}
            ref={closeButtonRef}
          >
            <Icon name="close" />
            <span className="visually-hidden">Close navigation</span>
          </button>
        </div>

        <div className="sidebar-scroll">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <h2 className="nav-group-label">{group.label}</h2>
              <ul className="nav-list">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
                    >
                      <Icon name={item.icon} className="nav-icon" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="sidebar-foot">
          <div className="account">
            <span className="avatar" aria-hidden="true">
              {(user?.username || '?').charAt(0).toUpperCase()}
            </span>
            <span className="account-text">
              <span className="account-name">{user?.username}</span>
              <span className="account-email">{user?.email}</span>
            </span>
          </div>
          <button type="button" className="btn btn-secondary btn-block btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <main id="main" className="content" tabIndex={-1}>
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
