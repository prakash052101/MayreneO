/**
 * Lazy-loaded route components for code splitting
 */
import { lazy } from 'react';

// Lazy load page components
export const LazyHome = lazy(() => 
  import('../pages/Home/Home').then(module => ({ default: module.default }))
);

export const LazySearch = lazy(() => 
  import('../pages/Search/Search').then(module => ({ default: module.default }))
);

export const LazyLibrary = lazy(() => 
  import('../pages/Library/Library').then(module => ({ default: module.default }))
);

export const LazyPlaylistView = lazy(() => 
  import('../pages/PlaylistView/PlaylistView').then(module => ({ default: module.default }))
);

// Lazy load heavy components
export const LazyPlayer = lazy(() => 
  import('./Player/Player').then(module => ({ default: module.default }))
);

export const LazySearchResults = lazy(() => 
  import('./SearchResults/SearchResults').then(module => ({ default: module.default }))
);

export const LazyPlaylistModal = lazy(() => 
  import('./PlaylistModal/PlaylistModal').then(module => ({ default: module.default }))
);

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  import('../pages/Search/Search');
  import('./Player/Player');
};

// Preload components based on user interaction
export const preloadOnHover = (componentName) => {
  switch (componentName) {
    case 'search':
      import('../pages/Search/Search');
      break;
    case 'library':
      import('../pages/Library/Library');
      break;
    case 'playlist':
      import('../pages/PlaylistView/PlaylistView');
      break;
    default:
      break;
  }
};

const lazyRoutesDefault = {
  LazyHome,
  LazySearch,
  LazyLibrary,
  LazyPlaylistView,
  LazyPlayer,
  LazySearchResults,
  LazyPlaylistModal,
  preloadCriticalComponents,
  preloadOnHover
};

export default lazyRoutesDefault;