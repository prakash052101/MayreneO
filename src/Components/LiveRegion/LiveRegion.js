import React, { useEffect, useState } from 'react';
import './LiveRegion.css';

/**
 * Live region component for announcing dynamic content changes to screen readers
 * @param {Object} props - Component props
 * @param {string} props.message - Message to announce
 * @param {string} props.politeness - ARIA live politeness level ('polite' | 'assertive')
 * @param {boolean} props.atomic - Whether the entire region should be announced
 * @param {number} props.clearDelay - Delay in ms before clearing the message
 */
const LiveRegion = ({ 
  message = '', 
  politeness = 'polite', 
  atomic = false,
  clearDelay = 3000 
}) => {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      // Clear message after delay to prevent repeated announcements
      if (clearDelay > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearDelay]);

  return (
    <div
      className="live-region"
      aria-live={politeness}
      aria-atomic={atomic}
      role="status"
    >
      {currentMessage}
    </div>
  );
};

export default LiveRegion;