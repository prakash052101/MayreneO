/**
 * AudioManager - Handles audio playback, buffering, and state management
 */
class AudioManager {
  constructor() {
    this.audio = null;
    this.currentTrack = null;
    this.isInitialized = false;
    this.listeners = new Map();
    this.loadingTimeout = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Bind methods to preserve context
    this.handleLoadStart = this.handleLoadStart.bind(this);
    this.handleCanPlay = this.handleCanPlay.bind(this);
    this.handleLoadedData = this.handleLoadedData.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleStalled = this.handleStalled.bind(this);
    this.handleWaiting = this.handleWaiting.bind(this);
    this.handleCanPlayThrough = this.handleCanPlayThrough.bind(this);
  }

  /**
   * Initialize the audio manager
   */
  init() {
    if (this.isInitialized) return;
    
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';
    
    // Add event listeners
    this.audio.addEventListener('loadstart', this.handleLoadStart);
    this.audio.addEventListener('canplay', this.handleCanPlay);
    this.audio.addEventListener('loadeddata', this.handleLoadedData);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('error', this.handleError);
    this.audio.addEventListener('stalled', this.handleStalled);
    this.audio.addEventListener('waiting', this.handleWaiting);
    this.audio.addEventListener('canplaythrough', this.handleCanPlayThrough);
    
    this.isInitialized = true;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (!this.audio) return;
    
    this.pause();
    
    // Remove event listeners
    this.audio.removeEventListener('loadstart', this.handleLoadStart);
    this.audio.removeEventListener('canplay', this.handleCanPlay);
    this.audio.removeEventListener('loadeddata', this.handleLoadedData);
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('error', this.handleError);
    this.audio.removeEventListener('stalled', this.handleStalled);
    this.audio.removeEventListener('waiting', this.handleWaiting);
    this.audio.removeEventListener('canplaythrough', this.handleCanPlayThrough);
    
    this.audio.src = '';
    this.audio = null;
    this.currentTrack = null;
    this.isInitialized = false;
    this.listeners.clear();
    
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Load a track
   */
  async loadTrack(track) {
    if (!this.isInitialized) {
      this.init();
    }

    if (!track) {
      console.warn('No track provided to loadTrack');
      return false;
    }

    // Check for preview URL
    let audioUrl = track.preview_url;
    
    if (!audioUrl) {
      console.warn('No preview URL available for track:', track?.name || 'Unknown track');
      this.emit('nopreview', { 
        message: 'Preview not available (Spotify API limitation)',
        track 
      });
      return false;
    }

    // Don't reload if it's the same track
    if (this.currentTrack && this.currentTrack.id === track.id) {
      return true;
    }

    this.currentTrack = track;
    this.retryCount = 0;
    
    try {
      this.emit('loadstart', { track });
      
      // Set loading timeout
      this.loadingTimeout = setTimeout(() => {
        this.emit('error', { 
          message: 'Track loading timeout',
          track 
        });
      }, 10000); // 10 second timeout
      
      this.audio.src = audioUrl;
      this.audio.load();
      
      return true;
    } catch (error) {
      this.emit('error', { 
        message: error.message,
        track 
      });
      return false;
    }
  }

  /**
   * Play the current track
   */
  async play() {
    if (!this.audio || !this.currentTrack) {
      return false;
    }

    try {
      await this.audio.play();
      this.emit('play', { track: this.currentTrack });
      return true;
    } catch (error) {
      this.emit('error', { 
        message: `Playback failed: ${error.message}`,
        track: this.currentTrack 
      });
      return false;
    }
  }

  /**
   * Pause the current track
   */
  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.emit('pause', { track: this.currentTrack });
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
      this.emit('volumechange', { volume: this.audio.volume });
    }
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.audio ? this.audio.volume : 0;
  }

  /**
   * Set current time
   */
  setCurrentTime(time) {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
    }
  }

  /**
   * Get current time
   */
  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  }

  /**
   * Get duration
   */
  getDuration() {
    return this.audio ? this.audio.duration : 0;
  }

  /**
   * Get buffered ranges
   */
  getBuffered() {
    if (!this.audio || !this.audio.buffered.length) {
      return [];
    }

    const buffered = [];
    for (let i = 0; i < this.audio.buffered.length; i++) {
      buffered.push({
        start: this.audio.buffered.start(i),
        end: this.audio.buffered.end(i)
      });
    }
    return buffered;
  }

  /**
   * Check if audio is playing
   */
  isPlaying() {
    return this.audio && !this.audio.paused && !this.audio.ended;
  }

  /**
   * Check if audio is loading
   */
  isLoading() {
    return this.audio && this.audio.readyState < 3;
  }

  // Event handlers
  handleLoadStart() {
    this.emit('loadstart', { track: this.currentTrack });
  }

  handleCanPlay() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    this.emit('canplay', { track: this.currentTrack });
  }

  handleLoadedData() {
    this.emit('loadeddata', { 
      track: this.currentTrack,
      duration: this.audio.duration 
    });
  }

  handleTimeUpdate() {
    this.emit('timeupdate', {
      track: this.currentTrack,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration,
      buffered: this.getBuffered()
    });
  }

  handleEnded() {
    this.emit('ended', { track: this.currentTrack });
  }

  handleError(event) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    const error = this.audio.error;
    let message = 'Unknown audio error';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          message = 'Audio playback was aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          message = 'Network error occurred while loading audio';
          break;
        case error.MEDIA_ERR_DECODE:
          message = 'Audio decoding error';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Audio format not supported';
          break;
        default:
          message = error.message || 'Audio error occurred';
      }
    }

    // Retry logic for network errors
    if (error && error.code === error.MEDIA_ERR_NETWORK && this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        if (this.currentTrack) {
          this.loadTrack(this.currentTrack);
        }
      }, 1000 * this.retryCount); // Exponential backoff
      return;
    }

    this.emit('error', { 
      message,
      track: this.currentTrack,
      error: error 
    });
  }

  handleStalled() {
    this.emit('stalled', { track: this.currentTrack });
  }

  handleWaiting() {
    this.emit('waiting', { track: this.currentTrack });
  }

  handleCanPlayThrough() {
    this.emit('canplaythrough', { track: this.currentTrack });
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;