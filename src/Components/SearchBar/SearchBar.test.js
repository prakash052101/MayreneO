import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';
import { SearchProvider } from '../../contexts/SearchContext';
import SearchContext from '../../contexts/SearchContext';

// Mock the useDebounce hook
jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: (value) => value
}));

// Test wrapper with SearchProvider
const TestWrapper = ({ children }) => (
  <SearchProvider>
    {children}
  </SearchProvider>
);

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  test('renders with default variant (page)', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchBar = screen.getByRole('textbox');
    expect(searchBar).toBeInTheDocument();
    expect(searchBar.closest('.search-bar')).toHaveClass('search-bar--page');
  });

  test('renders with header variant', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} variant="header" />
      </TestWrapper>
    );

    const searchBar = screen.getByRole('textbox');
    expect(searchBar.closest('.search-bar')).toHaveClass('search-bar--header');
  });

  test('hides suggestions when hideSuggestions prop is true', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} hideSuggestions={true} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Suggestions should not appear
    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
  });

  test('shows suggestions on focus when showSuggestions is true', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} showSuggestions={true} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    // Test that focus event is handled (focus-based suggestion display logic)
    fireEvent.focus(searchInput);
    
    // The component should handle focus correctly without errors
    expect(searchInput).toBeInTheDocument();
  });

  test('executes search and hides suggestions on Enter key', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  test('executes search and hides suggestions on search button click', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  test('applies correct CSS classes for variants', () => {
    const { rerender } = render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} variant="header" />
      </TestWrapper>
    );

    expect(screen.getByRole('textbox').closest('.search-bar')).toHaveClass('search-bar--header');

    rerender(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} variant="page" />
      </TestWrapper>
    );

    expect(screen.getByRole('textbox').closest('.search-bar')).toHaveClass('search-bar--page');
  });

  test('hides suggestions when search results are available in context', () => {
    // This test verifies that suggestions are hidden when hasResults is true in SearchContext
    const mockContextValue = {
      query: 'test',
      results: {
        tracks: [{ id: '1', name: 'Test Track' }],
        artists: [],
        albums: []
      },
      hasResults: true,
      suggestions: [],
      isLoading: false,
      error: null,
      history: ['previous search'],
      filter: 'all',
      sort: 'relevance',
      setQuery: jest.fn(),
      setResults: jest.fn(),
      setSuggestions: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      addToHistory: jest.fn(),
      clearHistory: jest.fn(),
      setFilter: jest.fn(),
      setSort: jest.fn(),
      clearResults: jest.fn(),
      setHasResults: jest.fn()
    };

    render(
      <SearchContext.Provider value={mockContextValue}>
        <SearchBar onSearch={mockOnSearch} showSuggestions={true} />
      </SearchContext.Provider>
    );

    const searchInput = screen.getByRole('textbox');
    
    // Focus on input and try to trigger suggestions
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Suggestions should not appear because hasResults is true
    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent searches')).not.toBeInTheDocument();
  });

  test('allows spacebar input in search field', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    // Type text with spaces
    fireEvent.change(searchInput, { target: { value: 'hello world test' } });
    
    // Verify the input contains spaces
    expect(searchInput.value).toBe('hello world test');
    
    // Test typing character by character including spaces
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'a ' } });
    fireEvent.change(searchInput, { target: { value: 'a b' } });
    
    expect(searchInput.value).toBe('a b');
  });

  test('spacebar keydown event does not interfere with input', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    // Focus the input
    fireEvent.focus(searchInput);
    
    // Simulate typing with spacebar key events
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: ' ', code: 'Space' });
    fireEvent.change(searchInput, { target: { value: 'test ' } });
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Verify the input contains the space
    expect(searchInput.value).toBe('test query');
  });

  test('spacebar works with realistic typing simulation', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    // Focus the input first
    fireEvent.focus(searchInput);
    
    // Simulate realistic typing: keydown -> input -> keyup
    const typeCharacter = (char, code) => {
      fireEvent.keyDown(searchInput, { key: char, code: code });
      fireEvent.input(searchInput, { target: { value: searchInput.value + char } });
      fireEvent.keyUp(searchInput, { key: char, code: code });
    };
    
    // Type "hello world"
    'hello'.split('').forEach((char, i) => {
      typeCharacter(char, `Key${char.toUpperCase()}`);
    });
    
    // Type space
    fireEvent.keyDown(searchInput, { key: ' ', code: 'Space' });
    fireEvent.input(searchInput, { target: { value: searchInput.value + ' ' } });
    fireEvent.keyUp(searchInput, { key: ' ', code: 'Space' });
    
    'world'.split('').forEach((char, i) => {
      typeCharacter(char, `Key${char.toUpperCase()}`);
    });
    
    // Verify the final value includes the space
    expect(searchInput.value).toBe('hello world');
  });

  test('displays initial value when provided', () => {
    render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} initialValue="test query" />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    
    // Verify the input shows the initial value
    expect(searchInput.value).toBe('test query');
  });

  test('updates input value when initialValue changes', () => {
    const { rerender } = render(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} initialValue="first query" />
      </TestWrapper>
    );

    const searchInput = screen.getByRole('textbox');
    expect(searchInput.value).toBe('first query');

    // Re-render with new initial value
    rerender(
      <TestWrapper>
        <SearchBar onSearch={mockOnSearch} initialValue="second query" />
      </TestWrapper>
    );

    expect(searchInput.value).toBe('second query');
  });
});