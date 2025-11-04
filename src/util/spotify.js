import { retryWithBackoff, RETRY_CONFIGS, RetryableError } from "./retryUtils";
import { withCache, cacheKeys, CACHE_CONFIG } from "./cacheUtils";

// Get credentials from environment variables
const clientId = process.env.REACT_APP_CLIENT_ID || process.env.CLIENT_ID;
const clientSecret =
  process.env.REACT_APP_CLIENT_SECRET || process.env.CLIENT_SECRET;
const redirectUri =
  process.env.REACT_APP_REDIRECT_URI || "http://localhost:3000";

let userAccessToken; // For user-specific operations
let clientAccessToken; // For public operations
let clientTokenExpiry = 0;

const Spotify = {
  // Clear all tokens
  clearAccessToken() {
    userAccessToken = null;
    clientAccessToken = null;
    clientTokenExpiry = 0;
  },

  // Get Client Credentials token for public operations (search, track details, etc.)
  async getClientAccessToken() {
    // Return existing token if still valid
    if (clientAccessToken && Date.now() < clientTokenExpiry) {
      return clientAccessToken;
    }

    if (!clientId || !clientSecret) {
      throw new Error(
        "Spotify Client ID and Client Secret are required. Please check your environment variables."
      );
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get client access token: ${
            errorData.error_description || response.statusText
          }`
        );
      }

      const data = await response.json();
      clientAccessToken = data.access_token;
      clientTokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Refresh 1 minute early

      return clientAccessToken;
    } catch (error) {
      console.error("Error getting client access token:", error);
      throw new RetryableError(
        "Failed to authenticate with Spotify",
        error,
        0,
        false
      );
    }
  },

  // Get User Access Token for user-specific operations (playlists, user profile, etc.)
  getUserAccessToken() {
    if (userAccessToken) {
      return userAccessToken;
    }

    // Check URL for access token (from OAuth redirect)
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      userAccessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => (userAccessToken = null), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/"); // Clear URL parameters
      return userAccessToken;
    } else {
      // Redirect to Spotify authorization
      const scopes = [
        "playlist-modify-public",
        "playlist-modify-private",
        "playlist-read-private",
        "user-read-private",
        "user-read-email",
      ].join(" ");

      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=${encodeURIComponent(
        scopes
      )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location = accessUrl;
    }
  },

  // Search for tracks using Client Credentials (no user login required)
  search: withCache(
    async (term) => {
      if (!term || term.trim() === "") {
        return [];
      }

      const searchOperation = async () => {
        const accessToken = await Spotify.getClientAccessToken();

        const response = await fetch(
          `https://api.spotify.com/v1/search?type=track,artist,album&q=${encodeURIComponent(
            term
          )}&limit=20&market=IN`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.error?.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
          error.response = response;
          error.status = response.status;

          if (response.status === 401) {
            // Token expired, clear it and retry
            Spotify.clearAccessToken();
            throw new RetryableError("Access token expired", error, 1, true);
          }

          throw error;
        }

        const jsonResponse = await response.json();

        if (!jsonResponse.tracks) {
          return [];
        }

        const tracks = jsonResponse.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || "Unknown Artist",
          artists: track.artists.map((artist) => ({
            id: artist.id,
            name: artist.name,
          })),
          album: track.album.name,
          uri: track.uri,
          preview_url: track.preview_url,
          duration_ms: track.duration_ms,
          popularity: track.popularity,
          explicit: track.explicit,
          external_urls: track.external_urls,
          artwork: {
            small: track.album.images[2]?.url || "",
            medium: track.album.images[1]?.url || "",
            large: track.album.images[0]?.url || "",
          },
          album_info: {
            id: track.album.id,
            name: track.album.name,
            release_date: track.album.release_date,
            total_tracks: track.album.total_tracks,
          },
        }));

        return tracks;
      };

      try {
        return await retryWithBackoff(searchOperation, RETRY_CONFIGS.QUICK);
      } catch (error) {
        console.error("Search failed after retries:", error);
        throw new RetryableError(
          "Failed to search tracks. Please check your connection and try again.",
          error,
          RETRY_CONFIGS.QUICK.maxAttempts
        );
      }
    },
    cacheKeys.search,
    CACHE_CONFIG.SEARCH_RESULTS
  ),

  // Get popular tracks as fallback when other endpoints fail
  getPopularTracks: withCache(
    async (limit = 20) => {
      try {
        // Try multiple search strategies to find tracks with previews
        const searchStrategies = [
          // Popular international artists that often have previews
          'taylor swift',
          'ed sheeran', 
          'billie eilish',
          'dua lipa',
          'the weeknd',
          // Popular Bollywood/Indian artists
          'arijit singh',
          'shreya ghoshal',
          'a r rahman',
          // Popular genres
          'bollywood hits',
          'hindi songs'
        ];
        
        for (const term of searchStrategies) {
          const tracks = await Spotify.search(term);
          const tracksWithPreviews = tracks.filter(track => track.preview_url);
          
          if (tracksWithPreviews.length > 0) {
            return tracksWithPreviews.slice(0, limit);
          }
        }
        
        // If no previews found, return tracks anyway (we have fallback audio)
        const fallbackTracks = await Spotify.search('popular music');
        return fallbackTracks.slice(0, limit);
      } catch (error) {
        console.error("Failed to get popular tracks:", error);
        return [];
      }
    },
    () => "popular-tracks",
    CACHE_CONFIG.SEARCH_RESULTS
  ),

  // Save playlist (requires user authentication)
  async savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {
      throw new Error("Playlist name and tracks are required");
    }

    const saveOperation = async () => {
      const accessToken = Spotify.getUserAccessToken();
      if (!accessToken) {
        throw new RetryableError(
          "User authentication required",
          null,
          0,
          false
        );
      }

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      // Get user profile
      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers,
      });
      if (!userResponse.ok) {
        const error = new Error(
          `Failed to get user profile: ${userResponse.status}`
        );
        error.response = userResponse;
        throw error;
      }
      const userProfile = await userResponse.json();
      const userId = userProfile.id;

      // Create playlist
      const createPlaylistResponse = await fetch(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          headers,
          method: "POST",
          body: JSON.stringify({
            name: name,
            description: `Created with Music Platform on ${new Date().toLocaleDateString()}`,
            public: false,
          }),
        }
      );

      if (!createPlaylistResponse.ok) {
        const error = new Error(
          `Failed to create playlist: ${createPlaylistResponse.status}`
        );
        error.response = createPlaylistResponse;
        throw error;
      }

      const playlist = await createPlaylistResponse.json();
      const playlistId = playlist.id;

      // Add tracks to playlist
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers,
          method: "POST",
          body: JSON.stringify({ uris: trackUris }),
        }
      );

      if (!addTracksResponse.ok) {
        const error = new Error(
          `Failed to add tracks to playlist: ${addTracksResponse.status}`
        );
        error.response = addTracksResponse;
        throw error;
      }

      return {
        id: playlistId,
        name: playlist.name,
        external_urls: playlist.external_urls,
        tracks: { total: trackUris.length },
      };
    };

    try {
      return await retryWithBackoff(saveOperation, RETRY_CONFIGS.CRITICAL);
    } catch (error) {
      console.error("Save playlist failed after retries:", error);
      throw new RetryableError(
        "Failed to save playlist. Please check your connection and try again.",
        error,
        RETRY_CONFIGS.CRITICAL.maxAttempts
      );
    }
  },

  // Get user's playlists (requires user authentication)
  getUserPlaylists: withCache(
    async () => {
      const getPlaylistsOperation = async () => {
        const accessToken = Spotify.getUserAccessToken();
        if (!accessToken) {
          throw new RetryableError(
            "User authentication required",
            null,
            0,
            false
          );
        }

        const response = await fetch(
          "https://api.spotify.com/v1/me/playlists?limit=50",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const error = new Error(
            `Failed to get playlists: ${response.status}`
          );
          error.response = response;
          throw error;
        }

        const data = await response.json();
        return data.items || [];
      };

      try {
        return await retryWithBackoff(
          getPlaylistsOperation,
          RETRY_CONFIGS.STANDARD
        );
      } catch (error) {
        console.error("Get playlists failed after retries:", error);
        throw new RetryableError(
          "Failed to load playlists. Please check your connection and try again.",
          error,
          RETRY_CONFIGS.STANDARD.maxAttempts
        );
      }
    },
    () => cacheKeys.userPlaylists("current"),
    CACHE_CONFIG.USER_PLAYLISTS
  ),

  // Get track details using Client Credentials
  getTrack: withCache(
    async (trackId) => {
      const getTrackOperation = async () => {
        const accessToken = await Spotify.getClientAccessToken();

        const response = await fetch(
          `https://api.spotify.com/v1/tracks/${trackId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const error = new Error(`Failed to get track: ${response.status}`);
          error.response = response;
          throw error;
        }

        return await response.json();
      };

      try {
        return await retryWithBackoff(getTrackOperation, RETRY_CONFIGS.QUICK);
      } catch (error) {
        console.error("Get track failed after retries:", error);
        throw new RetryableError(
          "Failed to load track details. Please try again.",
          error,
          RETRY_CONFIGS.QUICK.maxAttempts
        );
      }
    },
    cacheKeys.trackDetails,
    CACHE_CONFIG.TRACK_DETAILS
  ),

  // Get featured playlists using Client Credentials
  getFeaturedPlaylists: withCache(
    async (limit = 20) => {
      const getFeaturedOperation = async () => {
        const accessToken = await Spotify.getClientAccessToken();

        // Try with market parameter first (US market)
        let response = await fetch(
          `https://api.spotify.com/v1/browse/featured-playlists?limit=${limit}&market=US`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // If that fails, try without market parameter
        if (!response.ok && response.status === 404) {
          response = await fetch(
            `https://api.spotify.com/v1/browse/featured-playlists?limit=${limit}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
        }

        // If still failing, try the categories endpoint as fallback
        if (!response.ok && response.status === 404) {
          response = await fetch(
            `https://api.spotify.com/v1/browse/categories?limit=${Math.min(
              limit,
              10
            )}&market=US`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (response.ok) {
            const categoriesData = await response.json();
            // Transform categories to look like playlists
            return (
              categoriesData.categories?.items?.map((category) => ({
                id: category.id,
                name: category.name,
                description: `Explore ${category.name} music`,
                images: category.icons || [],
                tracks: { total: 0 },
                external_urls: {
                  spotify: `https://open.spotify.com/genre/${category.id}`,
                },
              })) || []
            );
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            `Failed to get featured playlists: ${response.status} - ${
              errorData.error?.message || response.statusText
            }`
          );
          error.response = response;
          throw error;
        }

        const data = await response.json();
        return data.playlists?.items || [];
      };

      try {
        return await retryWithBackoff(
          getFeaturedOperation,
          RETRY_CONFIGS.STANDARD
        );
      } catch (error) {
        console.error("Get featured playlists failed after retries:", error);
        // Return empty array instead of throwing error to allow fallback to mock data
        return [];
      }
    },
    () => "featured-playlists",
    CACHE_CONFIG.USER_PLAYLISTS
  ),

  // Get new releases using Client Credentials
  getNewReleases: withCache(
    async (limit = 20) => {
      const getNewReleasesOperation = async () => {
        const accessToken = await Spotify.getClientAccessToken();

        // Try with market parameter first (US market)
        let response = await fetch(
          `https://api.spotify.com/v1/browse/new-releases?limit=${limit}&market=US`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // If that fails, try without market parameter
        if (!response.ok && response.status === 404) {
          response = await fetch(
            `https://api.spotify.com/v1/browse/new-releases?limit=${limit}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            `Failed to get new releases: ${response.status} - ${
              errorData.error?.message || response.statusText
            }`
          );
          error.response = response;
          throw error;
        }

        const data = await response.json();
        return data.albums?.items || [];
      };

      try {
        return await retryWithBackoff(
          getNewReleasesOperation,
          RETRY_CONFIGS.STANDARD
        );
      } catch (error) {
        console.error("Get new releases failed after retries:", error);
        // Return empty array instead of throwing error to allow fallback to mock data
        return [];
      }
    },
    () => "new-releases",
    CACHE_CONFIG.USER_PLAYLISTS
  ),

  // Get user profile (requires user authentication)
  getUserProfile: withCache(
    async () => {
      const getUserProfileOperation = async () => {
        const accessToken = Spotify.getUserAccessToken();
        if (!accessToken) {
          throw new RetryableError(
            "User authentication required",
            null,
            0,
            false
          );
        }

        const response = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const error = new Error(
            `Failed to get user profile: ${response.status}`
          );
          error.response = response;
          throw error;
        }

        return await response.json();
      };

      try {
        return await retryWithBackoff(
          getUserProfileOperation,
          RETRY_CONFIGS.STANDARD
        );
      } catch (error) {
        console.error("Get user profile failed after retries:", error);
        throw new RetryableError(
          "Failed to load user profile. Please try again.",
          error,
          RETRY_CONFIGS.STANDARD.maxAttempts
        );
      }
    },
    () => "user-profile",
    CACHE_CONFIG.USER_PLAYLISTS
  ),
};

export default Spotify;
