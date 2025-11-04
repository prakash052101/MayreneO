import React from 'react';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={handleOverlayClick}>
      <div className="profile-modal">
        <div className="profile-modal__header">
          <h2 className="profile-modal__title">Profile</h2>
          <button 
            className="profile-modal__close"
            onClick={onClose}
            aria-label="Close profile"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div className="profile-modal__content">
          <div className="profile-modal__avatar">
            <div className="profile-modal__avatar-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
          
          <div className="profile-modal__info">
            <h3 className="profile-modal__name">Music Lover</h3>
            <p className="profile-modal__email">user@example.com</p>
          </div>
          
          <div className="profile-modal__stats">
            <div className="profile-modal__stat">
              <span className="profile-modal__stat-number">0</span>
              <span className="profile-modal__stat-label">Playlists</span>
            </div>
            <div className="profile-modal__stat">
              <span className="profile-modal__stat-number">0</span>
              <span className="profile-modal__stat-label">Following</span>
            </div>
            <div className="profile-modal__stat">
              <span className="profile-modal__stat-number">0</span>
              <span className="profile-modal__stat-label">Followers</span>
            </div>
          </div>
          
          <div className="profile-modal__actions">
            <button className="profile-modal__button profile-modal__button--primary">
              Edit Profile
            </button>
            <button className="profile-modal__button profile-modal__button--secondary">
              View Public Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;