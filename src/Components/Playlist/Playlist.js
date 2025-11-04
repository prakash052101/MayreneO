import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import "./Playlist.css";
import Track from "../Track/Track";

const DraggableTrack = ({ track, index, onRemove, onReorder, isSelected, onSelect, showPlayButton, trackList }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'track',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'track',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        onReorder(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(index, e.ctrlKey || e.metaKey);
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`playlist__track-item ${isDragging ? 'playlist__track-item--dragging' : ''} ${isSelected ? 'playlist__track-item--selected' : ''}`}
      onClick={handleSelect}
    >
      <div className="playlist__track-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(index, e.ctrlKey || e.metaKey)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="playlist__track-index">
        {index + 1}
      </div>
      <div className="playlist__track-content">
        <Track
          track={track}
          isRemoval={true}
          onRemove={() => onRemove(track, index)}
          showPlayButton={showPlayButton}
          trackList={trackList}
        />
      </div>
    </div>
  );
};

const PlayList = ({ 
  playlistTracks = [], 
  playlistName = 'New Playlist',
  playlistDescription = '',
  onNameChange, 
  onDescriptionChange,
  onRemove, 
  onSave,
  onReorder,
  showMetadata = true,
  showBulkActions = true,
  showPlayButton = true
}) => {
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [tracks, setTracks] = useState(playlistTracks);

  useEffect(() => {
    setTracks(playlistTracks);
  }, [playlistTracks]);

  const handleNameChange = (event) => {
    if (onNameChange) {
      onNameChange(event.target.value);
    }
  };

  const handleDescriptionChange = (event) => {
    if (onDescriptionChange) {
      onDescriptionChange(event.target.value);
    }
  };

  const handleTrackSelect = (index, isMultiSelect = false) => {
    setSelectedTracks(prev => {
      const newSelected = new Set(prev);
      
      if (isMultiSelect) {
        if (newSelected.has(index)) {
          newSelected.delete(index);
        } else {
          newSelected.add(index);
        }
      } else {
        if (newSelected.has(index) && newSelected.size === 1) {
          newSelected.clear();
        } else {
          newSelected.clear();
          newSelected.add(index);
        }
      }
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(tracks.map((_, index) => index)));
    }
  };

  const handleBulkRemove = () => {
    const indicesToRemove = Array.from(selectedTracks).sort((a, b) => b - a);
    indicesToRemove.forEach(index => {
      if (onRemove) {
        onRemove(tracks[index], index);
      }
    });
    setSelectedTracks(new Set());
  };

  const handleReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const newTracks = [...tracks];
    const [movedTrack] = newTracks.splice(fromIndex, 1);
    newTracks.splice(toIndex, 0, movedTrack);
    
    setTracks(newTracks);
    
    if (onReorder) {
      onReorder(fromIndex, toIndex);
    }

    // Update selected indices after reordering
    setSelectedTracks(prev => {
      const newSelected = new Set();
      prev.forEach(selectedIndex => {
        let newIndex = selectedIndex;
        if (selectedIndex === fromIndex) {
          newIndex = toIndex;
        } else if (selectedIndex > fromIndex && selectedIndex <= toIndex) {
          newIndex = selectedIndex - 1;
        } else if (selectedIndex < fromIndex && selectedIndex >= toIndex) {
          newIndex = selectedIndex + 1;
        }
        newSelected.add(newIndex);
      });
      return newSelected;
    });
  };

  const calculateDuration = () => {
    const totalMs = tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
    const minutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="Playlist">
        <div className="playlist__header">
          <div className="playlist__title-section">
            <input 
              className="playlist__name-input"
              onChange={handleNameChange}
              defaultValue={playlistName}
              placeholder="Playlist name"
            />
            {onDescriptionChange && (
              <textarea
                className="playlist__description-input"
                onChange={handleDescriptionChange}
                defaultValue={playlistDescription}
                placeholder="Add a description"
                rows="2"
              />
            )}
          </div>

          {showMetadata && (
            <div className="playlist__metadata">
              <span className="playlist__track-count">
                {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
              </span>
              {tracks.length > 0 && (
                <>
                  <span className="playlist__separator">•</span>
                  <span className="playlist__duration">{calculateDuration()}</span>
                </>
              )}
            </div>
          )}

          {showBulkActions && tracks.length > 0 && (
            <div className="playlist__bulk-actions">
              <button 
                className="playlist__bulk-select"
                onClick={handleSelectAll}
              >
                {selectedTracks.size === tracks.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedTracks.size > 0 && (
                <button 
                  className="playlist__bulk-remove"
                  onClick={handleBulkRemove}
                >
                  Remove Selected ({selectedTracks.size})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="playlist__content">
          {tracks.length === 0 ? (
            <div className="playlist__empty">
              <div className="playlist__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              </div>
              <h3>No songs in this playlist</h3>
              <p>Search for songs and add them to this playlist</p>
            </div>
          ) : (
            <div className="playlist__track-list">
              {tracks.map((track, index) => (
                <DraggableTrack
                  key={`${track.id}-${index}`}
                  track={track}
                  index={index}
                  onRemove={onRemove}
                  onReorder={handleReorder}
                  isSelected={selectedTracks.has(index)}
                  onSelect={handleTrackSelect}
                  showPlayButton={showPlayButton}
                  trackList={tracks}
                />
              ))}
            </div>
          )}
        </div>

        {onSave && (
          <div className="playlist__actions">
            <button className="Playlist-save" onClick={onSave}> 
              Save to Spotify
            </button>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default PlayList;