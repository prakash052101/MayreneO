import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import audioManager from '../../util/AudioManager';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
import LiveRegion from '../LiveRegion/LiveRegion';
import './Player.css';

const Player = () => {
  const {
    currentTrack,
    isPlaying,
    queue,
    volume,
    repeatMode,
    isShuffled,
    isLoading,
    togglePlayPause,
    next,
    previous,
    setVolume,
    setRepeatMode,
    setShuffle
  } = usePlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isBuffering, setIsBuffering] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Keyboard shortcuts for player controls
  const playerShortcuts = {
    'space': () => {
      // Only handle spacebar if not focused on an input or button
      if (!['INPUT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        togglePlayPause();
      }
    },
    'ctrl+left': () => previous(),
    'ctrl+right': () => next(),
    'ctrl+up': () => {
      const newVolume = Math.min(1, volume + 0.1);
      setVolume(newVolume);
      audioManager.setVolume(newVolume);
    },
    'ctrl+down': () => {
      const newVolume = Math.max(0, volume - 0.1);
      setVolume(newVolume);
      audioManager.setVolume(newVolume);
    },
    'ctrl+m': () => handleMuteToggle(),
    'ctrl+r': () => handleRepeatToggle(),
    'ctrl+s': () => handleShuffleToggle()
  };

  // Initialize keyboard navigation
  useKeyboardNavigation({
    enabled: true,
    shortcuts: playerShortcuts
  });

  // Format time in MM:SS format
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar seek
  const handleSeek = (e) => {
    if (!duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioManager.setCurrentTime(newTime);
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
    
    // Unmute if volume is changed from 0
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute
      setVolume(previousVolume);
      audioManager.setVolume(previousVolume);
      setIsMuted(false);
      setStatusMessage('Volume unmuted');
    } else {
      // Mute
      setPreviousVolume(volume);
      setVolume(0);
      audioManager.setVolume(0);
      setIsMuted(true);
      setStatusMessage('Volume muted');
    }
  };

  // Handle repeat mode toggle
  const handleRepeatToggle = () => {
    const modes = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    setStatusMessage(`Repeat mode: ${nextMode}`);
  };

  // Handle shuffle toggle
  const handleShuffleToggle = () => {
    setShuffle(!isShuffled);
    setStatusMessage(`Shuffle ${!isShuffled ? 'enabled' : 'disabled'}`);
  };

  // Initialize audio manager and set up event listeners
  useEffect(() => {
    audioManager.init();

    const handleTimeUpdate = (data) => {
      setCurrentTime(data.currentTime);
      setDuration(data.duration);
    };

    const handleLoadedData = (data) => {
      setDuration(data.duration);
      setIsBuffering(false);
    };

    const handleLoadStart = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlayThrough = () => {
      setIsBuffering(false);
    };

    const handleEnded = () => {
      next();
    };

    const handleError = (data) => {
      console.error('Audio playback error:', data.message);
      setIsBuffering(false);
      setStatusMessage(`Playback error: ${data.message}`);
    };

    const handleNoPreview = (data) => {
      console.warn('No preview available:', data.message);
      setIsBuffering(false);
      setStatusMessage(`No preview available for "${data.track?.name || 'this track'}". This is common with Spotify's API.`);
      // Don't auto-skip, let user decide what to do
    };

    // Add event listeners
    audioManager.on('timeupdate', handleTimeUpdate);
    audioManager.on('loadeddata', handleLoadedData);
    audioManager.on('loadstart', handleLoadStart);
    audioManager.on('canplay', handleCanPlay);
    audioManager.on('waiting', handleWaiting);
    audioManager.on('canplaythrough', handleCanPlayThrough);
    audioManager.on('ended', handleEnded);
    audioManager.on('error', handleError);
    audioManager.on('nopreview', handleNoPreview);

    return () => {
      // Remove event listeners
      audioManager.off('timeupdate', handleTimeUpdate);
      audioManager.off('loadeddata', handleLoadedData);
      audioManager.off('loadstart', handleLoadStart);
      audioManager.off('canplay', handleCanPlay);
      audioManager.off('waiting', handleWaiting);
      audioManager.off('canplaythrough', handleCanPlayThrough);
      audioManager.off('ended', handleEnded);
      audioManager.off('error', handleError);
      audioManager.off('nopreview', handleNoPreview);
    };
  }, [next]);

  // Handle track changes
  useEffect(() => {
    if (currentTrack) {
      audioManager.loadTrack(currentTrack);
      setStatusMessage(`Now playing: ${currentTrack.name} by ${currentTrack.artists?.[0]?.name || currentTrack.artist}`);
    }
  }, [currentTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying) {
      audioManager.play();
    } else {
      audioManager.pause();
    }
  }, [isPlaying]);

  // Set volume on audio manager
  useEffect(() => {
    audioManager.setVolume(volume);
  }, [volume]);

  if (!currentTrack) {
    return (
      <div 
        id="player-controls"
        className="player player--empty"
        role="region"
        aria-label="Music player controls"
        tabIndex="-1"
      >
        <div className="player__message" role="status">
          <span>Select a track to start playing</span>
        </div>
      </div>
    );
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
  const volumePercentage = isMuted ? 0 : volume * 100;

  return (
    <div 
      id="player-controls"
      className={`player animate-slide-up ${isLoading || isBuffering ? 'player--loading' : ''}`}
      role="region"
      aria-label="Music player controls"
      tabIndex="-1"
    >
      
      {/* Track Information */}
      <div className="player__track-info">
        <div className="player__artwork">
          {currentTrack.album?.images?.[0]?.url ? (
            <img 
              src={currentTrack.album.images[0].url} 
              alt={`Album artwork for ${currentTrack.album.name}`}
              className="player__artwork-image"
            />
          ) : (
            <div 
              className="player__artwork-placeholder"
              role="img"
              aria-label="No album artwork available"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="player__track-details">
          <div className="player__track-name" title={currentTrack.name}>
            {currentTrack.name}
          </div>
          <div className="player__track-artist" title={currentTrack.artists?.[0]?.name || currentTrack.artist}>
            {currentTrack.artists?.[0]?.name || currentTrack.artist}
          </div>
          {!currentTrack.preview_url && (
            <div className="player__no-preview-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              No preview available
            </div>
          )}
        </div>
      </div>

      {/* Player Controls */}
      <div className="player__controls">
        <div className="player__control-buttons">
          <button 
            className={`player__control-btn player__control-btn--shuffle ${isShuffled ? 'player__control-btn--active' : ''}`}
            onClick={handleShuffleToggle}
            aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
            title={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          <button 
            className="player__control-btn player__control-btn--previous"
            onClick={previous}
            disabled={queue.length === 0}
            aria-label="Previous track"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button 
            className="player__control-btn player__control-btn--play-pause hover-scale transition-transform"
            onClick={togglePlayPause}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <div className="player__loading-spinner animate-spin">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                </svg>
              </div>
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="animate-scale-in">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="animate-scale-in">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button 
            className="player__control-btn player__control-btn--next"
            onClick={next}
            disabled={queue.length === 0}
            aria-label="Next track"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>

          <button 
            className={`player__control-btn player__control-btn--repeat ${repeatMode !== 'off' ? 'player__control-btn--active' : ''}`}
            onClick={handleRepeatToggle}
            aria-label={`Repeat: ${repeatMode}`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,7H17V10L21,6L17,2V5H5V11H7V7M17,17H7V14L3,18L7,22V19H19V13H17V17M13,15.5V9.5L11.5,9.5V11H10V12.5H11.5V15.5H13Z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,7H17V10L21,6L17,2V5H5V11H7V7M17,17H7V14L3,18L7,22V19H19V13H17V17Z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="player__progress-container">
          <span className="player__time player__time--current">
            {formatTime(currentTime)}
          </span>
          
          <div 
            className="player__progress-bar"
            onClick={handleSeek}
            role="slider"
            aria-label={`Seek slider, ${formatTime(currentTime)} of ${formatTime(duration)}`}
            aria-valuemin="0"
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            tabIndex="0"
          >
            <div className="player__progress-track">
              <div 
                className="player__progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          <span className="player__time player__time--duration">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="player__volume">
        <button 
          className="player__volume-btn"
          onClick={handleMuteToggle}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volumePercentage === 0 ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : volumePercentage < 50 ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="player__volume-slider"
          aria-label={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)}%`}
        />
      </div>
      
      {/* Live region for status announcements */}
      <LiveRegion message={statusMessage} politeness="polite" />
    </div>
  );
};

export default Player;