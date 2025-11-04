import React, { useState, useEffect, useRef, useMemo } from 'react';
import './VirtualizedList.css';

const VirtualizedList = ({
  items = [],
  itemHeight = 64,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleRange = useMemo(() => {
    const containerHeightValue = typeof containerHeight === 'number' 
      ? containerHeight 
      : containerRef.current?.clientHeight || 400;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeightValue) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const handleScroll = (e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    
    if (onScroll) {
      onScroll(e);
    }
  };

  useEffect(() => {
    // Reset scroll position when items change significantly
    if (containerRef.current && items.length === 0) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  const containerStyle = {
    height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
    ...props.style
  };

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={containerStyle}
      onScroll={handleScroll}
      {...props}
    >
      <div 
        className="virtualized-list__spacer"
        style={{ height: totalHeight }}
      >
        <div 
          className="virtualized-list__content"
          style={{ 
            transform: `translateY(${offsetY}px)`,
            height: (visibleRange.endIndex - visibleRange.startIndex + 1) * itemHeight
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={item.id || actualIndex}
                className="virtualized-list__item"
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Hook for dynamic item heights (more complex virtualization)
export const useVirtualizedList = ({
  items,
  estimatedItemHeight = 64,
  containerHeight = 400,
  overscan = 5
}) => {
  const [itemHeights, setItemHeights] = useState(new Map());
  const [scrollTop, setScrollTop] = useState(0);

  const itemOffsets = useMemo(() => {
    const offsets = new Map();
    let offset = 0;
    
    for (let i = 0; i < items.length; i++) {
      offsets.set(i, offset);
      const height = itemHeights.get(i) || estimatedItemHeight;
      offset += height;
    }
    
    return offsets;
  }, [items.length, itemHeights, estimatedItemHeight]);

  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += itemHeights.get(i) || estimatedItemHeight;
    }
    return height;
  }, [items.length, itemHeights, estimatedItemHeight]);

  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const offset = itemOffsets.get(i) || 0;
      if (offset >= scrollTop - overscan * estimatedItemHeight) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    for (let i = startIndex; i < items.length; i++) {
      const offset = itemOffsets.get(i) || 0;
      if (offset >= scrollTop + containerHeight + overscan * estimatedItemHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemOffsets, items.length, overscan, estimatedItemHeight]);

  const measureItem = (index, height) => {
    setItemHeights(prev => {
      const newHeights = new Map(prev);
      newHeights.set(index, height);
      return newHeights;
    });
  };

  return {
    visibleRange,
    totalHeight,
    itemOffsets,
    measureItem,
    setScrollTop
  };
};

export default VirtualizedList;