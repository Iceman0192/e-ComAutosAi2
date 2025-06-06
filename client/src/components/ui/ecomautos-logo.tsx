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

  // Exact recreation of your authentic ECOMAUTOS logo
  const LogoSvg = () => (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 580 140" 
        className={sizeClasses[size]}
        style={{ maxWidth: size === 'sm' ? '140px' : size === 'md' ? '180px' : size === 'lg' ? '240px' : '300px' }}
      >
        <defs>
          <linearGradient id="silverCarBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="goldCarBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="orangeStripe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        
        {/* Silver/White Car - Left side, more rounded modern shape */}
        <path 
          d="M30 75 
             C25 70 30 60 45 55 
             C65 50 90 48 115 50 
             C135 52 150 58 155 70 
             C158 75 155 80 145 82 
             C130 85 110 84 95 82 
             C80 80 65 78 50 77 
             C40 76 32 75 30 75 Z" 
          fill="url(#silverCarBody)" 
          stroke="#D1D5DB" 
          strokeWidth="1.5"
        />
        
        {/* Silver car windshield */}
        <path 
          d="M45 65 
             C50 60 65 58 85 60 
             C100 62 110 65 115 70 
             C112 72 100 73 85 72 
             C70 71 55 69 50 67 
             C47 66 45 65 45 65 Z" 
          fill="#1F2937" 
          opacity="0.7"
        />
        
        {/* Orange accent stripe on silver car */}
        <path 
          d="M40 58 C60 55 85 56 110 60" 
          fill="none" 
          stroke="url(#orangeStripe)" 
          strokeWidth="3" 
          opacity="0.8"
        />
        
        {/* Gold/Yellow Car - Right side, sleeker profile */}
        <path 
          d="M120 65 
             C115 58 125 50 145 47 
             C170 44 200 46 225 50 
             C245 54 255 62 258 70 
             C260 75 255 78 245 80 
             C230 82 210 81 190 79 
             C170 77 150 75 135 73 
             C125 72 118 68 120 65 Z" 
          fill="url(#goldCarBody)" 
          stroke="#D97706" 
          strokeWidth="1.5"
        />
        
        {/* Gold car windshield */}
        <path 
          d="M140 58 
             C148 54 168 53 190 55 
             C210 57 225 60 230 65 
             C225 67 210 68 190 67 
             C170 66 155 64 148 62 
             C143 60 140 58 140 58 Z" 
          fill="#1F2937" 
          opacity="0.8"
        />
        
        {/* Curved arrow/swoosh connecting the cars */}
        <path 
          d="M200 55 
             C210 50 220 52 235 57 
             C245 60 250 65 255 70" 
          fill="none" 
          stroke="#FBBF24" 
          strokeWidth="2.5" 
          opacity="0.9"
        />
        
        {/* ECOMAUTOS Text - exact positioning */}
        <text x="280" y="70" 
              fill="#F8FAFC" 
              fontSize="42" 
              fontWeight="900" 
              fontFamily="Arial Black, sans-serif" 
              letterSpacing="1">
          ECOM
        </text>
        <text x="410" y="70" 
              fill="#FBBF24" 
              fontSize="42" 
              fontWeight="900" 
              fontFamily="Arial Black, sans-serif" 
              letterSpacing="1">
          AUTOS
        </text>
        
        {/* Tagline with proper spacing */}
        <text x="280" y="95" 
              fill="#9CA3AF" 
              fontSize="12" 
              fontWeight="600" 
              fontFamily="Arial, sans-serif" 
              letterSpacing="4">
          C L I C . G A N A . E X P O R T A .
        </text>
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