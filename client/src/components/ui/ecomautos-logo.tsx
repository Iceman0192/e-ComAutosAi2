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

  // SVG representation of the ECOMAUTOS logo based on the design
  const LogoSvg = () => (
    <svg 
      viewBox="0 0 400 120" 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Car silhouette with gradient */}
      <defs>
        <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
      
      {/* Car silhouette */}
      <path
        d="M20 45C15 40 25 35 40 35C60 30 80 32 100 35C115 35 125 40 120 45C125 50 120 55 110 55H30C25 55 15 50 20 45Z"
        fill="url(#carGradient)"
        opacity="0.9"
      />
      <path
        d="M25 40C20 38 30 36 45 36C65 34 85 36 105 38C115 38 120 40 118 42C120 44 118 46 115 46H28C23 46 20 42 25 40Z"
        fill="url(#carGradient)"
        opacity="0.7"
      />

      {/* ECOMAUTOS text */}
      <text x="140" y="35" className="fill-current text-gray-800 dark:text-white" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">
        ECOM
      </text>
      <text x="240" y="35" className="fill-current" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#F59E0B">
        AUTOS
      </text>
      
      {/* Tagline */}
      <text x="140" y="55" className="fill-current text-gray-600 dark:text-gray-300" fontSize="12" fontWeight="300" fontFamily="Arial, sans-serif" letterSpacing="2">
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
        <span className={`font-bold text-gray-800 dark:text-white ${textSizeClasses[size]}`}>
          ECOM<span className="text-yellow-500">AUTOS</span>
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-300 tracking-wider">
          CLIC. GANA. EXPORTA.
        </span>
      </div>
    );
  }

  return <LogoSvg />;
}