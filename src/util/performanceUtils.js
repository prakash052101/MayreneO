/**
 * Performance monitoring and optimization utilities
 */
import React from 'react';

// Performance metrics collection
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing a operation
  startTiming(name) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(name, { startTime, type: 'timing' });
  }

  // End timing and record duration
  endTiming(name) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) return;

    const duration = performance.now() - metric.startTime;
    this.metrics.set(name, {
      ...metric,
      duration,
      endTime: performance.now()
    });

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  // Record a custom metric
  recordMetric(name, value, unit = '') {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      value,
      unit,
      timestamp: performance.now(),
      type: 'metric'
    });

    console.log(`📊 ${name}: ${value}${unit}`);
  }

  // Get all metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Setup performance observers
  setupObservers() {
    if (!this.isEnabled || typeof PerformanceObserver === 'undefined') return;

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('page-load-time', entry.loadEventEnd - entry.fetchStart, 'ms');
            this.recordMetric('dom-content-loaded', entry.domContentLoadedEventEnd - entry.fetchStart, 'ms');
            this.recordMetric('first-paint', entry.responseEnd - entry.fetchStart, 'ms');
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric(entry.name, entry.startTime, 'ms');
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint observer not supported:', error);
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest-contentful-paint', lastEntry.startTime, 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // Observe layout shifts
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cumulative-layout-shift', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Setup observers when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.setupObservers();
    });
  } else {
    performanceMonitor.setupObservers();
  }
}

/**
 * Higher-order component for performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.forwardRef((props, ref) => {
    React.useEffect(() => {
      performanceMonitor.startTiming(`${componentName}-mount`);
      
      return () => {
        performanceMonitor.endTiming(`${componentName}-mount`);
      };
    }, []);

    return React.createElement(WrappedComponent, { ...props, ref });
  });
};

/**
 * Hook for performance monitoring in functional components
 */
export const usePerformanceMonitoring = (componentName) => {
  React.useEffect(() => {
    performanceMonitor.startTiming(`${componentName}-render`);
    
    return () => {
      performanceMonitor.endTiming(`${componentName}-render`);
    };
  });

  return {
    startTiming: (name) => performanceMonitor.startTiming(`${componentName}-${name}`),
    endTiming: (name) => performanceMonitor.endTiming(`${componentName}-${name}`),
    recordMetric: (name, value, unit) => performanceMonitor.recordMetric(`${componentName}-${name}`, value, unit)
  };
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoization utility for expensive calculations
 */
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Bundle size analyzer (development only)
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  let totalSize = 0;
  const resources = [];

  const analyzeResource = async (element, type) => {
    try {
      const response = await fetch(element.src || element.href, { method: 'HEAD' });
      const size = parseInt(response.headers.get('content-length') || '0');
      totalSize += size;
      
      resources.push({
        type,
        url: element.src || element.href,
        size: size,
        sizeFormatted: formatBytes(size)
      });
    } catch (error) {
      console.warn(`Failed to analyze ${type}:`, element.src || element.href);
    }
  };

  Promise.all([
    ...scripts.map(script => analyzeResource(script, 'script')),
    ...styles.map(style => analyzeResource(style, 'stylesheet'))
  ]).then(() => {
    console.group('📦 Bundle Analysis');
    console.log(`Total size: ${formatBytes(totalSize)}`);
    console.table(resources.sort((a, b) => b.size - a.size));
    console.groupEnd();
  });
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = () => {
  if (!performance.memory) {
    return { supported: false };
  }

  return {
    supported: true,
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize,
    limit: performance.memory.jsHeapSizeLimit,
    usedFormatted: formatBytes(performance.memory.usedJSHeapSize),
    totalFormatted: formatBytes(performance.memory.totalJSHeapSize),
    limitFormatted: formatBytes(performance.memory.jsHeapSizeLimit)
  };
};

/**
 * FPS monitoring
 */
export const createFPSMonitor = (callback) => {
  let frames = 0;
  let lastTime = performance.now();
  
  const tick = (currentTime) => {
    frames++;
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      callback(fps);
      frames = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(tick);
  };
  
  requestAnimationFrame(tick);
};

export default {
  performanceMonitor,
  withPerformanceMonitoring,
  usePerformanceMonitoring,
  debounce,
  throttle,
  memoize,
  analyzeBundleSize,
  getMemoryUsage,
  createFPSMonitor
};