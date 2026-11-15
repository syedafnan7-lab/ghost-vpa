import React from 'react';

interface MarkProps {
  size?: number;
  className?: string;
}

/**
 * Original logotype: a canary point held in a survey reticle.
 * Shared with the public showcase website for institutional consistency.
 */
export const Mark: React.FC<MarkProps> = ({ size = 26, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="11" stroke="#9AA7B8" strokeOpacity="0.55" strokeWidth="1" />
      <path d="M16 1v4M16 27v4M1 16h4M27 16h4" stroke="#F5A524" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="#F5A524" />
    </svg>
  );
};
