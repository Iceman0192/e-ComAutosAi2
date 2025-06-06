import { Car } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

export function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-2 ${className}`}>
        <Car className={`${sizeClasses[size]} text-white`} />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${textSizeClasses[size]} ${className}`}>
        ecomautos.ai
      </span>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-2">
        <Car className={`${sizeClasses[size]} text-white`} />
      </div>
      <span className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
        ecomautos.ai
      </span>
    </div>
  );
}