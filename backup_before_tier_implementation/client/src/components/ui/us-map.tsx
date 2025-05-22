import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface USMapProps {
  data: Array<{ state: string; count: number }>;
  onHover: (state: string | null) => void;
}

// SVG US map component
const USMap: React.FC<USMapProps> = ({ data, onHover }) => {
  // Get max count for calculating intensity
  const maxCount = Math.max(...data.map(item => item.count), 1);
  
  // Create a lookup map for quick access to state data
  const stateCounts: Record<string, number> = {};
  data.forEach(item => {
    stateCounts[item.state] = item.count;
  });
  
  // Get color intensity based on count
  const getIntensity = (stateCode: string) => {
    const count = stateCounts[stateCode] || 0;
    const intensity = count / maxCount;
    
    // Use a gradient from light to dark
    if (count === 0) return 'fill-neutral-200';
    if (intensity < 0.25) return 'fill-primary-light/30';
    if (intensity < 0.5) return 'fill-primary-light/50';
    if (intensity < 0.75) return 'fill-primary/70';
    return 'fill-primary';
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 959 593" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        {/* US States - This is a simplified version */}
        <path
          d="M161.1,453.7l-0.3-14.8l-5.8,3.9l-3.5,5.5l-0.5,2.9l-1.2,1.8l-1.8,0.5l-1.1-0.2l-2.5-1.3h-2.5l-1.2-0.7l-3.9-0.2 l-3.5-2.6l-1-3.1L131,445l-1.2-3.6l-2.7-4.2l-0.5-2.9l-1.5-2.9l-0.7-1.9l-1-1.9l-1.5-3.6l-2.3-2.3l-2.5-4.7l-1.7-1.5l-2-1.8 l-2.1-0.7l-0.2-5.8l-1.3-0.3l-1-2.6v-2.1l0.8-1.8l-0.2-3.4l-2.3-1.3l-1.2-2.3l-1.3-3.9l-0.5-2.4l-0.8-1l-1.8-9.4l-1.5-2.6 v-1.3l2.1-1.3l-0.2-1.6l-2.1-2.8l1.2-7.1l2-3.4l-0.3-2.3l-1.5-1.4l-0.5-2.6l1-3.9l7.3-25.8l3.9-13.5l1.5-2.9l0.8-2.9l2.3-5.7 l0.5-3.2l3.1-5.2l-0.2-2.6l-1.8-1l-0.5-1.1L118,292l-1.8-5.5l0.8-2.1l1.5-2.1l0.5-2.6v-5.7L118,270l-3.2-1.5l-1.8-1.6 l-0.8-2.9l1.3-1.3l5.2,2.1l2.3-0.3l4.2-2.1l2.3-1.3l3.1,2.3l2.9,1.3l2.6-8.5l-2.9-2.3h-2.9l-1.8-3.2l-4.7-1l-1.4-2l-5.5-2.9 l-1.8-2.4l-1.2-1.4l-1,0.8l-0.2,1.8l-4.2,10.3h-2.1l-2.6-2.9l-2.1-0.8l-3.7-0.2l-4.5-1.3l-1.6-2.6l-2.6-2.6l-2.9-2.3l-3.9-2.1 l1.6-2.4l1.3-5.8l-0.3-3.6L62,231.2l1.6-1.5l0.3-2.6l-0.8-1.8l-1.6-0.5l0.5-1.6l1.3-1.5l4.5,1.5l1.5-0.8l2.3-3.4l2.3-1.6l2.1-1.6 l2.9-0.5l2.6-1.3l0.3-5.5l1.8-3.1l2.9-0.3l1-3.4l4-5.7l3.9-6.3l0.8-1.6l4.7-5.5l0.2-3.7l1.1-3.6l2.3-3.4l3.7-3.9l2.3-3.6 l0.6-4.2l3.9,0.5l2.3-1.3l5.2-4.7l3.9-3.9l3.2-1.1l0.3-1.1l2.6-0.8l3.9-0.2l2.1-1.1l2.3-1.3l2.3,0.8l1.6,2.3l0.2,2.1l2.1,1.6 l2.1-0.5l2.3-3.1v-2.3l1.8-1l2.3,2.3l2.1,3.9h4.4l1.6-0.8l2.3-2.9l3.1-2.1l3.1,1.1l1.3,2.4l2.1,3.6l5.2,2.4l1.3,2.3l-1,5.5 l1.5,3.7l1.3,2.9"
          className={cn('stroke-neutral-500', getIntensity('CA'))}
          onMouseEnter={() => onHover('CA')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M130.6,172.3l2-2.2l-0.8-1.5l-1.5-1.5l-2.5-0.8l-2.4-1.1l-1.7-1.1l-2.1-1.3l-0.5-6.9l2.2-3.2l2.6-3.8l0.4-1l0.5-12 l-2.9-0.7l-2.8-0.1l-3.3,0.1l-3.5,0.7l0.2,2l-0.1,2.2h-4.8l-4.3,1.5l-3.5,1.5l-1.9,1.8l1.1,3.3l2.4,3.3l2.8,3.8l-7.2,16.5l-7.2,16 l-5.6,14.9l-1.6,0.1l-1.7-1.1l-2.5,0.1l-3.7,0.4l-3.2,1.3l-2.7,2l0.6,2.5v2.4l-1.7,3.6v4.8l-0.8,6.1l-1.7,6.2l-0.9,5.8l1.7,4.8 l0.2,3.3l-1.1,5.5l-2,5.5l-0.7,5.9l-2.6,6.1l-1.1,4.1l-2.6,9.4l-3.7,11.5L53,301l35.9,8.5l31.3,7.3L191.5,325l3.2-19.3l2.8-18.3 l1.1-11.2l1.8-8.4l1.8-8.9l1.3-6.9l1.8-8.4l1.8-8.4v-5.4l3.3-20.5l2.5-16.9l1-11.7L130.6,172.3z"
          className={cn('stroke-neutral-500', getIntensity('OR'))}
          onMouseEnter={() => onHover('OR')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M132.6,178.9l-0.1-7.6l2.7-0.3l4.9-0.5l1.3,1.2l1.5,1.4l3.5,1.1l4.8,1.2l3.8,4.1l3.9,1.4l0.5,2.5l-0.5,1.8L160,185 l-0.2,1l-2.9,1l-0.8,1.1l-2.5,0.1l-0.5-1.1l-5.2,2.1l-2.3,1.9l-1.4,2.3l-1.8,0.9l-1.1,0.5l-4.5-1.2l-1.9-1.7L132.6,178.9z"
          className={cn('stroke-neutral-500', getIntensity('ID'))}
          onMouseEnter={() => onHover('ID')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M164.2,195.2l1.9-2.2l2.2-0.1l0.5-1.5l1.3-0.5l1.5,0.4h3.4l0.5-0.8l2-0.5l2.5-1.6l1-0.5l-1-2.8l-1.5-1.1l-2.5-2.5 l-1.1-3.5l-0.3-2.5l1.3-5.4l2.5-3.8l0.6-1.9l0.9-2l-0.9-0.9l-0.9-3.5l-2.3-3.6l-2.4-3.3l-2.9-0.9l-3.5-0.4l-5.3,1 l-2.4-0.6l-2.8-1.3l-1.9,1.8l-0.4,1.1l-2.1,2.3l-3.6,1.4l-4.5-0.3l-2.4-1l-1.1,0.4v5.8l8.1,2.8l-8.1,15.2l1.1,1.1l8.3,1.1 l-2.8,3.4l-2.6,3.1l-3.3,3.9l-0.4,1.1l0.7,1.6l12.4,3.1L164.2,195.2z"
          className={cn('stroke-neutral-500', getIntensity('MT'))}
          onMouseEnter={() => onHover('MT')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M237.8,172.1l-10.3-0.8l-41.3-3.8l-5.5,65.1l14.5,0.9l34.6,3.1l37.3,2.5L237.8,172.1z"
          className={cn('stroke-neutral-500', getIntensity('ND'))}
          onMouseEnter={() => onHover('ND')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M233.5,241.4l-14.5-0.9l-34.6-3.1l-37.3-2.5l2.5,32.8l4.3,13.2l1.9,3.6l24.4,1.6l32.5,1.3l18.9,0.8L233.5,241.4z"
          className={cn('stroke-neutral-500', getIntensity('SD'))}
          onMouseEnter={() => onHover('SD')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M175.3,358.7l40.9,2.1l41.1,1.3l-1.3-22.1L271,316l1.4-21.3l1.3-18.9l-1-5.5l-1.3-6.3l-2.1-7.1l-1.6-4.9 l-18.9-0.8l-32.5-1.3l-24.4-1.6l-0.5,2.3l-0.8,3.1l-2.6,2.9l-0.8,6.8l-1.6,6l-1.8,2.1l-0.5,4.7l-0.3,4.2l0.8,3.9l2.6,7.3l1,5.8 l1.6,1.8l0.3,2.6l-1.3,2.9v1.8l1.6,2.6l-0.8,3.4l-0.3,3.4l2.6,4.9l2.8,3.1l0.3,5.8l-1.8,5.2L175.3,358.7z"
          className={cn('stroke-neutral-500', getIntensity('NE'))}
          onMouseEnter={() => onHover('NE')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M354.3,335.7l-35.4-3.1l-39.3-2.5l-41.1-1.3l-40.9-2.1l2.3-5.8l2.2-4.5l2.6-8.7l3.3-5.6l0.5-2.9l0.7-4.8l2.4-4.5 l0.2-3.4l2.5-3.9l0.7-1.2l4.5-3.1l3.6-0.9l1-2.1l-0.7-2.9l-1.9-2.5l-0.4-2.6l1.2-5.1l0.5-5.2l-0.7-4.6l-1.8-4.2l-0.4-3.6 l2.2-0.3l1-0.8l-0.5-2.9l0.4-2.3l2-1.5l2.7-0.5l1.3-1.9l1.9-1L239,223l9.2,0.3l37.3,0.6l27.7,0.9l28.1,0.7l1.8,2.1l0.8,2.2 l2.1,3.1l1.8,1.8l0.8,1.2l-0.7,2.5l2.5,4.9l2.5,0.9h1.5l1.6-0.9l1.8,0.7l2.1,2.7v2.9l0.7,0.9l2.5,0.9l2.5,2.1h4.1l5.9,2.5 l2.7,2.2l0.9,1.8l0.7,2.4l-2.3,1.8l0.7,4.2l-1.4,3.9L354.3,335.7z"
          className={cn('stroke-neutral-500', getIntensity('KS'))}
          onMouseEnter={() => onHover('KS')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M370,394.7l-35.7-2.2l-36.5-1.9L254,388l1.1-18.5l-4.4-24.2l35.4,3.1l39.3,2.5l38.9,1.9l1.4,10.8L370,394.7z"
          className={cn('stroke-neutral-500', getIntensity('OK'))}
          onMouseEnter={() => onHover('OK')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M304.7,501.6l-5.6-1.8l-5.5,0.1l-1.1,0.8l1.6,1.5l-0.3,2.3l-4.2,0.3l1.1,2.2l-0.2,1.9l-2.2,2.3l-0.2,7.2l-3,2.8 l1.6,1.2l-0.7,3.7l-1.8,3.2l0.8,2.3l0.3,4.5l-2.2,1l1.1,2.3v2.4l1.8,1.5l1.8,3.7l2.6,1.3l-0.5,2.3l-1.3,1.3l-3.7,1.6l-1.6,1.6 l-1.6,0.8l-1.9,5.2l-1.2,4.2L273,566v1.5l1.6,4.9l0.8,2.8l1.6,2.9l0.3,2.2l4.8,3.9l0.2,2l-1.8,1.5l2.1,1l-0.2,4.1l-4.7,0.8 l0.8,2.3l2.1,2.3l0.2,3.2l3.3,3.2l2.3-3.4l1-3.9l3.1,0.2l0.2,5.4l3.7,3.6l1.6-0.6l3.3-2.5l3.3,1.3l3.4,1l3.9-0.5l3.7-3.2l0.8-3 l-1.9-1.9l-0.2-1.5l2.1-0.5l1-1.7l-1.3-6.5l-3.2-3.9l-5.8-1.8h-5.4l-0.8-2.7l-3.4-3.2l-1.2-4.4l-2.5-0.8l-0.3-8.2l2.3-10.3l0.8-0.5 l0.8-2.5l1.1-0.3l2.3,0.8h1.1l3.3-4.1l0.2-6.4l0.5-0.5l3.1,1.3l1.6,0.5l1.9-3.8l3.3-3.5l3.5-4.9l4-3.6l1-1.5l-0.5-0.8l1.8-2v-1.1 l-2.3-0.3l-2.1,0.3l-1.8,1l-1.9,1.6l-1.3,0.3l-1.3-1.3l-0.6-1.3l0.6-0.6l3.1-0.3l0.6-0.6l-1.8-1v-0.5h3.9l0.3-0.8l-1.3-1.5l-17-15.3 l-16.5-14.9l-16.1-14.5l-16.1-14.4l-1.9-1.2l-9,11.4l-2,2.5l-7.1,8.8l-7.1,8.8v2.2L304.7,501.6z"
          className={cn('stroke-neutral-500', getIntensity('TX'))}
          onMouseEnter={() => onHover('TX')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M369.5,562.9l-0.8-6.6l0.5-2.8h-1.1l-1.8,3.1l-7.5,6.9l-0.3,0.8l1.3,9.6l1.8,1.1h2.4l2-4.2l3.7-7.8L369.5,562.9z"
          className={cn('stroke-neutral-500', getIntensity('FL'))}
          onMouseEnter={() => onHover('FL')}
          onMouseLeave={() => onHover(null)}
        />
        <path
          d="M461.5,552.2l-6.8-4.5h-1.8l-1.5-1.5l-3-1.3l-0.3-1.3l1.3-1l0.3-1.3l-0.8-1.3l-1.8-3.8l-3.5-5.8l-2.3-3.3 l-1.5-0.5l-1.8-1.5l-2-1v-0.3l-1.5-2.3l-2.3-5.5l-2.8-4.8l-2.3-5.5l-3.5-5.3l-3.3-3.5l1.8-4.9l1.8-1.5l0.5-2.9v-3.4l-1.5-0.5 l-1.3,0.8l-3.3-2l-3.1,1.3l-1.3,6.5l-2.3,0.8l-0.8,4l1.5,4.2l0.5,1.3l-0.5,1.5l3,7.7l-0.8,3.1l-2.8,3l1.8,4h-0.8l-1.8-0.8 l-8-0.3l-9.8,0.3h-19.5l-12.5,0.5l-7.8,0.5l-9.8,0.5l-9,1l1.3,3.5l-2,5.5l2.5,0.5l2.5,2.8l0.8,4.9l3.1,3.9l0.8,3.5l3.3,7.5 l3.5,5.1h1l0.8-1.6l-1-3.9L337,542l0.3-3.3l1.5-0.8l2-2.5l2.3-3.8l0.3-5.1l1.3-3.3l1.3,0.8h0.8l-0.5,2l-0.5,2.3l1,2l1,1.3 l0.8-0.3l-0.5-2.3l0.5-0.3l0.5,0.3l1,0.3l0.8,1h3.5l2-2v-2l0.8-0.8l1.8,0.5l1,2.5l1-1l0.8,1.8l1.3,0.5l1.3,2.3h3.3l1.3,1.3 l3.3-1.3l3.3,0.5l3.3,2.5h1.8l0.3,1.3l1.8,1.8l1.5-0.8l1.5-1.5l2.8,0.5l1.3,1.5l2.8,2.5h1.5l2.8-1.3l0.3,3.7l-1,1.8l1.5,2.5 l0.3,4.8l-1.3,3.3l1.3,1.5l5.3,1.5l5.2,0.8l1.5-0.8l2.8-0.8l2.3,2.8l6.6,1.5l4.5-0.8l3,1h0.8l0.8-1.8l-2-2l0.8-2l1.5-1.8l-0.8-1.8 l0.3-3.8l-1.5-3.5l-0.3-3.8l2.3-3.9L461.5,552.2z"
          className={cn('stroke-neutral-500', getIntensity('GA'))}
          onMouseEnter={() => onHover('GA')}
          onMouseLeave={() => onHover(null)}
        />
        {/* Add more state paths as needed */}
      </g>
    </svg>
  );
};

export default USMap;