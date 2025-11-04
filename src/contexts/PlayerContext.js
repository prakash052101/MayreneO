import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Player action types
const PLAYER_ACTIONS = {
  SET_CURRENT_TRACK: 'SET_CURRENT_TRACK',
  SET_PLAYING: 'SET_PLAYING',
  SET_QUEUE: 'SET_QUEUE',
  SET_CURRENT_INDEX: 'SET_CURRENT_INDEX',
  SET_VOLUME: 'SET_VOLUME',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  SET_REPEAT_MODE: 'SET_REPEAT_MODE',
  SET_SHUFFLE: 'SET_SHUFFLE',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Repeat modes
export const REPEAT_MODES = {
  OFF: 'off',
  ALL: 'all',
  ONE: 'one'
};

// Initial state
const initialState = {
  currentTrack: null,
  isPlaying: false,
  queue: [],
  currentIndex: 0,
  volume: 0.7,
  repeatMode: REPEAT_MODES.OFF,
  isShuffled: false,
  history: [],
  isLoading: false,
  error: null,
  originalQueue: [] // Store original queue for shuffle/unshuffle
};

// Player reducer
const playerReducer = (state, action) => {
  switch (action.type) {
    case PLAYER_ACTIONS.SET_CURRENT_TRACK:
      return {
        ...state,
        currentTrack: action.payload,
        error: null
      };

    case PLAYER_ACTIONS.SET_PLAYING:
      return {
        ...state,
        isPlaying: action.payload
      };

    case PLAYER_ACTIONS.SET_QUEUE:
      return {
        ...state,
        queue: action.payload,
        originalQueue: state.isShuffled ? state.originalQueue : action.payload,
        currentIndex: 0,
        currentTrack: action.payload[0] || null
      };

    case PLAYER_ACTIONS.SET_CURRENT_INDEX:
      const newIndex = Math.max(0, Math.min(action.payload, state.queue.length - 1));
      return {
        ...state,
        currentIndex: newIndex,
        currentTrack: state.queue[newIndex] || null
      };

    case PLAYER_ACTIONS.SET_VOLUME:
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload))
      };

    case PLAYER_ACTIONS.ADD_TO_QUEUE:
      const updatedQueue = [...state.queue, action.payload];
      return {
        ...state,
        queue: updatedQueue,
        originalQueue: state.isShuffled ? state.originalQueue : updatedQueue
      };

    case PLAYER_ACTIONS.REMOVE_FROM_QUEUE:
      const filteredQueue = state.queue.filter((_, index) => index !== action.payload);
      const newCurrentIndex = action.payload < state.currentIndex 
        ? state.currentIndex - 1 
        : state.currentIndex;
      
      return {
        ...state,
        queue: filteredQueue,
        currentIndex: Math.max(0, Math.min(newCurrentIndex, filteredQueue.length - 1)),
        currentTrack: filteredQueue[newCurrentIndex] || null,
        originalQueue: state.isShuffled ? state.originalQueue : filteredQueue
      };

    case PLAYER_ACTIONS.CLEAR_QUEUE:
      return {
        ...state,
        queue: [],
        originalQueue: [],
        currentIndex: 0,
        currentTrack: null,
        isPlaying: false
      };

    case PLAYER_ACTIONS.SET_REPEAT_MODE:
      return {
        ...state,
        repeatMode: action.payload
      };

    case PLAYER_ACTIONS.SET_SHUFFLE:
      if (action.payload && !state.isShuffled) {
        // Enable shuffle
        const currentTrack = state.currentTrack;
        const shuffledQueue = [...state.queue];
        
        // Remove current track from array for shuffling
        const currentTrackIndex = shuffledQueue.findIndex(track => track.id === currentTrack?.id);
        if (currentTrackIndex > -1) {
          shuffledQueue.splice(currentTrackIndex, 1);
        }
        
        // Shuffle remaining tracks
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }
        
        // Put current track at the beginning
        if (currentTrack) {
          shuffledQueue.unshift(currentTrack);
        }
        
        return {
          ...state,
          queue: shuffledQueue,
          originalQueue: state.queue,
          isShuffled: true,
          currentIndex: 0
        };
      } else if (!action.payload && state.isShuffled) {
        // Disable shuffle - restore original queue
        const currentTrack = state.currentTrack;
        const originalIndex = state.originalQueue.findIndex(track => track.id === currentTrack?.id);
        
        return {
          ...state,
          queue: state.originalQueue,
          isShuffled: false,
          currentIndex: Math.max(0, originalIndex)
        };
      }
      
      return {
        ...state,
        isShuffled: action.payload
      };

    case PLAYER_ACTIONS.ADD_TO_HISTORY:
      const newHistory = [action.payload, ...state.history.filter(track => track.id !== action.payload.id)];
      return {
        ...state,
        history: newHistory.slice(0, 50) // Keep last 50 tracks
      };

    case PLAYER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case PLAYER_ACTIONS.SET_ERROR:
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
const PlayerContext = createContext();

// Custom hook to use player context
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

// Player provider component
export const PlayerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  // Action creators
  const actions = {
    setCurrentTrack: (track) => {
      dispatch({ type: PLAYER_ACTIONS.SET_CURRENT_TRACK, payload: track });
      if (track) {
        actions.addToHistory(track);
      }
    },

    setPlaying: (isPlaying) => {
      dispatch({ type: PLAYER_ACTIONS.SET_PLAYING, payload: isPlaying });
    },

    setQueue: (queue) => {
      dispatch({ type: PLAYER_ACTIONS.SET_QUEUE, payload: queue });
    },

    setCurrentIndex: (index) => {
      dispatch({ type: PLAYER_ACTIONS.SET_CURRENT_INDEX, payload: index });
    },

    setVolume: (volume) => {
      dispatch({ type: PLAYER_ACTIONS.SET_VOLUME, payload: volume });
      // Persist volume to localStorage
      localStorage.setItem('player-volume', volume.toString());
    },

    addToQueue: (track) => {
      dispatch({ type: PLAYER_ACTIONS.ADD_TO_QUEUE, payload: track });
    },

    removeFromQueue: (index) => {
      dispatch({ type: PLAYER_ACTIONS.REMOVE_FROM_QUEUE, payload: index });
    },

    clearQueue: () => {
      dispatch({ type: PLAYER_ACTIONS.CLEAR_QUEUE });
    },

    setRepeatMode: (mode) => {
      dispatch({ type: PLAYER_ACTIONS.SET_REPEAT_MODE, payload: mode });
      localStorage.setItem('player-repeat-mode', mode);
    },

    setShuffle: (isShuffled) => {
      dispatch({ type: PLAYER_ACTIONS.SET_SHUFFLE, payload: isShuffled });
      localStorage.setItem('player-shuffle', isShuffled.toString());
    },

    addToHistory: (track) => {
      dispatch({ type: PLAYER_ACTIONS.ADD_TO_HISTORY, payload: track });
    },

    setLoading: (isLoading) => {
      dispatch({ type: PLAYER_ACTIONS.SET_LOADING, payload: isLoading });
    },

    setError: (error) => {
      dispatch({ type: PLAYER_ACTIONS.SET_ERROR, payload: error });
    },

    // Playback control actions
    play: () => {
      actions.setPlaying(true);
    },

    pause: () => {
      actions.setPlaying(false);
    },

    togglePlayPause: () => {
      actions.setPlaying(!state.isPlaying);
    },

    next: () => {
      const { queue, currentIndex, repeatMode } = state;
      
      if (queue.length === 0) return;
      
      if (repeatMode === REPEAT_MODES.ONE) {
        // Repeat current track
        return;
      }
      
      let nextIndex = currentIndex + 1;
      
      if (nextIndex >= queue.length) {
        if (repeatMode === REPEAT_MODES.ALL) {
          nextIndex = 0;
        } else {
          // End of queue, stop playing
          actions.setPlaying(false);
          return;
        }
      }
      
      actions.setCurrentIndex(nextIndex);
    },

    previous: () => {
      const { queue, currentIndex } = state;
      
      if (queue.length === 0) return;
      
      let prevIndex = currentIndex - 1;
      
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }
      
      actions.setCurrentIndex(prevIndex);
    },

    playTrack: (track, queue = null, index = 0) => {
      if (queue) {
        actions.setQueue(queue);
        actions.setCurrentIndex(index);
      } else {
        actions.setCurrentTrack(track);
      }
      actions.setPlaying(true);
    },

    playQueue: (queue, startIndex = 0) => {
      if (queue.length > 0) {
        actions.setQueue(queue);
        actions.setCurrentIndex(startIndex);
        actions.setPlaying(true);
      }
    }
  };

  // Load persisted settings on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('player-volume');
    const savedRepeatMode = localStorage.getItem('player-repeat-mode');
    const savedShuffle = localStorage.getItem('player-shuffle');

    if (savedVolume) {
      dispatch({ type: PLAYER_ACTIONS.SET_VOLUME, payload: parseFloat(savedVolume) });
    }

    if (savedRepeatMode && Object.values(REPEAT_MODES).includes(savedRepeatMode)) {
      dispatch({ type: PLAYER_ACTIONS.SET_REPEAT_MODE, payload: savedRepeatMode });
    }

    if (savedShuffle) {
      dispatch({ type: PLAYER_ACTIONS.SET_SHUFFLE, payload: savedShuffle === 'true' });
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle shortcuts when not typing in an input or textarea
      const target = event.target;
      
      // Check if we're in an input field or editable element
      const isInInput = (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.isContentEditable ||
        // Check if we're inside any input-like element
        target.closest('input, textarea, [contenteditable="true"]') ||
        // Check for specific search bar classes
        target.closest('.search-bar__input') ||
        target.closest('#search-bar')
      );
      
      if (isInInput) {
        return;
      }

      switch (event.code) {
        // Space is handled by the Player component through useKeyboardNavigation
        // case 'Space':
        //   event.preventDefault();
        //   dispatch({ type: PLAYER_ACTIONS.SET_PLAYING, payload: !state.isPlaying });
        //   break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Handle next track logic
            const { queue, currentIndex, repeatMode } = state;
            if (queue.length === 0) return;
            
            if (repeatMode === REPEAT_MODES.ONE) return;
            
            let nextIndex = currentIndex + 1;
            if (nextIndex >= queue.length) {
              if (repeatMode === REPEAT_MODES.ALL) {
                nextIndex = 0;
              } else {
                dispatch({ type: PLAYER_ACTIONS.SET_PLAYING, payload: false });
                return;
              }
            }
            dispatch({ type: PLAYER_ACTIONS.SET_CURRENT_INDEX, payload: nextIndex });
          }
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Handle previous track logic
            const { queue, currentIndex } = state;
            if (queue.length === 0) return;
            
            let prevIndex = currentIndex - 1;
            if (prevIndex < 0) {
              prevIndex = queue.length - 1;
            }
            dispatch({ type: PLAYER_ACTIONS.SET_CURRENT_INDEX, payload: prevIndex });
          }
          break;
        case 'ArrowUp':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const newVolume = Math.min(1, state.volume + 0.1);
            dispatch({ type: PLAYER_ACTIONS.SET_VOLUME, payload: newVolume });
            localStorage.setItem('player-volume', newVolume.toString());
          }
          break;
        case 'ArrowDown':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const newVolume = Math.max(0, state.volume - 0.1);
            dispatch({ type: PLAYER_ACTIONS.SET_VOLUME, payload: newVolume });
            localStorage.setItem('player-volume', newVolume.toString());
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [state]);

  const value = {
    ...state,
    ...actions
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;