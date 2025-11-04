import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Search.css';
import SearchResults from '../../Components/SearchResults/SearchResults';
import Loading from '../../Components/Loading/Loading';
import ErrorMessage from '../../Components/ErrorMessage/ErrorMessage';
import { useSearch } from '../../contexts/SearchContext';
import { usePlayer } from '../../contexts/PlayerContext';
import Spotify from '../../util/spotify';
import { cacheManager } from '../../util/cacheUtils';

const Search = () => {
  const { 
    query, 
    results, 
    isLoading, 
    error,
    setResults, 
    setLoading, 
    setError,
    addToHistory,
    setQuery 
  } = useSearch();
  
  const { playTrack } = usePlayer();
  const [searchParams] = useSearchParams();

  // Function to clear search cache for a specific query
  const clearSearchCache = useCallback((searchTerm) => {
    const cacheKey = `search:${searchTerm.toLowerCase().trim()}`;
    cacheManager.delete(cacheKey);
    console.log('Cleared cache for:', cacheKey);
  }, []);

  // Perform search operation
  const performSearch = useCallback(async (searchTerm) => {
    const trimmedQuery = searchTerm.trim();
    
    if (!trimmedQuery) {
      setResults({ tracks: [], artists: [], albums: [] });
      return;
    }

    console.log('Performing search for:', trimmedQuery);
    setLoading(true);
    setError(null);
    
    try {
      const tracks = await Spotify.search(trimmedQuery);
      console.log('Search completed, found', tracks?.length || 0, 'tracks');
      
      const searchResults = {
        tracks: tracks || [],
        artists: [],
        albums: []
      };
      
      setResults(searchResults);
      addToHistory(trimmedQuery);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search. Please try again.');
      setResults({ tracks: [], artists: [], albums: [] });
    } finally {
      setLoading(false);
    }
  }, [setResults, setLoading, setError, addToHistory]);

  // Handle URL query changes
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    console.log('URL search params changed. Query:', urlQuery);
    
    if (urlQuery) {
      const trimmedQuery = urlQuery.trim();
      
      // Clear previous results immediately to prevent showing stale data
      setResults({ tracks: [], artists: [], albums: [] });
      setError(null);
      
      // Update context query to match URL
      setQuery(trimmedQuery);
      
      // Perform search
      performSearch(trimmedQuery);
    } else {
      // No query, clear everything
      setQuery('');
      setResults({ tracks: [], artists: [], albums: [] });
      setError(null);
    }
  }, [searchParams, setQuery, performSearch, setResults, setError]);

  const handleAddTrack = (track) => {
    // This will be connected to playlist context later
    console.log('Add track to playlist:', track);
  };

  const handlePlayTrack = (track) => {
    playTrack(track, [track], 0);
  };

  const totalResults = results.tracks.length + results.artists.length + results.albums.length;
  const hasSearched = query.trim().length > 0;

  return (
    <div className="search">
      <div className="search__content">
        {isLoading && (
          <Loading 
            text="Searching for music..." 
            size="large"
            className="search__loading"
          />
        )}

        {error && (
          <ErrorMessage 
            error={error}
            onRetry={() => {
              const urlQuery = searchParams.get('q');
              if (urlQuery) {
                clearSearchCache(urlQuery);
                performSearch(urlQuery.trim());
              }
            }}
            className="search__error"
          />
        )}

        {!isLoading && !error && hasSearched && totalResults === 0 && (
          <div className="search__empty">
            <div className="search__empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <h2>No results found</h2>
            <p>Try searching with different keywords or check your spelling</p>
          </div>
        )}

        {!isLoading && !error && !hasSearched && (
          <div className="search__placeholder">
            <div className="search__placeholder-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <h2>Search for music</h2>
            <p>Find your favorite songs, artists, and albums</p>
          </div>
        )}

        {!isLoading && !error && totalResults > 0 && (
          <SearchResults 
            searchResults={results.tracks}
            onAdd={handleAddTrack}
            onPlay={handlePlayTrack}
          />
        )}
      </div>
    </div>
  );
};

export default Search;