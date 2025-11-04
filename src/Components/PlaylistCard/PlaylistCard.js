import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../contexts/PlaylistContext';
import './PlaylistCard.css';

const PlaylistCard = ({ 
  playlist, 
  onClick, 
  showActions = true,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const navigate = useNavigate();
  const { deletePlaylist, duplicatePlaylist } = usePlaylist();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(playlist);
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        // Navigate to playlist edit mode
        navigate(`/playlist/${playlist.id}?edit=true`);
        break;
      case 'duplicate':
        setIsLoading(true);
        duplicatePlaylist(playlist.id);
        setIsLoading(false);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
          setIsLoading(true);
          deletePlaylist(playlist.id);
          setIsLoading(false);
        }
        break;
      case 'share':
        // TODO: Implement sharing functionality
        console.log('Share playlist:', playlist.id);
        break;
      default:
        break;
    }
  };

  const generatePlaylistArtwork = () => {
    // Generate a mosaic from track covers or use default
    const trackCovers = playlist.tracks
      ?.slice(0, 4)
      .map(track => track.album?.images?.[0]?.url || track.artwork?.medium)
      .filter(Boolean);

    if (trackCovers && trackCovers.length > 0) {
      return (
        <div className="playlist-card__artwork-mosaic">
          {trackCovers.map((cover, index) => (
            <div 
              key={index}
              className="playlist-card__artwork-tile"
              style={{ backgroundImage: `url(${cover})` }}
            />
          ))}
          {/* Fill remaining slots with default */}
          {Array.from({ length: 4 - trackCovers.length }).map((_, index) => (
            <div 
              key={`default-${index}`}
              className="playlist-card__artwork-tile playlist-card__artwork-tile--default"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
            </div>
          ))}
        </div>
      );
    }

    // Default artwork for empty playlists
    return (
      <div className="playlist-card__artwork-default">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
        </svg>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      className={`playlist-card playlist-card--${size} card-interactive hover-lift transition-all glow-on-hover ${isLoading ? 'playlist-card--loading' : ''}`}
      onClick={handleCardClick}
    >
      <div className="playlist-card__artwork">
        {generatePlaylistArtwork()}
        
        {/* Play button overlay */}
        <div className="playlist-card__play-overlay">
          <button 
            className="playlist-card__play-button"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement play playlist functionality
              console.log('Play playlist:', playlist.id);
            }}
            aria-label={`Play ${playlist.name}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="playlist-card__content">
        <div className="playlist-card__header">
          <h3 className="playlist-card__title" title={playlist.name}>
            {playlist.name}
          </h3>
          
          {showActions && (
            <div className="playlist-card__menu">
              <button 
                className="playlist-card__menu-button"
                onClick={handleMenuToggle}
                aria-label="Playlist options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              
              {showMenu && (
                <div className="playlist-card__menu-dropdown">
                  <button onClick={(e) => handleMenuAction('edit', e)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Edit
                  </button>
                  <button onClick={(e) => handleMenuAction('duplicate', e)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Duplicate
                  </button>
                  <button onClick={(e) => handleMenuAction('share', e)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    Share
                  </button>
                  {playlist.id !== 'liked-songs' && (
                    <button 
                      onClick={(e) => handleMenuAction('delete', e)}
                      className="playlist-card__menu-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {playlist.description && (
          <p className="playlist-card__description" title={playlist.description}>
            {playlist.description}
          </p>
        )}

        <div className="playlist-card__meta">
          <span className="playlist-card__track-count">
            {playlist.trackCount || 0} {playlist.trackCount === 1 ? 'song' : 'songs'}
          </span>
          {playlist.duration && playlist.duration !== '0m' && (
            <>
              <span className="playlist-card__separator">•</span>
              <span className="playlist-card__duration">{playlist.duration}</span>
            </>
          )}
        </div>

        <div className="playlist-card__footer">
          <div className="playlist-card__badges">
            {playlist.isPublic ? (
              <span className="playlist-card__badge playlist-card__badge--public">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Public
              </span>
            ) : (
              <span className="playlist-card__badge playlist-card__badge--private">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                Private
              </span>
            )}
          </div>
          
          {playlist.updatedAt && (
            <span className="playlist-card__date">
              Updated {formatDate(playlist.updatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="playlist-card__menu-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default PlaylistCard;