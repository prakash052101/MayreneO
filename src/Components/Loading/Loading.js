import React from 'react';
import './Loading.css';

const Loading = ({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false,
  className = '' 
}) => {
  const sizeClass = `loading--${size}`;
  const overlayClass = overlay ? 'loading--overlay' : '';
  
  return (
    <div className={`loading ${sizeClass} ${overlayClass} ${className}`}>
      <div className="loading__spinner">
        <div className="loading__spinner-circle"></div>
        <div className="loading__spinner-circle"></div>
        <div className="loading__spinner-circle"></div>
      </div>
      {text && <p className="loading__text">{text}</p>}
    </div>
  );
};

export default Loading;