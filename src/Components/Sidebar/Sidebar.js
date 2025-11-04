import React, { forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { preloadOnHover } from '../LazyRoutes';
import './Sidebar.css';

const Sidebar = forwardRef(({ isOpen, isMobile, onClose }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
      path: '/'
    },
    {
      id: 'search',
      label: 'Search',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      ),
      path: '/search'
    },
    {
      id: 'library',
      label: 'Your Library',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
        </svg>
      ),
      path: '/library'
    }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      <aside 
        id="sidebar-navigation"
        ref={ref}
        className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${isMobile ? 'sidebar--mobile' : 'sidebar--desktop'}`}
        role="navigation"
        aria-label="Main navigation"
        tabIndex="-1"
      >
        <div className="sidebar__content">
          {/* Navigation Section */}
          <nav className="sidebar__nav">
            <ul className="sidebar__nav-list">
              {navigationItems.map((item) => (
                <li key={item.id} className="sidebar__nav-item">
                  <button
                    className={`sidebar__nav-link transition-all hover-lift ${location.pathname === item.path ? 'sidebar__nav-link--active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                    onMouseEnter={() => preloadOnHover(item.id)}
                    aria-label={item.label}
                  >
                    <span className="sidebar__nav-icon">
                      {item.icon}
                    </span>
                    <span className="sidebar__nav-text">
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Divider */}
          <div className="sidebar__divider"></div>

          {/* Playlists Section */}
          <div className="sidebar__section">
            <div className="sidebar__section-header">
              <h3 className="sidebar__section-title">Playlists</h3>
              <button 
                className="sidebar__create-button hover-scale transition-transform"
                aria-label="Create new playlist"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            </div>
            
            <ul className="sidebar__playlist-list">
              <li className="sidebar__playlist-item">
                <button 
                  className={`sidebar__playlist-link transition-all hover-lift ${location.pathname === '/playlist/1' ? 'sidebar__playlist-link--active' : ''}`}
                  onClick={() => handlePlaylistClick('1')}
                >
                  <span className="sidebar__playlist-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                    </svg>
                  </span>
                  <span className="sidebar__playlist-text">My Playlist #1</span>
                </button>
              </li>
              <li className="sidebar__playlist-item">
                <button 
                  className={`sidebar__playlist-link ${location.pathname === '/playlist/2' ? 'sidebar__playlist-link--active' : ''}`}
                  onClick={() => handlePlaylistClick('2')}
                >
                  <span className="sidebar__playlist-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                    </svg>
                  </span>
                  <span className="sidebar__playlist-text">Favorites</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;