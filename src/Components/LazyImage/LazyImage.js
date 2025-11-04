import React, { useState, useRef, useEffect } from 'react';
import './LazyImage.css';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder, 
  className = '', 
  fallback,
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  const showPlaceholder = !isInView || (!isLoaded && !hasError);
  const showFallback = hasError && fallback;
  const showImage = isInView && !hasError;

  return (
    <div 
      ref={imgRef}
      className={`lazy-image ${className} ${isLoaded ? 'lazy-image--loaded' : ''}`}
      {...props}
    >
      {showPlaceholder && (
        <div className="lazy-image__placeholder">
          {placeholder || (
            <div className="lazy-image__skeleton">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
              </svg>
            </div>
          )}
        </div>
      )}
      
      {showFallback && (
        <div className="lazy-image__fallback">
          {fallback}
        </div>
      )}
      
      {showImage && (
        <img
          src={src}
          alt={alt}
          className="lazy-image__img"
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default LazyImage;