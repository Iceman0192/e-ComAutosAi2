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
    <svg 
      viewBox="0 0 600 140" 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Exact gradients from your authentic logo */}
        <linearGradient id="silverCarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="30%" stopColor="#E2E8F0" />
          <stop offset="70%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="goldCarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="30%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <linearGradient id="orangeAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        {/* Premium 3D shadow effects */}
        <filter id="carShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.15"/>
        </filter>
        <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4"/>
        </filter>
      </defs>
      
      {/* Main silver/white car silhouette - exact shape from your logo */}
      <path
        d="M20 70C18 62 25 55 40 52C65 48 95 46 130 50C160 52 185 58 190 68C192 75 188 82 175 85C165 87 155 86 145 84L135 82C120 79 105 77 90 75C75 73 60 71 45 69C35 68 25 67 20 70Z"
        fill="url(#silverCarGradient)"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        filter="url(#carShadow)"
      />
      
      {/* Golden/yellow car silhouette - overlapping design from your logo */}
      <path
        d="M30 58C28 55 32 52 42 50C58 47 82 46 110 49C135 51 155 55 158 62C160 66 157 70 150 72C145 73 140 73 135 72L128 71C118 69 108 68 98 67C88 66 78 65 68 64C58 63 48 62 38 61C33 60 30 59 30 58Z"
        fill="url(#goldCarGradient)"
        stroke="#FACC15"
        strokeWidth="1"
        opacity="0.95"
      />
      
      {/* Orange accent curves - matching your logo design */}
      <path
        d="M15 65C20 60 35 58 55 60C75 62 95 65 115 67C125 68 135 69 140 65C145 61 150 60 155 62"
        fill="none"
        stroke="url(#orangeAccent)"
        strokeWidth="3"
        opacity="0.8"
      />
      
      {/* Car window details */}
      <ellipse cx="70" cy="62" rx="15" ry="8" fill="#1E293B" opacity="0.6" />
      <ellipse cx="110" cy="59" rx="18" ry="9" fill="#1E293B" opacity="0.6" />
      <ellipse cx="145" cy="57" rx="12" ry="6" fill="#1E293B" opacity="0.6" />

      {/* ECOMAUTOS text - exact from your logo */}
      <text x="210" y="62" fill="#FFFFFF" fontSize="48" fontWeight="900" fontFamily="Arial Black, sans-serif" letterSpacing="1" filter="url(#textShadow)">
        ECOM
      </text>
      <text x="340" y="62" fill="#FACC15" fontSize="48" fontWeight="900" fontFamily="Arial Black, sans-serif" letterSpacing="1" filter="url(#textShadow)">
        AUTOS
      </text>
      
      {/* Authentic tagline - exact spacing and style */}
      <text x="210" y="90" fill="#94A3B8" fontSize="12" fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="8">
        C L I C .   G A N A .   E X P O R T A .
      </text>
      
      {/* Subtle highlight effects from your design */}
      <circle cx="55" cy="55" r="2.5" fill="#FACC15" opacity="0.9" />
      <circle cx="125" cy="52" r="2" fill="#FFFFFF" opacity="0.8" />
      <ellipse cx="85" cy="58" rx="3" ry="1.5" fill="#FB923C" opacity="0.7" />
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

  return <LogoSvg />;
}