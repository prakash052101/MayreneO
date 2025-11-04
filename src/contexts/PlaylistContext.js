import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Playlist action types
const PLAYLIST_ACTIONS = {
  SET_PLAYLISTS: 'SET_PLAYLISTS',
  ADD_PLAYLIST: 'ADD_PLAYLIST',
  UPDATE_PLAYLIST: 'UPDATE_PLAYLIST',
  DELETE_PLAYLIST: 'DELETE_PLAYLIST',
  ADD_TRACK_TO_PLAYLIST: 'ADD_TRACK_TO_PLAYLIST',
  REMOVE_TRACK_FROM_PLAYLIST: 'REMOVE_TRACK_FROM_PLAYLIST',
  REORDER_PLAYLIST_TRACKS: 'REORDER_PLAYLIST_TRACKS',
  SET_CURRENT_PLAYLIST: 'SET_CURRENT_PLAYLIST',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  DUPLICATE_PLAYLIST: 'DUPLICATE_PLAYLIST'
};

// Initial state
const initialState = {
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null
};

// Utility functions
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const calculatePlaylistDuration = (tracks) => {
  const totalMs = tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
  const minutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

// Playlist reducer
const playlistReducer = (state, action) => {
  switch (action.type) {
    case PLAYLIST_ACTIONS.SET_PLAYLISTS:
      return {
        ...state,
        playlists: action.payload,
        error: null
      };

    case PLAYLIST_ACTIONS.ADD_PLAYLIST:
      const newPlaylist = {
        id: generateId(),
        name: action.payload.name || 'New Playlist',
        description: action.payload.description || '',
        tracks: [],
        isPublic: action.payload.isPublic || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trackCount: 0,
        duration: '0m'
      };
      
      return {
        ...state,
        playlists: [...state.playlists, newPlaylist],
        error: null
      };

    case PLAYLIST_ACTIONS.UPDATE_PLAYLIST:
      return {
        ...state,
        playlists: state.playlists.map(playlist =>
          playlist.id === action.payload.id
            ? {
                ...playlist,
                ...action.payload.updates,
                updatedAt: new Date().toISOString(),
                trackCount: action.payload.updates.tracks 
                  ? action.payload.updates.tracks.length 
                  : playlist.trackCount,
                duration: action.payload.updates.tracks 
                  ? calculatePlaylistDuration(action.payload.updates.tracks)
                  : playlist.duration
              }
            : playlist
        ),
        currentPlaylist: state.currentPlaylist?.id === action.payload.id
          ? {
              ...state.currentPlaylist,
              ...action.payload.updates,
              updatedAt: new Date().toISOString(),
              trackCount: action.payload.updates.tracks 
                ? action.payload.updates.tracks.length 
                : state.currentPlaylist.trackCount,
              duration: action.payload.updates.tracks 
                ? calculatePlaylistDuration(action.payload.updates.tracks)
                : state.currentPlaylist.duration
            }
          : state.currentPlaylist,
        error: null
      };

    case PLAYLIST_ACTIONS.DELETE_PLAYLIST:
      return {
        ...state,
        playlists: state.playlists.filter(playlist => playlist.id !== action.payload),
        currentPlaylist: state.currentPlaylist?.id === action.payload ? null : state.currentPlaylist,
        error: null
      };

    case PLAYLIST_ACTIONS.ADD_TRACK_TO_PLAYLIST:
      const { playlistId, track } = action.payload;
      return {
        ...state,
        playlists: state.playlists.map(playlist =>
          playlist.id === playlistId
            ? {
                ...playlist,
                tracks: [...playlist.tracks, track],
                trackCount: playlist.tracks.length + 1,
                duration: calculatePlaylistDuration([...playlist.tracks, track]),
                updatedAt: new Date().toISOString()
              }
            : playlist
        ),
        currentPlaylist: state.currentPlaylist?.id === playlistId
          ? {
              ...state.currentPlaylist,
              tracks: [...state.currentPlaylist.tracks, track],
              trackCount: state.currentPlaylist.tracks.length + 1,
              duration: calculatePlaylistDuration([...state.currentPlaylist.tracks, track]),
              updatedAt: new Date().toISOString()
            }
          : state.currentPlaylist,
        error: null
      };

    case PLAYLIST_ACTIONS.REMOVE_TRACK_FROM_PLAYLIST:
      const { playlistId: removePlaylistId, trackIndex } = action.payload;
      return {
        ...state,
        playlists: state.playlists.map(playlist =>
          playlist.id === removePlaylistId
            ? {
                ...playlist,
                tracks: playlist.tracks.filter((_, index) => index !== trackIndex),
                trackCount: playlist.tracks.length - 1,
                duration: calculatePlaylistDuration(playlist.tracks.filter((_, index) => index !== trackIndex)),
                updatedAt: new Date().toISOString()
              }
            : playlist
        ),
        currentPlaylist: state.currentPlaylist?.id === removePlaylistId
          ? {
              ...state.currentPlaylist,
              tracks: state.currentPlaylist.tracks.filter((_, index) => index !== trackIndex),
              trackCount: state.currentPlaylist.tracks.length - 1,
              duration: calculatePlaylistDuration(state.currentPlaylist.tracks.filter((_, index) => index !== trackIndex)),
              updatedAt: new Date().toISOString()
            }
          : state.currentPlaylist,
        error: null
      };

    case PLAYLIST_ACTIONS.REORDER_PLAYLIST_TRACKS:
      const { playlistId: reorderPlaylistId, fromIndex, toIndex } = action.payload;
      
      const reorderTracks = (tracks) => {
        const newTracks = [...tracks];
        const [movedTrack] = newTracks.splice(fromIndex, 1);
        newTracks.splice(toIndex, 0, movedTrack);
        return newTracks;
      };

      return {
        ...state,
        playlists: state.playlists.map(playlist =>
          playlist.id === reorderPlaylistId
            ? {
                ...playlist,
                tracks: reorderTracks(playlist.tracks),
                updatedAt: new Date().toISOString()
              }
            : playlist
        ),
        currentPlaylist: state.currentPlaylist?.id === reorderPlaylistId
          ? {
              ...state.currentPlaylist,
              tracks: reorderTracks(state.currentPlaylist.tracks),
              updatedAt: new Date().toISOString()
            }
          : state.currentPlaylist,
        error: null
      };

    case PLAYLIST_ACTIONS.SET_CURRENT_PLAYLIST:
      return {
        ...state,
        currentPlaylist: action.payload,
        error: null
      };

    case PLAYLIST_ACTIONS.DUPLICATE_PLAYLIST:
      const originalPlaylist = state.playlists.find(p => p.id === action.payload);
      if (!originalPlaylist) return state;

      const duplicatedPlaylist = {
        ...originalPlaylist,
        id: generateId(),
        name: `${originalPlaylist.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        ...state,
        playlists: [...state.playlists, duplicatedPlaylist],
        error: null
      };

    case PLAYLIST_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case PLAYLIST_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    default:
      return state;
  }
};

// Create context
const PlaylistContext = createContext();

// Custom hook to use playlist context
export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

// Playlist provider component
export const PlaylistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(playlistReducer, initialState);

  // Load playlists from localStorage on mount
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('user-playlists');
    if (savedPlaylists) {
      try {
        const playlists = JSON.parse(savedPlaylists);
        dispatch({ type: PLAYLIST_ACTIONS.SET_PLAYLISTS, payload: playlists });
      } catch (error) {
        console.error('Failed to load playlists:', error);
        // Initialize with default playlists if loading fails
        const defaultPlaylists = [
          {
            id: 'liked-songs',
            name: 'Liked Songs',
            description: 'Your favorite tracks',
            tracks: [],
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            trackCount: 0,
            duration: '0m'
          }
        ];
        dispatch({ type: PLAYLIST_ACTIONS.SET_PLAYLISTS, payload: defaultPlaylists });
      }
    } else {
      // Initialize with default playlists
      const defaultPlaylists = [
        {
          id: 'liked-songs',
          name: 'Liked Songs',
          description: 'Your favorite tracks',
          tracks: [],
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          trackCount: 0,
          duration: '0m'
        }
      ];
      dispatch({ type: PLAYLIST_ACTIONS.SET_PLAYLISTS, payload: defaultPlaylists });
    }
  }, []);

  // Save playlists to localStorage when they change
  useEffect(() => {
    if (state.playlists.length > 0) {
      localStorage.setItem('user-playlists', JSON.stringify(state.playlists));
    }
  }, [state.playlists]);

  // Action creators
  const actions = {
    createPlaylist: (playlistData) => {
      dispatch({ type: PLAYLIST_ACTIONS.ADD_PLAYLIST, payload: playlistData });
    },

    updatePlaylist: (id, updates) => {
      dispatch({ type: PLAYLIST_ACTIONS.UPDATE_PLAYLIST, payload: { id, updates } });
    },

    deletePlaylist: (id) => {
      dispatch({ type: PLAYLIST_ACTIONS.DELETE_PLAYLIST, payload: id });
    },

    addTrackToPlaylist: (playlistId, track) => {
      // Check if track already exists in playlist
      const playlist = state.playlists.find(p => p.id === playlistId);
      if (playlist && !playlist.tracks.some(t => t.id === track.id)) {
        dispatch({ type: PLAYLIST_ACTIONS.ADD_TRACK_TO_PLAYLIST, payload: { playlistId, track } });
      }
    },

    removeTrackFromPlaylist: (playlistId, trackIndex) => {
      dispatch({ type: PLAYLIST_ACTIONS.REMOVE_TRACK_FROM_PLAYLIST, payload: { playlistId, trackIndex } });
    },

    reorderPlaylistTracks: (playlistId, fromIndex, toIndex) => {
      dispatch({ type: PLAYLIST_ACTIONS.REORDER_PLAYLIST_TRACKS, payload: { playlistId, fromIndex, toIndex } });
    },

    setCurrentPlaylist: (playlist) => {
      dispatch({ type: PLAYLIST_ACTIONS.SET_CURRENT_PLAYLIST, payload: playlist });
    },

    duplicatePlaylist: (id) => {
      dispatch({ type: PLAYLIST_ACTIONS.DUPLICATE_PLAYLIST, payload: id });
    },

    getPlaylistById: (id) => {
      return state.playlists.find(playlist => playlist.id === id);
    },

    setLoading: (isLoading) => {
      dispatch({ type: PLAYLIST_ACTIONS.SET_LOADING, payload: isLoading });
    },

    setError: (error) => {
      dispatch({ type: PLAYLIST_ACTIONS.SET_ERROR, payload: error });
    }
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

export default PlaylistContext;