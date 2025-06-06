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

  // Authentic ECOMAUTOS logo based on the provided design
  const LogoSvg = () => (
    <svg 
      viewBox="0 0 400 120" 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Authentic ECOMAUTOS color gradients */}
        <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FBB040" />
        </linearGradient>
      </defs>
      
      {/* Main car silhouette - larger, more prominent */}
      <path
        d="M15 50C10 45 20 40 35 40C55 35 75 37 95 40C110 40 120 45 115 50C120 55 115 60 105 60H25C20 60 10 55 15 50Z"
        fill="url(#carGradient)"
        stroke="#F59E0B"
        strokeWidth="1"
      />
      
      {/* Accent car silhouette - smaller, overlapping */}
      <path
        d="M25 45C20 43 30 41 45 41C65 39 85 41 105 43C115 43 120 45 118 47C120 49 118 51 115 51H28C23 51 20 47 25 45Z"
        fill="url(#accentGradient)"
        opacity="0.8"
      />

      {/* ECOMAUTOS text with authentic styling */}
      <text x="140" y="40" fill="#F8FAFC" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">
        ECOM
      </text>
      <text x="240" y="40" fill="#F59E0B" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">
        AUTOS
      </text>
      
      {/* Authentic tagline */}
      <text x="140" y="65" fill="#E5E7EB" fontSize="14" fontWeight="400" fontFamily="Arial, sans-serif" letterSpacing="3">
        CLIC. GANA. EXPORTA.
      </text>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`}>
        <svg 
          viewBox="0 0 60 60" 
          className={sizeClasses[size]}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#iconGradient)" opacity="0.1" />
          <path
            d="M15 25C12 22 18 20 25 20C35 18 40 19 45 20C50 20 52 22 50 25C52 27 50 29 47 29H18C15 29 12 27 15 25Z"
            fill="url(#iconGradient)"
          />
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

  return <LogoSvg />;
}