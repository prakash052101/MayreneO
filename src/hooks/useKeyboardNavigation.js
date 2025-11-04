import { useEffect, useCallback } from 'react';

/**
 * Custom hook for managing keyboard navigation and shortcuts
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether keyboard navigation is enabled
 * @param {Object} options.shortcuts - Object mapping key combinations to functions
 * @param {Function} options.onEscape - Function to call when Escape is pressed
 * @param {boolean} options.trapFocus - Whether to trap focus within a container
 * @param {HTMLElement} options.focusContainer - Container element for focus trapping
 */
const useKeyboardNavigation = ({
  enabled = true,
  shortcuts = {},
  onEscape = null,
  trapFocus = false,
  focusContainer = null
} = {}) => {

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Handle escape key
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    // Handle focus trapping
    if (trapFocus && focusContainer && event.key === 'Tab') {
      const focusableElements = focusContainer.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Handle custom shortcuts
    const shortcutKey = getShortcutKey(event);
    if (shortcuts[shortcutKey]) {
      // Check if we're in an input field before preventing default
      const target = event.target;
      const isInInput = (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]') ||
        target.closest('.search-bar__input') ||
        target.closest('#search-bar')
      );
      
      // Don't prevent default or execute shortcut if we're in an input field
      if (!isInInput) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    }
  }, [enabled, shortcuts, onEscape, trapFocus, focusContainer]);

  // Generate shortcut key string from event
  const getShortcutKey = (event) => {
    const parts = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    // Handle special keys
    const key = event.key.toLowerCase();
    if (key === ' ') {
      parts.push('space');
    } else if (key === 'arrowleft') {
      parts.push('left');
    } else if (key === 'arrowright') {
      parts.push('right');
    } else if (key === 'arrowup') {
      parts.push('up');
    } else if (key === 'arrowdown') {
      parts.push('down');
    } else {
      parts.push(key);
    }
    
    return parts.join('+');
  };

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Focus management utilities
  const focusFirst = useCallback((container = document) => {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const focusLast = useCallback((container = document) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  return {
    focusFirst,
    focusLast
  };
};

export default useKeyboardNavigation;