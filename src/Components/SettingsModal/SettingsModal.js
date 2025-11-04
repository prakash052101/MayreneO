import React, { useState } from 'react';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoplay: true,
    notifications: true,
    highQuality: false,
    crossfade: false,
    volume: 70,
    language: 'en'
  });

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('musicPlatformSettings', JSON.stringify(settings));
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">Settings</h2>
          <button 
            className="settings-modal__close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div className="settings-modal__content">
          <div className="settings-modal__section">
            <h3 className="settings-modal__section-title">Appearance</h3>
            
            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">Theme</span>
                <select 
                  className="settings-modal__select"
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
            </div>
          </div>

          <div className="settings-modal__section">
            <h3 className="settings-modal__section-title">Playback</h3>
            
            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">Autoplay</span>
                <input 
                  type="checkbox"
                  className="settings-modal__checkbox"
                  checked={settings.autoplay}
                  onChange={(e) => handleSettingChange('autoplay', e.target.checked)}
                />
              </label>
            </div>

            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">High Quality Audio</span>
                <input 
                  type="checkbox"
                  className="settings-modal__checkbox"
                  checked={settings.highQuality}
                  onChange={(e) => handleSettingChange('highQuality', e.target.checked)}
                />
              </label>
            </div>

            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">Crossfade</span>
                <input 
                  type="checkbox"
                  className="settings-modal__checkbox"
                  checked={settings.crossfade}
                  onChange={(e) => handleSettingChange('crossfade', e.target.checked)}
                />
              </label>
            </div>

            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">Volume</span>
                <input 
                  type="range"
                  className="settings-modal__range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
                />
                <span className="settings-modal__range-value">{settings.volume}%</span>
              </label>
            </div>
          </div>

          <div className="settings-modal__section">
            <h3 className="settings-modal__section-title">Notifications</h3>
            
            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">Enable Notifications</span>
                <input 
                  type="checkbox"
                  className="settings-modal__checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="settings-modal__section">
            <h3 className="settings-modal__section-title">Language</h3>
            
            <div className="settings-modal__setting">
              <label className="settings-modal__label">
                <span className="settings-modal__label-text">Language</span>
                <select 
                  className="settings-modal__select"
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-modal__footer">
          <button 
            className="settings-modal__button settings-modal__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="settings-modal__button settings-modal__button--primary"
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;