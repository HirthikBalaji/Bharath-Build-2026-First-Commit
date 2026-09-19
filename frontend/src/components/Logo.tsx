import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-10 w-10', size = 40 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 shadow-md shadow-emerald-700/25 flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[85%] h-[85%]"
      >
        {/* Bus Body */}
        <rect x="22" y="16" width="56" height="66" rx="14" fill="#ffffff" />
        
        {/* Bus Windshield */}
        <path
          d="M28 24 C28 20 31 18 35 18 H65 C69 18 72 20 72 24 V40 H28 V24 Z"
          fill="#0f172a"
        />
        
        {/* Windshield glare */}
        <path d="M32 22 H46 L38 36 H28 Z" fill="#334155" fillOpacity="0.7" />

        {/* Central Resale Badge */}
        <circle cx="50" cy="54" r="16" fill="#059669" />
        
        {/* Arrows Relay Icon */}
        <path
          d="M43 51 H57 M57 51 L53 47 M57 51 L53 55"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M57 57 H43 M43 57 L47 53 M43 57 L47 61"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Headlights */}
        <circle cx="34" cy="72" r="3.5" fill="#fbbf24" />
        <circle cx="66" cy="72" r="3.5" fill="#fbbf24" />

        {/* Wheels */}
        <rect x="26" y="80" width="8" height="8" rx="2" fill="#0f172a" />
        <rect x="66" y="80" width="8" height="8" rx="2" fill="#0f172a" />

        {/* Indian Rupee Guarantee Seal */}
        <circle cx="78" cy="20" r="11" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
        <text
          x="78"
          y="24"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9"
          fontWeight="900"
          fill="#ffffff"
          textAnchor="middle"
        >
          ₹
        </text>
      </svg>
    </div>
  );
};
