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

  // Reliable ECOMAUTOS logo using CSS-based car shapes
  const LogoSvg = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Car silhouettes using CSS shapes */}
      <div className="relative flex items-center space-x-1">
        {/* Silver car */}
        <div className="relative">
          <div className="w-8 h-4 bg-gradient-to-r from-slate-100 to-slate-300 rounded-full opacity-80"></div>
          <div className="absolute top-1 left-1 w-6 h-2 bg-gradient-to-r from-slate-200 to-slate-400 rounded-full opacity-60"></div>
          <div className="absolute top-2 left-2 w-2 h-2 bg-slate-700 rounded-full opacity-50"></div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-slate-700 rounded-full opacity-50"></div>
        </div>
        
        {/* Gold car */}
        <div className="relative">
          <div className="w-7 h-3.5 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full opacity-90"></div>
          <div className="absolute top-0.5 left-0.5 w-5 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-70"></div>
          <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-slate-700 rounded-full opacity-50"></div>
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-slate-700 rounded-full opacity-50"></div>
        </div>
      </div>
      
      {/* ECOMAUTOS text */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className={`font-black tracking-tight ${textSizeClasses[size]} text-foreground dark:text-silver`}>
            ECOM
          </span>
          <span className={`font-black tracking-tight ${textSizeClasses[size]} text-primary`}>
            AUTOS
          </span>
        </div>
        {size !== 'sm' && (
          <div className="text-xs text-muted-foreground tracking-widest font-medium mt-0.5">
            CLIC · GANA · EXPORTA
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