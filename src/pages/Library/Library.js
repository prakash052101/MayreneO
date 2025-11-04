import React, { useState } from 'react';
import { usePlaylist } from '../../contexts/PlaylistContext';
import PlaylistCard from '../../Components/PlaylistCard/PlaylistCard';
import PlaylistModal from '../../Components/PlaylistModal/PlaylistModal';
import './Library.css';

const Library = () => {
  const { playlists, isLoading, error } = usePlaylist();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'name', 'tracks'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'public', 'private'

  const handleCreatePlaylist = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  // Filter and sort playlists
  const filteredAndSortedPlaylists = React.useMemo(() => {
    let filtered = [...playlists];

    // Apply filters
    if (filterBy === 'public') {
      filtered = filtered.filter(playlist => playlist.isPublic);
    } else if (filterBy === 'private') {
      filtered = filtered.filter(playlist => !playlist.isPublic);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'tracks':
          return (b.trackCount || 0) - (a.trackCount || 0);
        case 'updated':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    return filtered;
  }, [playlists, filterBy, sortBy]);

  if (isLoading) {
    return (
      <div className="library">
        <div className="library__loading">
          <div className="library__loading-spinner">
            <svg width="32" height="32" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <p>Loading your library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library">
        <div className="library__error">
          <div className="library__error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button 
            className="library__retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="library">
      <div className="library__header animate-fade-in-up">
        <div className="library__title-section">
          <h1 className="library__title text-gradient">Your Library</h1>
          <p className="library__subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
          </p>
        </div>
        
        <div className="library__actions">
          <button 
            className="library__create-button hover-lift transition-all"
            onClick={handleCreatePlaylist}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Playlist
          </button>
        </div>
      </div>

      <div className="library__controls">
        <div className="library__filters">
          <select 
            className="library__filter-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All Playlists</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          <select 
            className="library__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="name">Name (A-Z)</option>
            <option value="tracks">Most Songs</option>
          </select>
        </div>

        <div className="library__view-controls">
          <button 
            className={`library__view-button ${viewMode === 'grid' ? 'library__view-button--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
            </svg>
          </button>
          <button 
            className={`library__view-button ${viewMode === 'list' ? 'library__view-button--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="library__content">
        {filteredAndSortedPlaylists.length === 0 ? (
          <div className="library__empty">
            <div className="library__empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
            </div>
            <h2>
              {playlists.length === 0 
                ? 'No playlists yet' 
                : `No ${filterBy} playlists`
              }
            </h2>
            <p>
              {playlists.length === 0 
                ? 'Create your first playlist to get started'
                : `Try changing your filter to see more playlists`
              }
            </p>
            {playlists.length === 0 && (
              <button 
                className="library__empty-button"
                onClick={handleCreatePlaylist}
              >
                Create Playlist
              </button>
            )}
          </div>
        ) : (
          <div className={`library__playlists library__playlists--${viewMode} stagger-children animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
            {filteredAndSortedPlaylists.map((playlist, index) => (
              <div key={playlist.id} style={{ '--index': index }} className="animate-fade-in-up">
                <PlaylistCard
                  playlist={playlist}
                  size={viewMode === 'list' ? 'small' : 'medium'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <PlaylistModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        mode="create"
      />
    </div>
  );
};

export default Library;