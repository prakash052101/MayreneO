import React, { useState, useMemo } from "react";
import "./SearchResults.css";
import TrackList from "../TrackList/TrackList";
import { useSearch, SEARCH_FILTERS, SORT_OPTIONS } from "../../contexts/SearchContext";

const SearchResults = ({ searchResults, onAdd, onPlay }) => {
  const { filter, sort, setFilter, setSort } = useSearch();
  const [showFilters, setShowFilters] = useState(false);

  // Process and categorize results
  const categorizedResults = useMemo(() => {
    if (!searchResults || !Array.isArray(searchResults)) {
      return { tracks: [], artists: [], albums: [] };
    }

    // For now, treat all results as tracks since the current API returns tracks
    // In a real implementation, you'd have separate endpoints for different types
    const tracks = searchResults;
    const artists = []; // Would be populated from a separate API call
    const albums = []; // Would be populated from a separate API call

    return { tracks, artists, albums };
  }, [searchResults]);

  // Filter and sort results based on current settings
  const filteredResults = useMemo(() => {
    let results = [];
    
    switch (filter) {
      case SEARCH_FILTERS.TRACKS:
        results = categorizedResults.tracks;
        break;
      case SEARCH_FILTERS.ARTISTS:
        results = categorizedResults.artists;
        break;
      case SEARCH_FILTERS.ALBUMS:
        results = categorizedResults.albums;
        break;
      default:
        results = categorizedResults.tracks; // Show tracks by default for "All"
        break;
    }

    // Sort results
    switch (sort) {
      case SORT_OPTIONS.NAME:
        results = [...results].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case SORT_OPTIONS.ARTIST:
        results = [...results].sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case SORT_OPTIONS.POPULARITY:
        results = [...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return results;
  }, [categorizedResults, filter, sort]);

  // Get result counts for each category
  const resultCounts = {
    all: categorizedResults.tracks.length + categorizedResults.artists.length + categorizedResults.albums.length,
    tracks: categorizedResults.tracks.length,
    artists: categorizedResults.artists.length,
    albums: categorizedResults.albums.length
  };

  // Tab configuration
  const tabs = [
    { key: SEARCH_FILTERS.ALL, label: 'All', count: resultCounts.all },
    { key: SEARCH_FILTERS.TRACKS, label: 'Songs', count: resultCounts.tracks },
    { key: SEARCH_FILTERS.ARTISTS, label: 'Artists', count: resultCounts.artists },
    { key: SEARCH_FILTERS.ALBUMS, label: 'Albums', count: resultCounts.albums }
  ];

  // Sort options configuration
  const sortOptions = [
    { key: SORT_OPTIONS.RELEVANCE, label: 'Relevance' },
    { key: SORT_OPTIONS.NAME, label: 'Name' },
    { key: SORT_OPTIONS.ARTIST, label: 'Artist' },
    { key: SORT_OPTIONS.POPULARITY, label: 'Popularity' }
  ];

  const handleTabClick = (tabKey) => {
    setFilter(tabKey);
  };

  const handleSortChange = (sortKey) => {
    setSort(sortKey);
    setShowFilters(false);
  };

  const totalResults = resultCounts.all;

  if (totalResults === 0) {
    return (
      <section className="search-results" aria-label="Search results">
        <div className="search-results__empty" role="status" aria-live="polite">
          <div className="search-results__empty-icon" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <h3>No results found</h3>
          <p>Try searching with different keywords or check your spelling</p>
        </div>
      </section>
    );
  }

  return (
    <section className="search-results animate-fade-in-up" aria-label="Search results">
      <div className="search-results__header">
        <div className="search-results__info">
          <h2 className="search-results__title">Search Results</h2>
          <p className="search-results__count animate-fade-in" role="status" aria-live="polite">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="search-results__controls">
          <div className="search-results__sort">
            <button
              className="search-results__sort-button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-haspopup="true"
              aria-label="Sort options"
            >
              <span>Sort by: {sortOptions.find(opt => opt.key === sort)?.label}</span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className={`search-results__sort-icon ${showFilters ? 'search-results__sort-icon--open' : ''}`}
                aria-hidden="true"
              >
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>

            {showFilters && (
              <div 
                className="search-results__sort-dropdown"
                role="menu"
                aria-label="Sort options"
              >
                {sortOptions.map(option => (
                  <button
                    key={option.key}
                    className={`search-results__sort-option ${
                      sort === option.key ? 'search-results__sort-option--active' : ''
                    }`}
                    onClick={() => handleSortChange(option.key)}
                    role="menuitem"
                    aria-current={sort === option.key ? 'true' : 'false'}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="search-results__tabs" role="tablist" aria-label="Search result categories">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`search-results__tab ${
              filter === tab.key ? 'search-results__tab--active' : ''
            }`}
            onClick={() => handleTabClick(tab.key)}
            disabled={tab.count === 0}
            role="tab"
            aria-selected={filter === tab.key}
            aria-controls={`search-results-panel-${tab.key}`}
            id={`search-results-tab-${tab.key}`}
          >
            <span className="search-results__tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className="search-results__tab-count" aria-label={`${tab.count} results`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div 
        className="search-results__content"
        role="tabpanel"
        id={`search-results-panel-${filter}`}
        aria-labelledby={`search-results-tab-${filter}`}
      >
        {filter === SEARCH_FILTERS.ALL ? (
          // Show all categories when "All" is selected
          <div className="search-results__all">
            {categorizedResults.tracks.length > 0 && (
              <div className="search-results__section">
                <h3 className="search-results__section-title">Songs</h3>
                <TrackList 
                  tracks={categorizedResults.tracks.slice(0, 5)} 
                  onAdd={onAdd}
                  onPlay={onPlay}
                  showIndex={true}
                />
                {categorizedResults.tracks.length > 5 && (
                  <button 
                    className="search-results__show-more"
                    onClick={() => setFilter(SEARCH_FILTERS.TRACKS)}
                  >
                    Show all {categorizedResults.tracks.length} songs
                  </button>
                )}
              </div>
            )}

            {categorizedResults.artists.length > 0 && (
              <div className="search-results__section">
                <h3 className="search-results__section-title">Artists</h3>
                <div className="search-results__artists">
                  {categorizedResults.artists.slice(0, 6).map(artist => (
                    <div key={artist.id} className="search-results__artist-card">
                      <div className="search-results__artist-image">
                        {artist.image ? (
                          <img src={artist.image} alt={artist.name} />
                        ) : (
                          <div className="search-results__artist-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <h4 className="search-results__artist-name">{artist.name}</h4>
                      <p className="search-results__artist-type">Artist</p>
                    </div>
                  ))}
                </div>
                {categorizedResults.artists.length > 6 && (
                  <button 
                    className="search-results__show-more"
                    onClick={() => setFilter(SEARCH_FILTERS.ARTISTS)}
                  >
                    Show all {categorizedResults.artists.length} artists
                  </button>
                )}
              </div>
            )}

            {categorizedResults.albums.length > 0 && (
              <div className="search-results__section">
                <h3 className="search-results__section-title">Albums</h3>
                <div className="search-results__albums">
                  {categorizedResults.albums.slice(0, 6).map(album => (
                    <div key={album.id} className="search-results__album-card">
                      <div className="search-results__album-image">
                        {album.image ? (
                          <img src={album.image} alt={album.name} />
                        ) : (
                          <div className="search-results__album-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <h4 className="search-results__album-name">{album.name}</h4>
                      <p className="search-results__album-artist">{album.artist}</p>
                    </div>
                  ))}
                </div>
                {categorizedResults.albums.length > 6 && (
                  <button 
                    className="search-results__show-more"
                    onClick={() => setFilter(SEARCH_FILTERS.ALBUMS)}
                  >
                    Show all {categorizedResults.albums.length} albums
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Show filtered results
          <div className="search-results__filtered">
            {filter === SEARCH_FILTERS.TRACKS && (
              <TrackList 
                tracks={filteredResults} 
                onAdd={onAdd}
                onPlay={onPlay}
                showIndex={true}
              />
            )}

            {filter === SEARCH_FILTERS.ARTISTS && (
              <div className="search-results__artists search-results__artists--full">
                {filteredResults.map(artist => (
                  <div key={artist.id} className="search-results__artist-card">
                    <div className="search-results__artist-image">
                      {artist.image ? (
                        <img src={artist.image} alt={artist.name} />
                      ) : (
                        <div className="search-results__artist-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <h4 className="search-results__artist-name">{artist.name}</h4>
                    <p className="search-results__artist-type">Artist</p>
                  </div>
                ))}
              </div>
            )}

            {filter === SEARCH_FILTERS.ALBUMS && (
              <div className="search-results__albums search-results__albums--full">
                {filteredResults.map(album => (
                  <div key={album.id} className="search-results__album-card">
                    <div className="search-results__album-image">
                      {album.image ? (
                        <img src={album.image} alt={album.name} />
                      ) : (
                        <div className="search-results__album-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <h4 className="search-results__album-name">{album.name}</h4>
                    <p className="search-results__album-artist">{album.artist}</p>
                  </div>
                ))}
              </div>
            )}

            {filteredResults.length === 0 && (
              <div className="search-results__empty">
                <p>No {filter} found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchResults;