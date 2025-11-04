import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import SearchBar from '../SearchBar/SearchBar';
import ProfileModal from '../ProfileModal/ProfileModal';
import SettingsModal from '../SettingsModal/SettingsModal';

const Header = ({ onToggleSidebar, isMobile, onSearch, currentQuery = '' }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const location = useLocation();
  
  // Show search bar on mobile only when on search page
  const showSearchOnMobile = isMobile && location.pathname === '/search';

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
  };
  return (
    <header className="header">
      <div className="header__left">
        {isMobile && (
          <button 
            className="header__menu-button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <span className="header__menu-icon"></span>
            <span className="header__menu-icon"></span>
            <span className="header__menu-icon"></span>
          </button>
        )}
        
        <div className="header__brand">
          <h1 className="header__logo">
            <a href="/" className="header__logo-link">
              MayreneO
            </a>
          </h1>
        </div>
      </div>

      <div className="header__center">
        {(!isMobile || showSearchOnMobile) && (
          <div className="header__search">
            <SearchBar onSearch={onSearch} variant="header" initialValue={currentQuery} />
          </div>
        )}
      </div>

      <div className="header__right">
        <nav className="header__nav">
          {!isMobile && (
            <>
              <button 
                className="header__nav-button" 
                onClick={handleProfileClick}
                aria-label="User profile"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </button>
              
              <button 
                className="header__nav-button" 
                onClick={handleSettingsClick}
                aria-label="Settings"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={closeProfileModal} 
      />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={closeSettingsModal} 
      />
    </header>
  );
};

export default Header;