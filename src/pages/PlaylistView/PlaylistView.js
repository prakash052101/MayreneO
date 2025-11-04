import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../contexts/PlaylistContext';
import { usePlayer } from '../../contexts/PlayerContext';
import './PlaylistView.css';
import Playlist from '../../Components/Playlist/Playlist';
import PlaylistModal from '../../Components/PlaylistModal/PlaylistModal';

const PlaylistView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getPlaylistById, updatePlaylist, removeTrackFromPlaylist, reorderPlaylistTracks } = usePlaylist();
  const { playQueue } = usePlayer();
  
  const [playlist, setPlaylist] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we should open edit modal from URL params
  useEffect(() => {
    const editMode = searchParams.get('edit');
    if (editMode === 'true') {
      setShowEditModal(true);
    }
  }, [searchParams]);

  // Load playlist data
  useEffect(() => {
    if (id) {
      const playlistData = getPlaylistById(id);
      setPlaylist(playlistData);
      setIsLoading(false);
    }
  }, [id, getPlaylistById]);

  const handleNameChange = (newName) => {
    if (playlist) {
      updatePlaylist(playlist.id, { name: newName });
      setPlaylist(prev => ({ ...prev, name: newName }));
    }
  };

  const handleDescriptionChange = (newDescription) => {
    if (playlist) {
      updatePlaylist(playlist.id, { description: newDescription });
      setPlaylist(prev => ({ ...prev, description: newDescription }));
    }
  };

  const handleRemoveTrack = (track, index) => {
    if (playlist) {
      removeTrackFromPlaylist(playlist.id, index);
      // Update local state to reflect the change immediately
      setPlaylist(prev => ({
        ...prev,
        tracks: prev.tracks.filter((_, i) => i !== index),
        trackCount: prev.tracks.length - 1
      }));
    }
  };

  const handleReorderTracks = (fromIndex, toIndex) => {
    if (playlist) {
      reorderPlaylistTracks(playlist.id, fromIndex, toIndex);
      // Update local state to reflect the change immediately
      const newTracks = [...playlist.tracks];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);
      setPlaylist(prev => ({ ...prev, tracks: newTracks }));
    }
  };

  const handleSavePlaylist = () => {
    // TODO: Implement Spotify save functionality
    console.log('Save playlist to Spotify:', playlist);
  };

  const handlePlayPlaylist = () => {
    if (playlist && playlist.tracks.length > 0) {
      playQueue(playlist.tracks, 0);
    }
  };

  const handleEditPlaylist = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    // Remove edit param from URL
    navigate(`/playlist/${id}`, { replace: true });
  };

  const generatePlaylistArtwork = () => {
    const trackCovers = playlist?.tracks
      ?.slice(0, 4)
      .map(track => track.album?.images?.[0]?.url || track.artwork?.medium)
      .filter(Boolean);

    if (trackCovers && trackCovers.length > 0) {
      return (
        <div className="playlist-view__artwork-mosaic">
          {trackCovers.map((cover, index) => (
            <div 
              key={index}
              className="playlist-view__artwork-tile"
              style={{ backgroundImage: `url(${cover})` }}
            />
          ))}
          {Array.from({ length: 4 - trackCovers.length }).map((_, index) => (
            <div 
              key={`default-${index}`}
              className="playlist-view__artwork-tile playlist-view__artwork-tile--default"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="playlist-view__artwork-default">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
        </svg>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="playlist-view">
        <div className="playlist-view__loading">
          <div className="playlist-view__loading-spinner">
            <svg width="32" height="32" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <p>Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-view">
        <div className="playlist-view__error">
          <div className="playlist-view__error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2>Playlist not found</h2>
          <p>The playlist you're looking for doesn't exist or has been deleted.</p>
          <button 
            className="playlist-view__back-button"
            onClick={() => navigate('/library')}
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-view">
      <div className="playlist-view__header">
        <div className="playlist-view__image">
          {generatePlaylistArtwork()}
        </div>
        <div className="playlist-view__info">
          <span className="playlist-view__type">Playlist</span>
          <h1 className="playlist-view__title">{playlist.name}</h1>
          {playlist.description && (
            <p className="playlist-view__description">{playlist.description}</p>
          )}
          <div className="playlist-view__meta">
            <span>{playlist.trackCount || 0} {playlist.trackCount === 1 ? 'song' : 'songs'}</span>
            {playlist.duration && playlist.duration !== '0m' && (
              <>
                <span>•</span>
                <span>{playlist.duration}</span>
              </>
            )}
            <span>•</span>
            <span className={`playlist-view__visibility ${playlist.isPublic ? 'public' : 'private'}`}>
              {playlist.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      </div>

      <div className="playlist-view__actions">
        <button 
          className="playlist-view__play-button"
          onClick={handlePlayPlaylist}
          disabled={!playlist.tracks || playlist.tracks.length === 0}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Play
        </button>
        <button 
          className="playlist-view__action-button"
          onClick={handleEditPlaylist}
          title="Edit playlist"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button 
          className="playlist-view__action-button"
          title="More options"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>

      <div className="playlist-view__content">
        <Playlist
          playlistTracks={playlist.tracks || []}
          playlistName={playlist.name}
          playlistDescription={playlist.description}
          onNameChange={handleNameChange}
          onDescriptionChange={handleDescriptionChange}
          onRemove={handleRemoveTrack}
          onReorder={handleReorderTracks}
          onSave={handleSavePlaylist}
          showMetadata={false} // Header already shows metadata
          showBulkActions={true}
          showPlayButton={true}
        />
      </div>

      <PlaylistModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        playlist={playlist}
        mode="edit"
      />
    </div>
  );
};

export default PlaylistView;