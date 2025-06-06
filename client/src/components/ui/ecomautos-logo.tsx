// Using inline SVG for better compatibility

interface EcomautosLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

export function EcomautosLogo({ size = 'md', variant = 'full', className = '' }: EcomautosLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  // Authentic ECOMAUTOS logo recreated from your exact brand design
  const LogoSvg = () => (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Authentic car silhouettes matching your logo */}
      <div className="relative">
        <svg 
          width="120" 
          height="48" 
          viewBox="0 0 120 48" 
          className={sizeClasses[size]}
        >
          <defs>
            <linearGradient id="silverCar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="goldCar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="orangeAccent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          
          {/* Silver car silhouette - matching your logo shape */}
          <path 
            d="M10 30 Q15 20 35 18 Q50 16 70 18 Q85 20 90 30 Q88 35 80 36 L75 35 Q65 33 55 32 Q45 31 35 32 Q25 33 15 35 L10 36 Q8 35 10 30 Z" 
            fill="url(#silverCar)" 
            opacity="0.9"
          />
          
          {/* Gold car silhouette - overlapping like your logo */}
          <path 
            d="M35 25 Q40 15 55 13 Q70 11 85 13 Q100 15 105 25 Q103 30 95 31 L90 30 Q80 28 70 27 Q60 26 50 27 Q40 28 30 30 L25 31 Q23 30 35 25 Z" 
            fill="url(#goldCar)" 
            opacity="0.95"
          />
          
          {/* Orange accent curve like your logo */}
          <path 
            d="M45 22 Q60 18 75 20 Q85 21 90 25" 
            fill="none" 
            stroke="url(#orangeAccent)" 
            strokeWidth="2" 
            opacity="0.8"
          />
          
          {/* Car windows */}
          <ellipse cx="25" cy="27" rx="8" ry="4" fill="#1E293B" opacity="0.7" />
          <ellipse cx="45" cy="27" rx="10" ry="5" fill="#1E293B" opacity="0.7" />
          <ellipse cx="70" cy="22" rx="8" ry="4" fill="#1E293B" opacity="0.7" />
          <ellipse cx="85" cy="22" rx="8" ry="4" fill="#1E293B" opacity="0.7" />
          
          {/* Highlight effects */}
          <ellipse cx="30" cy="24" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.6" />
          <ellipse cx="75" cy="19" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.6" />
        </svg>
      </div>
      
      {/* ECOMAUTOS text matching your logo */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className={`font-black tracking-tight ${textSizeClasses[size]} text-slate-800 dark:text-white`}>
            ECOM
          </span>
          <span className={`font-black tracking-tight ${textSizeClasses[size]} text-yellow-500`}>
            AUTOS
          </span>
        </div>
        {size !== 'sm' && (
          <div className="text-xs text-slate-500 tracking-[0.3em] font-semibold mt-1">
            CLIC . GANA . EXPORTA .
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`}>
        <svg 
          viewBox="0 0 80 80" 
          className={sizeClasses[size]}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="iconCarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
            <filter id="iconShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4"/>
            </filter>
          </defs>
          
          {/* Premium background circle */}
          <circle cx="40" cy="40" r="38" fill="url(#iconBg)" filter="url(#iconShadow)" />
          <circle cx="40" cy="40" r="35" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.6" />
          
          {/* Simplified car silhouettes for icon - matching your authentic design */}
          <path
            d="M20 42C18 38 22 35 30 34C42 32 50 33 58 35C62 36 64 38 62 42C64 44 62 46 58 46H22C18 46 16 44 20 42Z"
            fill="url(#iconBg)"
            stroke="#FACC15"
            strokeWidth="1"
          />
          <path
            d="M25 38C23 36 26 35 32 34C40 33 46 34 52 35C55 35 56 37 55 38C56 39 55 40 52 40H28C25 40 23 39 25 38Z"
            fill="#FACC15"
            opacity="0.9"
          />
          
          {/* Minimal ECOM text for icon */}
          <text x="40" y="58" fill="#FACC15" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">
            ECO
          </text>
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-bold text-slate-100 dark:text-white ${textSizeClasses[size]}`}>
          ECOM<span className="text-amber-500">AUTOS</span>
        </span>
        <span className="text-xs text-gray-300 dark:text-gray-400 tracking-widest font-light">
          CLIC. GANA. EXPORTA.
        </span>
      </div>
    );
  }

  // Use inline SVG for better performance and crisp rendering
  return <LogoSvg />;
}