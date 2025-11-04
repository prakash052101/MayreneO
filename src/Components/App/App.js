import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import { PlayerProvider } from '../../contexts/PlayerContext';
import { SearchProvider } from '../../contexts/SearchContext';
import { PlaylistProvider } from '../../contexts/PlaylistContext';
import AccessibilityProvider from '../AccessibilityProvider/AccessibilityProvider';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import Layout from '../Layout/Layout';
import LazyRoute from '../LazyRoute/LazyRoute';
import { 
  LazyHome, 
  LazySearch, 
  LazyLibrary, 
  LazyPlaylistView, 
  LazyPlayer,
  preloadCriticalComponents 
} from '../LazyRoutes';



// Legacy components for backward compatibility
import Playlist from "../Playlist/Playlist";
import SearchBar from "../SearchBar/SearchBar";
import SearchResults from '../SearchResults/SearchResults';
import Spotify from '../../util/spotify';

class App extends React.Component{
  constructor(props){
    super(props);

    this.state={
      SearchResults: [],
      playlistName: "New Playlist",
      playlistTracks: []
    };

    this.search=this.search.bind(this);
    this.addTrack=this.addTrack.bind(this);
    this.removeTrack=this.removeTrack.bind(this);
    this.updatePlaylistName=this.updatePlaylistName.bind(this);
    this.savePlaylist=this.savePlaylist.bind(this);
    this.removeTrackSearch=this.removeTrackSearch.bind(this);
    this.doThese=this.doThese.bind(this);
  }

  componentDidMount() {
    // Preload critical components after initial render
    setTimeout(preloadCriticalComponents, 1000);
  }

  search(term){
    Spotify.search(term).then(SearchResults=>{
      this.setState({SearchResults: SearchResults});
    });
  }

  addTrack(track){
    let tracks=this.state.playlistTracks;
    if(tracks.find(savedTrack => savedTrack.id === track.id)){
      return;
    }
    tracks.push(track);
    this.setState({playlistTracks: tracks});
  }

  removeTrack(track){
    let tracks = this.state.playlistTracks;
    let trackSearch = this.state.SearchResults;
    tracks=tracks.filter(currentTrack => currentTrack.id !== track.id );
    trackSearch.unshift(track);
    this.setState({playlistTracks: tracks});
  }

  removeTrackSearch(track){
    let tracks = this.state.SearchResults;
    tracks=tracks.filter(currentTrack => currentTrack.id !== track.id);
    this.setState({SearchResults: tracks})
  }

  doThese(track){
    this.addTrack(track);
    this.removeTrackSearch(track);
  }

  updatePlaylistName(name){
    this.setState({updatePlaylistName: name});
  }

  savePlaylist(){
    const trackUris = this.state.playlistTracks.map(track => track.uri);
    Spotify.savePlaylist(this.state.playlistName, trackUris).then( () => {
      this.setState({
        updatePlaylistName: "New Playlist",
        playlistTracks: []
      });
    });
  }

  // Legacy component for backward compatibility
  renderLegacyApp() {
    return (
      <div className="legacy-app">
        <div className="legacy-app__header">
          <h2>Legacy Playlist Manager</h2>
          <p>This is the original functionality, now available at /legacy</p>
        </div>
        <SearchBar onSearch={this.search} />
        <div className='App-playlist'>
          <SearchResults searchResults={this.state.SearchResults} 
            onAdd={this.doThese}
          />
          <Playlist playlistTracks={this.state.playlistTracks} 
            onNameChange={this.updatePlaylistName} 
            onRemove={this.removeTrack}
            onSave={this.savePlaylist}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <ErrorBoundary 
        title="Application Error"
        message="The music platform encountered an unexpected error. Please refresh the page to continue."
      >
        <AccessibilityProvider>
          <ErrorBoundary 
            title="Context Error"
            message="There was an issue with the application state. Some features may not work correctly."
          >
            <PlayerProvider>
              <SearchProvider>
                <PlaylistProvider>
                  <Router>
                    <ErrorBoundary 
                      title="Navigation Error"
                      message="There was an issue with page navigation. Please try refreshing the page."
                    >
                      <Layout>
                        <ErrorBoundary 
                          title="Page Error"
                          message="This page encountered an error. Please try navigating to a different page."
                        >
                          <Routes>
                            <Route path="/" element={<LazyRoute component={LazyHome} />} />
                            <Route path="/search" element={<LazyRoute component={LazySearch} />} />
                            <Route path="/library" element={<LazyRoute component={LazyLibrary} />} />
                            <Route path="/playlist/:id" element={<LazyRoute component={LazyPlaylistView} />} />
                            <Route path="/legacy" element={this.renderLegacyApp()} />
                          </Routes>
                        </ErrorBoundary>
                        <ErrorBoundary 
                          title="Player Error"
                          message="The music player encountered an error. Some playback features may not work."
                        >
                          <LazyRoute component={LazyPlayer} />
                        </ErrorBoundary>
                      </Layout>
                    </ErrorBoundary>
                  </Router>
                </PlaylistProvider>
              </SearchProvider>
            </PlayerProvider>
          </ErrorBoundary>
        </AccessibilityProvider>
      </ErrorBoundary>
    );
  }
}

export default App;
