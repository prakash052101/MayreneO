/**
 * Caching utilities for API responses and user data
 */

// Cache configuration
const CACHE_CONFIG = {
  // Cache durations in milliseconds
  SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutes
  USER_PLAYLISTS: 10 * 60 * 1000, // 10 minutes
  TRACK_DETAILS: 30 * 60 * 1000, // 30 minutes
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
  
  // Maximum cache size (number of entries)
  MAX_ENTRIES: 100,
  
  // Storage keys
  STORAGE_PREFIX: 'music_platform_cache_',
  METADATA_KEY: 'cache_metadata'
};

/**
 * In-memory cache for quick access
 */
class MemoryCache {
  constructor(maxSize = CACHE_CONFIG.MAX_ENTRIES) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.data;
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Persistent cache using localStorage
 */
class PersistentCache {
  constructor(storagePrefix = CACHE_CONFIG.STORAGE_PREFIX) {
    this.storagePrefix = storagePrefix;
    this.metadataKey = storagePrefix + CACHE_CONFIG.METADATA_KEY;
  }

  _getStorageKey(key) {
    return this.storagePrefix + key;
  }

  _getMetadata() {
    try {
      const metadata = localStorage.getItem(this.metadataKey);
      return metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Failed to read cache metadata:', error);
      return {};
    }
  }

  _setMetadata(metadata) {
    try {
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to write cache metadata:', error);
    }
  }

  get(key) {
    try {
      const storageKey = this._getStorageKey(key);
      const item = localStorage.getItem(storageKey);
      
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > parsed.expiresAt) {
        this.delete(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      return null;
    }
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    const storageKey = this._getStorageKey(key);
    const item = {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(item));

      // Update metadata
      const metadata = this._getMetadata();
      metadata[key] = {
        expiresAt: item.expiresAt,
        size: JSON.stringify(item).length
      };
      this._setMetadata(metadata);

      // Cleanup if storage is getting full
      this._cleanupIfNeeded();
    } catch (error) {
      console.warn('Failed to write to cache:', error);
      
      // If storage is full, try to clean up and retry
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(storageKey, JSON.stringify(item));
        } catch (retryError) {
          console.warn('Failed to write to cache after cleanup:', retryError);
        }
      }
    }
  }

  delete(key) {
    try {
      const storageKey = this._getStorageKey(key);
      localStorage.removeItem(storageKey);

      // Update metadata
      const metadata = this._getMetadata();
      delete metadata[key];
      this._setMetadata(metadata);

      return true;
    } catch (error) {
      console.warn('Failed to delete from cache:', error);
      return false;
    }
  }

  clear() {
    try {
      const metadata = this._getMetadata();
      
      // Remove all cached items
      for (const key in metadata) {
        const storageKey = this._getStorageKey(key);
        localStorage.removeItem(storageKey);
      }

      // Clear metadata
      localStorage.removeItem(this.metadataKey);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  cleanup() {
    const now = Date.now();
    const metadata = this._getMetadata();
    const updatedMetadata = {};

    for (const [key, meta] of Object.entries(metadata)) {
      if (now > meta.expiresAt) {
        // Remove expired item
        const storageKey = this._getStorageKey(key);
        localStorage.removeItem(storageKey);
      } else {
        updatedMetadata[key] = meta;
      }
    }

    this._setMetadata(updatedMetadata);
  }

  _cleanupIfNeeded() {
    const metadata = this._getMetadata();
    const totalEntries = Object.keys(metadata).length;

    if (totalEntries > CACHE_CONFIG.MAX_ENTRIES) {
      // Remove oldest entries
      const entries = Object.entries(metadata)
        .sort(([, a], [, b]) => a.expiresAt - b.expiresAt)
        .slice(0, Math.floor(CACHE_CONFIG.MAX_ENTRIES * 0.2)); // Remove 20%

      entries.forEach(([key]) => this.delete(key));
    }
  }

  getStats() {
    const metadata = this._getMetadata();
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;

    for (const [, meta] of Object.entries(metadata)) {
      totalSize += meta.size || 0;
      if (now > meta.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalEntries: Object.keys(metadata).length,
      totalSize,
      expiredCount,
      hitRate: this.hitRate || 0
    };
  }
}

/**
 * Combined cache with memory and persistent layers
 */
class HybridCache {
  constructor() {
    this.memoryCache = new MemoryCache();
    this.persistentCache = new PersistentCache();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  get(key) {
    // Try memory cache first
    let data = this.memoryCache.get(key);
    if (data !== null) {
      this.stats.hits++;
      return data;
    }

    // Try persistent cache
    data = this.persistentCache.get(key);
    if (data !== null) {
      // Promote to memory cache
      this.memoryCache.set(key, data, 5 * 60 * 1000); // 5 minutes in memory
      this.stats.hits++;
      return data;
    }

    this.stats.misses++;
    return null;
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    this.memoryCache.set(key, data, Math.min(ttl, 5 * 60 * 1000)); // Max 5 min in memory
    this.persistentCache.set(key, data, ttl);
    this.stats.sets++;
  }

  delete(key) {
    this.memoryCache.delete(key);
    return this.persistentCache.delete(key);
  }

  clear() {
    this.memoryCache.clear();
    this.persistentCache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  cleanup() {
    this.memoryCache.cleanup();
    this.persistentCache.cleanup();
  }

  getStats() {
    const persistentStats = this.persistentCache.getStats();
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memorySize: this.memoryCache.size(),
      ...persistentStats
    };
  }
}

// Global cache instance
const globalCache = new HybridCache();

// Cleanup expired entries periodically
setInterval(() => {
  globalCache.cleanup();
}, 10 * 60 * 1000); // Every 10 minutes

/**
 * Cache key generators
 */
export const cacheKeys = {
  search: (query) => `search:${query.toLowerCase().trim()}`,
  userPlaylists: (userId) => `playlists:${userId}`,
  trackDetails: (trackId) => `track:${trackId}`,
  userProfile: (userId) => `profile:${userId}`,
  playlistTracks: (playlistId) => `playlist_tracks:${playlistId}`
};

/**
 * Cached API wrapper
 */
export const withCache = (fn, keyGenerator, ttl = CACHE_CONFIG.SEARCH_RESULTS) => {
  return async (...args) => {
    const cacheKey = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = globalCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      globalCache.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors, but still throw them
      throw error;
    }
  };
};

/**
 * Cache management functions
 */
export const cacheManager = {
  get: (key) => globalCache.get(key),
  set: (key, data, ttl) => globalCache.set(key, data, ttl),
  delete: (key) => globalCache.delete(key),
  clear: () => globalCache.clear(),
  cleanup: () => globalCache.cleanup(),
  getStats: () => globalCache.getStats(),
  
  // Invalidate related caches
  invalidateSearch: () => {
    const stats = globalCache.getStats();
    // This would need to be implemented to remove search-related keys
    console.log('Invalidating search cache...', stats);
  },
  
  invalidateUser: (userId) => {
    globalCache.delete(cacheKeys.userProfile(userId));
    globalCache.delete(cacheKeys.userPlaylists(userId));
  }
};

// Export CACHE_CONFIG separately
export { CACHE_CONFIG };

const cacheUtilsDefault = {
  MemoryCache,
  PersistentCache,
  HybridCache,
  cacheKeys,
  withCache,
  cacheManager,
  CACHE_CONFIG
};

export default cacheUtilsDefault;