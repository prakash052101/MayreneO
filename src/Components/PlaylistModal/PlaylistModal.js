import React, { useState, useEffect } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';
import './PlaylistModal.css';

const PlaylistModal = ({ 
  isOpen, 
  onClose, 
  playlist = null, // null for create, playlist object for edit
  mode = 'create' // 'create' or 'edit'
}) => {
  const { createPlaylist, updatePlaylist } = usePlaylist();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens or playlist changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && playlist) {
        setFormData({
          name: playlist.name || '',
          description: playlist.description || '',
          isPublic: playlist.isPublic || false
        });
      } else {
        setFormData({
          name: '',
          description: '',
          isPublic: false
        });
      }
      setErrors({});
    }
  }, [isOpen, playlist, mode]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Playlist name is required';
    } else if (formData.name.trim().length < 1) {
      newErrors.name = 'Playlist name must be at least 1 character';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Playlist name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'Description must be less than 300 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const playlistData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPublic: formData.isPublic
      };
      
      if (mode === 'create') {
        createPlaylist(playlistData);
      } else if (mode === 'edit' && playlist) {
        updatePlaylist(playlist.id, playlistData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving playlist:', error);
      setErrors({ submit: 'Failed to save playlist. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="playlist-modal__backdrop" onClick={handleBackdropClick}>
      <div className="playlist-modal">
        <div className="playlist-modal__header">
          <h2 className="playlist-modal__title">
            {mode === 'create' ? 'Create Playlist' : 'Edit Playlist'}
          </h2>
          <button 
            className="playlist-modal__close"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form className="playlist-modal__form" onSubmit={handleSubmit}>
          <div className="playlist-modal__field">
            <label htmlFor="playlist-name" className="playlist-modal__label">
              Playlist Name *
            </label>
            <input
              id="playlist-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`playlist-modal__input ${errors.name ? 'playlist-modal__input--error' : ''}`}
              placeholder="Enter playlist name"
              maxLength={100}
              disabled={isLoading}
              autoFocus
            />
            {errors.name && (
              <span className="playlist-modal__error">{errors.name}</span>
            )}
          </div>

          <div className="playlist-modal__field">
            <label htmlFor="playlist-description" className="playlist-modal__label">
              Description
            </label>
            <textarea
              id="playlist-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`playlist-modal__textarea ${errors.description ? 'playlist-modal__input--error' : ''}`}
              placeholder="Add a description (optional)"
              rows={3}
              maxLength={300}
              disabled={isLoading}
            />
            <div className="playlist-modal__char-count">
              {formData.description.length}/300
            </div>
            {errors.description && (
              <span className="playlist-modal__error">{errors.description}</span>
            )}
          </div>

          <div className="playlist-modal__field">
            <label className="playlist-modal__checkbox-label">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="playlist-modal__checkbox"
                disabled={isLoading}
              />
              <span className="playlist-modal__checkbox-text">
                Make playlist public
              </span>
            </label>
            <p className="playlist-modal__help-text">
              Public playlists can be seen by other users
            </p>
          </div>

          {errors.submit && (
            <div className="playlist-modal__error playlist-modal__error--submit">
              {errors.submit}
            </div>
          )}

          <div className="playlist-modal__actions">
            <button
              type="button"
              className="playlist-modal__button playlist-modal__button--secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="playlist-modal__button playlist-modal__button--primary"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="playlist-modal__spinner" width="16" height="16" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create Playlist' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaylistModal;