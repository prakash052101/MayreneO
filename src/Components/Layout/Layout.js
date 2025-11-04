import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Layout.css';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import SkipLinks from '../SkipLinks/SkipLinks';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get current search query from URL if on search page
  const currentQuery = location.pathname === '/search' ? (searchParams.get('q') || '') : '';

  // Handle search from header
  const handleSearch = (searchTerm) => {
    // Navigate to search page with the search term
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar when screen size changes
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Keyboard navigation for layout
  const { focusFirst } = useKeyboardNavigation({
    enabled: true,
    onEscape: isMobile && isSidebarOpen ? closeSidebar : null,
    trapFocus: isMobile && isSidebarOpen,
    focusContainer: isMobile && isSidebarOpen ? sidebarRef.current : null
  });

  // Focus management when sidebar opens/closes
  useEffect(() => {
    if (isMobile && isSidebarOpen && sidebarRef.current) {
      // Focus first element in sidebar when it opens on mobile
      setTimeout(() => {
        focusFirst(sidebarRef.current);
      }, 100);
    }
  }, [isSidebarOpen, isMobile, focusFirst]);

  return (
    <div className="layout">
      <SkipLinks />
      
      <Header 
        onToggleSidebar={toggleSidebar}
        isMobile={isMobile}
        onSearch={handleSearch}
        currentQuery={currentQuery}
      />
      
      <Sidebar 
        ref={sidebarRef}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={closeSidebar}
      />
      
      <main 
        id="main-content"
        ref={mainContentRef}
        className="layout__main"
        onClick={isSidebarOpen ? closeSidebar : undefined}
        tabIndex="-1"
        role="main"
        aria-label="Main content"
      >
        <div className="layout__content">
          {children}
        </div>
      </main>
      
      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <div 
          className="layout__overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;