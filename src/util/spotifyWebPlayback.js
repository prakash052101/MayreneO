/**
 * Spotify Web Playback SDK Integration
 * Allows full song playback for Spotify Premium users
 */

class SpotifyWebPlayback {
  constructor() {
    this.player = null;
    this.deviceId = null;
    this.isReady = false;
    this.accessToken = null;
  }

  /**
   * Initialize Spotify Web Playback SDK
   * Requires user to be logged in with Spotify Premium
   */
  async initialize(accessToken) {
    this.accessToken = accessToken;

    return new Promise((resolve, reject) => {
      // Load Spotify Web Playback SDK
      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
          this.createPlayer().then(resolve).catch(reject);
        };
      } else {
        this.createPlayer().then(resolve).catch(reject);
      }
    });
  }

  /**
   * Create Spotify Web Player
   */
  async createPlayer() {
    const player = new window.Spotify.Player({
      name: 'MayreneO Music Player',
      getOAuthToken: cb => { cb(this.accessToken); },
      volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
      console.error('Spotify Player initialization error:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Spotify Player authentication error:', message);
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Spotify Player account error:', message);
      alert('Spotify Premium is required for full song playback');
    });

    player.addListener('playback_error', ({ message }) => {
      console.error('Spotify Player playback error:', message);
    });

    // Playback status updates
    player.addListener('player_state_changed', (state) => {
      if (!state) return;
      
      console.log('Player state changed:', state);
      // You can emit events here to update your UI
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Spotify Player ready with Device ID:', device_id);
      this.deviceId = device_id;
      this.isReady = true;
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Spotify Player not ready with Device ID:', device_id);
      this.isReady = false;
    });

    // Connect to the player
    const success = await player.connect();
    
    if (success) {
      this.player = player;
      console.log('Successfully connected to Spotify Player');
      return true;
    } else {
      throw new Error('Failed to connect to Spotify Player');
    }
  }

  /**
   * Play a track using Spotify Web Playback
   * @param {string} trackUri - Spotify track URI (e.g., "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
   */
  async playTrack(trackUri) {
    if (!this.isReady || !this.deviceId) {
      throw new Error('Spotify Player not ready');
    }

    try {
      // Transfer playback to our device and start playing
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to play track');
      }

      console.log('Track started playing:', trackUri);
      return true;
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause() {
    if (this.player) {
      await this.player.pause();
    }
  }

  /**
   * Resume playback
   */
  async resume() {
    if (this.player) {
      await this.player.resume();
    }
  }

  /**
   * Get current playback state
   */
  async getCurrentState() {
    if (this.player) {
      return await this.player.getCurrentState();
    }
    return null;
  }

  /**
   * Disconnect player
   */
  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.isReady = false;
      this.deviceId = null;
    }
  }
}

export default SpotifyWebPlayback;