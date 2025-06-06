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

  // High-quality SVG recreation of your authentic ECOMAUTOS logo
  const LogoSvg = () => (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 580 140" 
        className={sizeClasses[size]}
        style={{ maxWidth: size === 'sm' ? '140px' : size === 'md' ? '180px' : size === 'lg' ? '240px' : '300px' }}
      >
        <defs>
          <linearGradient id="silverCarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="goldCarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="30%" stopColor="#FACC15" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="orangeAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="50%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        
        {/* Silver car silhouette - background */}
        <path 
          d="M20 70 C15 65 18 58 28 55 C40 50 65 48 95 52 C120 55 140 60 150 70 C155 75 152 82 142 85 C130 88 115 87 100 85 L85 83 C70 80 55 78 40 76 C30 75 22 73 20 70 Z" 
          fill="url(#silverCarGrad)" 
          stroke="#CBD5E1" 
          strokeWidth="1"
          opacity="0.85"
        />
        
        {/* Silver car window */}
        <ellipse cx="65" cy="67" rx="25" ry="8" fill="#1E293B" opacity="0.6" />
        <ellipse cx="110" cy="67" rx="20" ry="6" fill="#1E293B" opacity="0.6" />
        
        {/* Gold car silhouette - foreground */}
        <path 
          d="M80 60 C75 55 78 48 88 45 C100 40 125 38 155 42 C180 45 200 50 210 60 C215 65 212 72 202 75 C190 78 175 77 160 75 L145 73 C130 70 115 68 100 66 C90 65 82 63 80 60 Z" 
          fill="url(#goldCarGrad)" 
          stroke="#F59E0B" 
          strokeWidth="1"
          opacity="0.95"
        />
        
        {/* Gold car window */}
        <ellipse cx="125" cy="57" rx="25" ry="8" fill="#1E293B" opacity="0.7" />
        <ellipse cx="170" cy="57" rx="20" ry="6" fill="#1E293B" opacity="0.7" />
        
        {/* Orange accent curve */}
        <path 
          d="M90 55 Q120 50 150 53 Q170 55 185 60" 
          fill="none" 
          stroke="url(#orangeAccentGrad)" 
          strokeWidth="3" 
          opacity="0.8"
        />
        
        {/* Highlight effects */}
        <ellipse cx="75" cy="62" rx="8" ry="3" fill="#FFFFFF" opacity="0.4" />
        <ellipse cx="135" cy="52" rx="8" ry="3" fill="#FFFFFF" opacity="0.4" />
        
        {/* ECOMAUTOS Text */}
        <text x="240" y="65" fill="#FFFFFF" fontSize="48" fontWeight="900" fontFamily="Arial Black, sans-serif" letterSpacing="2">ECOM</text>
        <text x="380" y="65" fill="#FACC15" fontSize="48" fontWeight="900" fontFamily="Arial Black, sans-serif" letterSpacing="2">AUTOS</text>
        
        {/* Tagline */}
        <text x="240" y="95" fill="#94A3B8" fontSize="14" fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="6">CLIC . GANA . EXPORTA .</text>
      </svg>
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