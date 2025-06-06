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

  // Authentic ECOMAUTOS logo recreated from provided design
  const LogoSvg = () => (
    <svg 
      viewBox="0 0 500 120" 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Premium gradients matching authentic design */}
        <linearGradient id="carBodyGradient" x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="40%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="carAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        {/* Shadow effects for premium look */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Main car silhouette with authentic curves */}
      <path
        d="M10 55C8 48 15 42 28 40C45 35 70 33 95 36C115 38 135 42 140 50C142 55 140 62 135 65C130 67 125 68 120 67L115 66C110 65 105 64 100 63L95 62C85 60 75 59 65 58C55 57 45 56 35 55C25 54 15 53 10 55Z"
        fill="url(#carBodyGradient)"
        stroke="url(#carAccentGradient)"
        strokeWidth="1.5"
        filter="url(#dropShadow)"
      />
      
      {/* Accent car silhouette - overlapping for depth */}
      <path
        d="M20 48C18 45 22 42 30 41C42 38 58 37 75 39C88 40 100 42 105 46C107 48 106 52 103 54C100 55 97 56 94 55L90 54C86 53 82 52 78 51C70 49 62 48 54 47C46 46 38 45 30 46C24 47 20 48 20 48Z"
        fill="url(#carAccentGradient)"
        opacity="0.85"
      />
      
      {/* Window details for realism */}
      <ellipse cx="50" cy="47" rx="8" ry="4" fill="#1E293B" opacity="0.6" />
      <ellipse cx="80" cy="45" rx="12" ry="5" fill="#1E293B" opacity="0.6" />

      {/* ECOMAUTOS text with professional typography */}
      <text x="160" y="45" fill="url(#textGradient)" fontSize="36" fontWeight="800" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">
        ECOM
      </text>
      <text x="280" y="45" fill="#F59E0B" fontSize="36" fontWeight="800" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">
        AUTOS
      </text>
      
      {/* Authentic tagline with premium styling */}
      <text x="160" y="75" fill="#94A3B8" fontSize="12" fontWeight="500" fontFamily="Arial, sans-serif" letterSpacing="4">
        CLIC. GANA. EXPORTA.
      </text>
      
      {/* Subtle accent line for premium feel */}
      <line x1="160" y1="82" x2="400" y2="82" stroke="#F59E0B" strokeWidth="2" opacity="0.7" />
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