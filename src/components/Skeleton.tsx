import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  ariaLabel?: string;
}

/**
 * Simple skeleton placeholder component.
 * Renders a shimmering block that matches the width/height of its container.
 * Accepts optional `className` to customise size/shape.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ariaLabel = "Loading" }) => (
  <div 
    className={`skeleton ${className ?? ''}`} 
    data-testid="skeleton"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label={ariaLabel}
  />
);

export default Skeleton;
