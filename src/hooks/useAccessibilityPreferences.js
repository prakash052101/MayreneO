import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing user accessibility preferences
 * Detects and responds to system accessibility settings
 */
const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    // Initialize with current system preferences to avoid initial flicker
    const getInitialPreferences = () => {
      try {
        return {
          prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
          prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
          prefersLargeText: window.matchMedia('(min-resolution: 1.5dppx)').matches
        };
      } catch (error) {
        // Fallback for environments where matchMedia is not available
        return {
          prefersReducedMotion: false,
          prefersHighContrast: false,
          prefersDarkMode: false,
          prefersLargeText: false
        };
      }
    };
    return getInitialPreferences();
  });

  // Memoize the update function to prevent unnecessary re-renders
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      // Only update if the value actually changed
      if (prev[key] === value) {
        return prev;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = (e) => {
      updatePreference('prefersReducedMotion', e.matches);
    };
    reducedMotionQuery.addEventListener('change', updateReducedMotion);

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const updateHighContrast = (e) => {
      updatePreference('prefersHighContrast', e.matches);
    };
    highContrastQuery.addEventListener('change', updateHighContrast);

    // Check for dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateDarkMode = (e) => {
      updatePreference('prefersDarkMode', e.matches);
    };
    darkModeQuery.addEventListener('change', updateDarkMode);

    // Check for large text preference (approximate)
    const largeTextQuery = window.matchMedia('(min-resolution: 1.5dppx)');
    const updateLargeText = (e) => {
      updatePreference('prefersLargeText', e.matches);
    };
    largeTextQuery.addEventListener('change', updateLargeText);

    // Cleanup event listeners
    return () => {
      reducedMotionQuery.removeEventListener('change', updateReducedMotion);
      highContrastQuery.removeEventListener('change', updateHighContrast);
      darkModeQuery.removeEventListener('change', updateDarkMode);
      largeTextQuery.removeEventListener('change', updateLargeText);
    };
  }, [updatePreference]);

  // Apply preferences to document (memoized to prevent unnecessary DOM updates)
  useEffect(() => {
    const root = document.documentElement;
    
    // Batch DOM updates to prevent layout thrashing
    const updates = [
      { condition: preferences.prefersReducedMotion, className: 'reduce-motion' },
      { condition: preferences.prefersHighContrast, className: 'high-contrast' },
      { condition: preferences.prefersDarkMode, className: 'dark-mode' },
      { condition: preferences.prefersLargeText, className: 'large-text' }
    ];

    updates.forEach(({ condition, className }) => {
      if (condition) {
        root.classList.add(className);
      } else {
        root.classList.remove(className);
      }
    });
  }, [
    preferences.prefersReducedMotion,
    preferences.prefersHighContrast,
    preferences.prefersDarkMode,
    preferences.prefersLargeText
  ]);

  return preferences;
};

export default useAccessibilityPreferences;