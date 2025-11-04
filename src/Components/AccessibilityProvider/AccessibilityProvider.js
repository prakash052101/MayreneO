import React from 'react';
import useAccessibilityPreferences from '../../hooks/useAccessibilityPreferences';

/**
 * Accessibility provider component that applies user preferences
 * This component wraps the app and manages accessibility settings
 */
const AccessibilityProvider = ({ children }) => {
  // Initialize accessibility preferences
  useAccessibilityPreferences();

  return <>{children}</>;
};

export default AccessibilityProvider;