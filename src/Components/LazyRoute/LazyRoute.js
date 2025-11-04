import React, { Suspense } from 'react';
import Loading from '../Loading/Loading';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

const LazyRoute = ({ 
  component: Component, 
  fallback, 
  errorFallback,
  ...props 
}) => {
  const defaultFallback = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px' 
    }}>
      <Loading text="Loading page..." size="large" />
    </div>
  );

  const defaultErrorFallback = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Failed to load page</h2>
        <p>Please refresh the page or try again later.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary-color, #1db954)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyRoute;