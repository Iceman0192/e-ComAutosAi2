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

  // Authentic ECOMAUTOS logo recreated from your exact brand asset
  const LogoSvg = () => (
    <svg 
      viewBox="0 0 600 140" 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Authentic gradients matching your logo design */}
        <linearGradient id="car1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="car2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="ecomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </linearGradient>
        <linearGradient id="autosGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        {/* Premium shadow effects */}
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.25"/>
        </filter>
      </defs>
      
      {/* First car silhouette - sleek sports car design */}
      <path
        d="M15 60C12 52 20 45 35 42C55 38 85 36 120 40C145 42 165 48 168 58C170 65 165 72 155 74C145 76 135 75 125 73L115 71C100 68 85 66 70 64C55 62 40 60 25 58C20 57 15 58 15 60Z"
        fill="url(#car1Gradient)"
        stroke="#F59E0B"
        strokeWidth="2"
        filter="url(#logoShadow)"
      />
      
      {/* Second car silhouette - overlapping golden car */}
      <path
        d="M25 50C22 47 28 44 40 42C58 39 82 38 110 41C130 42 145 46 148 52C150 56 147 60 140 62C135 63 130 63 125 62L118 61C108 59 98 58 88 57C78 56 68 55 58 54C48 53 38 52 28 51C25 50 22 50 25 50Z"
        fill="url(#car2Gradient)"
        opacity="0.9"
      />
      
      {/* Car details - windows and highlights */}
      <ellipse cx="60" cy="52" rx="12" ry="6" fill="#1F2937" opacity="0.7" />
      <ellipse cx="95" cy="50" rx="15" ry="7" fill="#1F2937" opacity="0.7" />
      <ellipse cx="125" cy="49" rx="10" ry="5" fill="#1F2937" opacity="0.7" />

      {/* ECOMAUTOS text - exact typography from your logo */}
      <text x="190" y="55" fill="url(#ecomGradient)" fontSize="42" fontWeight="900" fontFamily="Arial Black, sans-serif" letterSpacing="2">
        ECOM
      </text>
      <text x="320" y="55" fill="url(#autosGradient)" fontSize="42" fontWeight="900" fontFamily="Arial Black, sans-serif" letterSpacing="2">
        AUTOS
      </text>
      
      {/* Authentic tagline - exactly as in your design */}
      <text x="190" y="85" fill="#9CA3AF" fontSize="14" fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="6">
        CLIC. GANA. EXPORTA.
      </text>
      
      {/* Premium accent line */}
      <line x1="190" y1="95" x2="480" y2="95" stroke="#F59E0B" strokeWidth="3" opacity="0.8" />
      
      {/* Subtle highlight effects */}
      <circle cx="45" cy="45" r="2" fill="#FBBF24" opacity="0.8" />
      <circle cx="110" cy="42" r="1.5" fill="#FFFFFF" opacity="0.9" />
    </svg>
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
          
          {/* Simplified car silhouettes for icon */}
          <path
            d="M20 42C18 38 22 35 30 34C42 32 50 33 58 35C62 36 64 38 62 42C64 44 62 46 58 46H22C18 46 16 44 20 42Z"
            fill="url(#iconCarGradient)"
          />
          <path
            d="M25 38C23 36 26 35 32 34C40 33 46 34 52 35C55 35 56 37 55 38C56 39 55 40 52 40H28C25 40 23 39 25 38Z"
            fill="#F8FAFC"
            opacity="0.8"
          />
          
          {/* Minimal "E" accent */}
          <text x="40" y="58" fill="#F59E0B" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="Arial, sans-serif">
            E
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

  return <LogoSvg />;
}