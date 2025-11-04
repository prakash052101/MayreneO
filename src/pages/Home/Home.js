import React, { useState, useEffect } from "react";
import "./Home.css";
import { usePlayer } from "../../contexts/PlayerContext";
import Spotify from "../../util/spotify";

// Mock data for featured content (in a real app, this would come from an API)
const mockFeaturedPlaylists = [
  {
    id: 'featured-1',
    name: 'Today\'s Top Hits',
    description: 'The most played songs right now',
    image: null,
    trackCount: 50
  },
  {
    id: 'featured-2',
    name: 'Chill Vibes',
    description: 'Relax and unwind with these mellow tracks',
    image: null,
    trackCount: 30
  },
  {
    id: 'featured-3',
    name: 'Workout Mix',
    description: 'High energy tracks to power your workout',
    image: null,
    trackCount: 40
  },
  {
    id: 'featured-4',
    name: 'Indie Discoveries',
    description: 'Fresh indie tracks you need to hear',
    image: null,
    trackCount: 25
  }
];

// Mock trending tracks (fallback when API fails - note: no preview URLs available)
const mockTrendingTracks = [
  {
    id: 'trending-1',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    uri: 'spotify:track:0VjIjW4GlULA7QiSV6Fdn9',
    duration_ms: 200040,
    popularity: 95,
    preview_url: null, // Mock tracks don't have preview URLs
    artwork: {
      small: '',
      medium: '',
      large: ''
    }
  },
  {
    id: 'trending-2',
    name: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    uri: 'spotify:track:6UelLqGlWMcVH1E5c4H7lY',
    duration_ms: 174000,
    popularity: 92,
    preview_url: null,
    artwork: {
      small: '',
      medium: '',
      large: ''
    }
  },
  {
    id: 'trending-3',
    name: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    uri: 'spotify:track:463CkQjx2Zk1yXoBuierM9',
    duration_ms: 203064,
    popularity: 90,
    preview_url: null,
    artwork: {
      small: '',
      medium: '',
      large: ''
    }
  },
  {
    id: 'trending-4',
    name: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    uri: 'spotify:track:4ZtFanR9U6ndgddUvNcjcG',
    duration_ms: 178147,
    popularity: 88,
    preview_url: null,
    artwork: {
      small: '',
      medium: '',
      large: ''
    }
  }
];

const Home = () => {
  const { history, playTrack, currentTrack, isPlaying } = usePlayer();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load real featured content from Spotify
    const loadFeaturedContent = async () => {
      setIsLoading(true);
      
      try {
        // Load featured playlists and new releases in parallel
        const [featuredPlaylistsData, newReleasesData] = await Promise.all([
          Spotify.getFeaturedPlaylists(8),
          Spotify.getNewReleases(8)
        ]);

        // Transform featured playlists
        const transformedPlaylists = featuredPlaylistsData.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          image: playlist.images?.[0]?.url || null,
          trackCount: playlist.tracks?.total || 0,
          external_urls: playlist.external_urls
        }));

        // Transform new releases as "trending tracks" (albums)
        const transformedTrending = newReleasesData.slice(0, 4).map((album, index) => ({
          id: album.id,
          name: album.name,
          artist: album.artists?.[0]?.name || 'Various Artists',
          album: album.name,
          uri: album.uri,
          duration_ms: 180000, // Default duration since albums don't have duration
          popularity: 90 - (index * 5), // Mock popularity
          artwork: {
            small: album.images?.[2]?.url || '',
            medium: album.images?.[1]?.url || '',
            large: album.images?.[0]?.url || ''
          }
        }));

        // Always try to get real tracks for trending section
        let finalTrendingTracks = transformedTrending;
        
        // If new releases didn't work or we got albums without preview URLs, try popular tracks
        if (transformedTrending.length === 0) {
          try {
            const popularTracks = await Spotify.getPopularTracks(4);
            finalTrendingTracks = popularTracks.length > 0 ? popularTracks : mockTrendingTracks;
          } catch (fallbackError) {
            console.warn('Popular tracks fallback also failed:', fallbackError);
            finalTrendingTracks = mockTrendingTracks;
          }
        }

        setFeaturedPlaylists(transformedPlaylists.length > 0 ? transformedPlaylists : mockFeaturedPlaylists);
        setTrendingTracks(finalTrendingTracks);
      } catch (error) {
        console.error('Failed to load featured content:', error);
        // Fallback to mock data if API fails
        setFeaturedPlaylists(mockFeaturedPlaylists);
        setTrendingTracks(mockTrendingTracks);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedContent();
  }, []);

  const handlePlayTrack = (track) => {
    playTrack(track, [track], 0);
  };

  const handlePlayPlaylist = (playlist) => {
    // In a real app, you would fetch the playlist tracks here
    console.log('Playing playlist:', playlist.name);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="home">
        <div className="home__loading">
          <div className="home__spinner"></div>
          <p>Loading your music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Info Banner */}
      <div className="home__info-banner">
        <div className="home__info-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>
            <strong>Note:</strong> Audio previews may not be available for all tracks due to Spotify API limitations. 
            You can still browse, search, and create playlists!
          </span>
        </div>
      </div>

      <div className="home__hero">
        <h1 className="home__title">{getTimeOfDayGreeting()}</h1>
        <p className="home__subtitle">
          Ready to discover your next favorite song?
        </p>
      </div>

      {/* Quick Access Section */}
      {history.length > 0 && (
        <section className="home__section">
          <h2 className="home__section-title">Jump back in</h2>
          <div className="home__quick-access">
            {history.slice(0, 6).map((track, index) => (
              <div 
                key={`recent-${track.id}-${index}`} 
                className={`home__quick-card ${
                  currentTrack?.id === track.id && isPlaying ? 'home__quick-card--playing' : ''
                }`}
                onClick={() => handlePlayTrack(track)}
              >
                <div className="home__quick-image">
                  {track.artwork?.medium || track.album?.images?.[1]?.url ? (
                    <img 
                      src={track.artwork?.medium || track.album.images[1].url} 
                      alt={track.album?.name || track.album} 
                      loading="lazy"
                    />
                  ) : (
                    <div className="home__quick-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="home__quick-info">
                  <h3 className="home__quick-title">{track.name}</h3>
                  <p className="home__quick-artist">{track.artist}</p>
                </div>
                <div className="home__quick-play">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Playlists */}
      <section className="home__section">
        <div className="home__section-header">
          <h2 className="home__section-title">Made for you</h2>
          <button className="home__section-link">Show all</button>
        </div>
        <div className="home__grid">
          {featuredPlaylists.map((playlist, index) => (
            <div 
              key={playlist.id} 
              className="home__card"
              onClick={() => handlePlayPlaylist(playlist)}
            >
              <div className="home__card-image">
                {playlist.image ? (
                  <img 
                    src={playlist.image} 
                    alt={playlist.name} 
                    loading="lazy"
                  />
                ) : (
                  <div className="home__card-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                    </svg>
                  </div>
                )}
                <div className="home__card-overlay">
                  <button className="home__card-play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="home__card-content">
                <h3 className="home__card-title">{playlist.name}</h3>
                <p className="home__card-subtitle">{playlist.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Tracks */}
      <section className="home__section">
        <div className="home__section-header">
          <h2 className="home__section-title">Trending now</h2>
          <button className="home__section-link">Show all</button>
        </div>
        <div className="home__trending">
          {trendingTracks.map((track, index) => (
            <div 
              key={track.id} 
              className={`home__trending-item ${
                currentTrack?.id === track.id && isPlaying ? 'home__trending-item--playing' : ''
              }`}
              onClick={() => handlePlayTrack(track)}
            >
              <div className="home__trending-rank">
                {index + 1}
              </div>
              <div className="home__trending-image">
                {track.album?.images?.[0]?.url ? (
                  <img src={track.album.images[0].url} alt={track.album.name} />
                ) : (
                  <div className="home__trending-placeholder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="home__trending-info">
                <h4 className="home__trending-title">
                  {track.name}
                  {!track.preview_url && (
                    <span className="home__no-preview" title="No audio preview available for this track">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.27 2L2 3.27l6.97 6.97L2 17.27 3.27 18.54l6.97-6.97L17.27 18.54 18.54 17.27l-6.97-6.97L18.54 3.27 17.27 2l-6.97 6.97L3.27 2z"/>
                      </svg>
                    </span>
                  )}
                </h4>
                <p className="home__trending-artist">{track.artist}</p>
              </div>
              <div className="home__trending-duration">
                {formatDuration(track.duration_ms)}
              </div>
              <div className="home__trending-play">
                {currentTrack?.id === track.id && isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="home__section">
        <div className="home__section-header">
          <h2 className="home__section-title">Recommended for you</h2>
          <button className="home__section-link">Show all</button>
        </div>
        <div className="home__grid">
          {mockFeaturedPlaylists.slice(0, 3).map(playlist => (
            <div 
              key={`rec-${playlist.id}`} 
              className="home__card"
              onClick={() => handlePlayPlaylist(playlist)}
            >
              <div className="home__card-image">
                <div className="home__card-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                <div className="home__card-overlay">
                  <button className="home__card-play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="home__card-content">
                <h3 className="home__card-title">{playlist.name}</h3>
                <p className="home__card-subtitle">Based on your recent listening</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
