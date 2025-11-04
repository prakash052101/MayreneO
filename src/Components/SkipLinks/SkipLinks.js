import React from 'react';
import './SkipLinks.css';

/**
 * Skip links component for keyboard navigation accessibility
 * Provides quick navigation to main content areas
 */
const SkipLinks = () => {
  const skipLinks = [
    {
      href: '#main-content',
      label: 'Skip to main content'
    },
    {
      href: '#sidebar-navigation',
      label: 'Skip to navigation'
    },
    {
      href: '#player-controls',
      label: 'Skip to player controls'
    },
    {
      href: '#search-bar',
      label: 'Skip to search'
    }
  ];

  return (
    <nav className="skip-links" aria-label="Skip navigation">
      <ul className="skip-links__list">
        {skipLinks.map((link, index) => (
          <li key={index} className="skip-links__item">
            <a 
              href={link.href}
              className="skip-links__link"
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(link.href);
                if (target) {
                  target.focus();
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SkipLinks;