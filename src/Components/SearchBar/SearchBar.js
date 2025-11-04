import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SearchBar.css";
import { useSearch } from "../../contexts/SearchContext";
import { useDebounce } from "../../hooks/useDebounce";

const SearchBar = ({ 
  onSearch, 
  showSuggestions = true, 
  isLoading = false, 
  hideSuggestions = false,
  variant = 'page', // 'header' or 'page'
  initialValue = ''
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const { 
    query,
    history, 
    results,
    hasResults,
    setQuery, 
    addToHistory,
    clearHistory 
  } = useSearch();
  
  const debouncedQuery = useDebounce(inputValue, 300);

  // Update input value when initialValue changes (e.g., when navigating to search page)
  useEffect(() => {
    if (initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  // Memoize the suggestion generation to avoid dependency issues
  const generateSuggestions = useCallback(() => {
    if (!showSuggestions || hideSuggestions) {
      setLocalSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Check if we have search results - if so, don't show suggestions
    if (hasResults) {
      setLocalSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debouncedQuery.trim()) {
      // Generate suggestions from search history
      const filteredHistory = history.filter(item =>
        item.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      
      // Add some common music-related suggestions
      const commonSuggestions = [
        `${debouncedQuery} songs`,
        `${debouncedQuery} artist`,
        `${debouncedQuery} album`
      ].filter(suggestion => 
        suggestion.toLowerCase() !== debouncedQuery.toLowerCase()
      );
      
      const allSuggestions = [
        ...filteredHistory,
        ...commonSuggestions
      ].slice(0, 8);
      
      setLocalSuggestions(allSuggestions);
      // Only show dropdown if we're focused and have suggestions or history
    } else {
      // When input is empty, prepare to show recent searches
      setLocalSuggestions([]);
    }
  }, [debouncedQuery, history, showSuggestions, hideSuggestions, hasResults]);

  // Update suggestions based on debounced input
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // Auto-execute search when user stops typing (after debounce) - DISABLED to prevent infinite loops
  // Users must press Enter or click Search button to execute search
  // useEffect(() => {
  //   if (debouncedQuery.trim() && onSearch && !showDropdown) {
  //     const term = debouncedQuery.trim();
  //     setQuery(term);
  //     addToHistory(term);
  //     onSearch(term);
  //   }
  // }, [debouncedQuery, onSearch, setQuery, addToHistory, showDropdown]);

  // Handle input change
  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
    // Only update query context when actually searching, not on every keystroke
  };

  // Handle search execution
  const executeSearch = (searchTerm = inputValue) => {
    const term = searchTerm.trim();
    if (term) {
      setQuery(term); // Update query context only when executing search
      addToHistory(term);
      setShowDropdown(false); // Hide suggestions immediately on search execution
      setSelectedIndex(-1);
      setLocalSuggestions([]); // Clear local suggestions
      if (onSearch) {
        onSearch(term);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    const totalItems = showDropdown ? (inputValue.trim() ? localSuggestions.length : history.length) : 0;
    
    switch (event.key) {
      case 'ArrowDown':
        if (showDropdown && totalItems > 0) {
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < totalItems - 1 ? prev + 1 : prev
          );
        }
        break;
        
      case 'ArrowUp':
        if (showDropdown && totalItems > 0) {
          event.preventDefault();
          setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (showDropdown && selectedIndex >= 0) {
          // User selected a suggestion
          const selectedItem = inputValue.trim() 
            ? localSuggestions[selectedIndex]
            : history[selectedIndex];
          setInputValue(selectedItem);
          executeSearch(selectedItem);
        } else {
          // User pressed Enter without selecting a suggestion - execute search with current input
          executeSearch();
        }
        break;
        
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
        
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    executeSearch(suggestion);
  };

  // Handle input focus - only show suggestions on focus interaction
  const handleFocus = () => {
    if (showSuggestions && !hideSuggestions) {
      // Check if we have search results displayed - if so, don't show suggestions
      if (!hasResults) {
        // Generate suggestions on focus if we don't have any yet
        if (inputValue.trim()) {
          generateSuggestions();
        }
        setShowDropdown(localSuggestions.length > 0 || history.length > 0);
      }
    }
  };

  // Handle input blur
  const handleBlur = (event) => {
    // Delay hiding dropdown to allow clicks on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(event.relatedTarget)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  // Hide suggestions when search results are available or when hideSuggestions is true
  useEffect(() => {
    if (hideSuggestions) {
      setShowDropdown(false);
      return;
    }
    
    // Hide suggestions when we have search results
    if (hasResults) {
      setShowDropdown(false);
      setLocalSuggestions([]);
    }
  }, [hasResults, hideSuggestions]);

  // Clear search history
  const handleClearHistory = (event) => {
    event.stopPropagation();
    clearHistory();
    setShowDropdown(false);
  };

  return (
    <div id="search-bar" className={`search-bar search-bar--${variant}`}>
      <div className="search-bar__input-container">
        <div className="search-bar__input-wrapper">
          <svg 
            className="search-bar__icon" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          
          <input
            ref={inputRef}
            className={`search-bar__input focus-enhanced transition-all ${isLoading ? 'search-bar__input--loading' : ''}`}
            type="text"
            placeholder={isLoading ? "Searching..." : "Search for songs, artists, or albums..."}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="off"
            disabled={isLoading}
          />
          
          {inputValue && (
            <button
              className="search-bar__clear"
              onClick={() => {
                setInputValue("");
                setShowDropdown(false);
                inputRef.current?.focus();
              }}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>

        {showDropdown && showSuggestions && !hideSuggestions && (
          <div ref={dropdownRef} className="search-bar__dropdown">
            {inputValue.trim() ? (
              // Show suggestions when typing
              <>
                {localSuggestions.length > 0 && (
                  <div className="search-bar__section">
                    <div className="search-bar__section-title">Suggestions</div>
                    {localSuggestions.map((suggestion, index) => (
                      <button
                        key={`suggestion-${index}`}
                        className={`search-bar__item ${
                          selectedIndex === index ? 'search-bar__item--selected' : ''
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <svg className="search-bar__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <span className="search-bar__item-text">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Show recent searches when input is empty
              history.length > 0 && (
                <div className="search-bar__section">
                  <div className="search-bar__section-header">
                    <div className="search-bar__section-title">Recent searches</div>
                    <button
                      className="search-bar__clear-history"
                      onClick={handleClearHistory}
                    >
                      Clear all
                    </button>
                  </div>
                  {history.map((item, index) => (
                    <button
                      key={`history-${index}`}
                      className={`search-bar__item ${
                        selectedIndex === index ? 'search-bar__item--selected' : ''
                      }`}
                      onClick={() => handleSuggestionClick(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <svg className="search-bar__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                      </svg>
                      <span className="search-bar__item-text">{item}</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      <button 
        className="search-bar__button" 
        onClick={() => executeSearch()}
        disabled={!inputValue.trim() || isLoading}
      >
        {isLoading ? (
          <div className="search-bar__loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>
          </div>
        ) : (
          'Search'
        )}
      </button>
    </div>
  );
};

export default SearchBar;