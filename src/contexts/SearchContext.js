import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Search action types
const SEARCH_ACTIONS = {
  SET_QUERY: 'SET_QUERY',
  SET_RESULTS: 'SET_RESULTS',
  SET_SUGGESTIONS: 'SET_SUGGESTIONS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  CLEAR_RESULTS: 'CLEAR_RESULTS',
  SET_HAS_RESULTS: 'SET_HAS_RESULTS'
};

// Search filters
export const SEARCH_FILTERS = {
  ALL: 'all',
  TRACKS: 'tracks',
  ARTISTS: 'artists',
  ALBUMS: 'albums'
};

// Sort options
export const SORT_OPTIONS = {
  RELEVANCE: 'relevance',
  NAME: 'name',
  ARTIST: 'artist',
  POPULARITY: 'popularity'
};

// Initial state
const initialState = {
  query: '',
  results: {
    tracks: [],
    artists: [],
    albums: []
  },
  suggestions: [],
  isLoading: false,
  error: null,
  history: [],
  filter: SEARCH_FILTERS.ALL,
  sort: SORT_OPTIONS.RELEVANCE,
  hasResults: false
};

// Search reducer
const searchReducer = (state, action) => {
  switch (action.type) {
    case SEARCH_ACTIONS.SET_QUERY:
      return {
        ...state,
        query: action.payload
      };

    case SEARCH_ACTIONS.SET_RESULTS:
      const hasResults = action.payload && (
        (action.payload.tracks && action.payload.tracks.length > 0) ||
        (action.payload.artists && action.payload.artists.length > 0) ||
        (action.payload.albums && action.payload.albums.length > 0)
      );
      return {
        ...state,
        results: action.payload,
        hasResults: hasResults,
        error: null,
        isLoading: false
      };

    case SEARCH_ACTIONS.SET_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.payload
      };

    case SEARCH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case SEARCH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case SEARCH_ACTIONS.ADD_TO_HISTORY:
      const newHistory = [
        action.payload,
        ...state.history.filter(item => item !== action.payload)
      ].slice(0, 10); // Keep last 10 searches
      
      return {
        ...state,
        history: newHistory
      };

    case SEARCH_ACTIONS.CLEAR_HISTORY:
      return {
        ...state,
        history: []
      };

    case SEARCH_ACTIONS.SET_FILTER:
      return {
        ...state,
        filter: action.payload
      };

    case SEARCH_ACTIONS.SET_SORT:
      return {
        ...state,
        sort: action.payload
      };

    case SEARCH_ACTIONS.CLEAR_RESULTS:
      return {
        ...state,
        results: {
          tracks: [],
          artists: [],
          albums: []
        },
        suggestions: [],
        hasResults: false,
        error: null
      };

    case SEARCH_ACTIONS.SET_HAS_RESULTS:
      return {
        ...state,
        hasResults: action.payload
      };

    default:
      return state;
  }
};

// Create context
const SearchContext = createContext();

// Custom hook to use search context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

// Search provider component
export const SearchProvider = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('search-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        history.forEach(item => {
          dispatch({ type: SEARCH_ACTIONS.ADD_TO_HISTORY, payload: item });
        });
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('search-history', JSON.stringify(state.history));
  }, [state.history]);

  // Action creators (memoized to prevent unnecessary re-renders)
  const setQuery = useCallback((query) => {
    dispatch({ type: SEARCH_ACTIONS.SET_QUERY, payload: query });
  }, []);

  const setResults = useCallback((results) => {
    dispatch({ type: SEARCH_ACTIONS.SET_RESULTS, payload: results });
  }, []);

  const setSuggestions = useCallback((suggestions) => {
    dispatch({ type: SEARCH_ACTIONS.SET_SUGGESTIONS, payload: suggestions });
  }, []);

  const setLoading = useCallback((isLoading) => {
    dispatch({ type: SEARCH_ACTIONS.SET_LOADING, payload: isLoading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: SEARCH_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const addToHistory = useCallback((query) => {
    if (query.trim()) {
      dispatch({ type: SEARCH_ACTIONS.ADD_TO_HISTORY, payload: query.trim() });
    }
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: SEARCH_ACTIONS.CLEAR_HISTORY });
    localStorage.removeItem('search-history');
  }, []);

  const setFilter = useCallback((filter) => {
    dispatch({ type: SEARCH_ACTIONS.SET_FILTER, payload: filter });
  }, []);

  const setSort = useCallback((sort) => {
    dispatch({ type: SEARCH_ACTIONS.SET_SORT, payload: sort });
  }, []);

  const clearResults = useCallback(() => {
    dispatch({ type: SEARCH_ACTIONS.CLEAR_RESULTS });
  }, []);

  const setHasResults = useCallback((hasResults) => {
    dispatch({ type: SEARCH_ACTIONS.SET_HAS_RESULTS, payload: hasResults });
  }, []);

  const value = {
    ...state,
    setQuery,
    setResults,
    setSuggestions,
    setLoading,
    setError,
    addToHistory,
    clearHistory,
    setFilter,
    setSort,
    clearResults,
    setHasResults
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;