import React from 'react';

interface HeartArrowProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  fillHeart?: boolean;
  arrowColor?: string;
}

export function HeartArrow({ 
  size = 24, 
  className, 
  fillHeart = true, 
  arrowColor = "white",
  ...props 
}: HeartArrowProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      {/* Heart Shape */}
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={fillHeart ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Diagonal arrow line cutting through the heart */}
      <path
        d="M4 20 L20 4"
        stroke={arrowColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Arrow head on the top-right */}
      <path
        d="M14 4 H20 V10"
        stroke={arrowColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow feathers on the bottom-left */}
      <path
        d="M4 16 L8 20"
        stroke={arrowColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
