import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EcomautosLogo } from '@/components/ui/ecomautos-logo';
import { Car, Menu, X, ChevronDown } from 'lucide-react';
import { useLocation } from 'wouter';

interface NavigationProps {
  user?: any;
}

export default function Navigation({ user }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const productMenuItems = [
    { name: 'Search Analytics', href: '/product/search-analytics' },
    { name: 'AI Analysis', href: '/product/ai-analysis' },
    { name: 'Market Data', href: '/product/market-data' },
    { name: 'API Access', href: '/product/api-access' },
  ];

  const companyMenuItems = [
    { name: 'About Us', href: '/company/about' },
    { name: 'Contact', href: '/company/contact' },
    { name: 'Privacy Policy', href: '/company/privacy' },
    { name: 'Terms of Service', href: '/company/terms' },
  ];

  const supportMenuItems = [
    { name: 'Help Center', href: '/support/help' },
    { name: 'Documentation', href: '/support/documentation' },
    { name: 'Contact Support', href: '/support/contact' },
    { name: 'Status Page', href: '/support/status' },
  ];

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gold/30 dark:border-gold/20 sticky top-0 z-50 shadow-lg shadow-gold/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Authentic ECOMAUTOS Logo */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <EcomautosLogo size="sm" className="transition-transform group-hover:scale-105" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Product Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gold dark:hover:text-gold font-medium transition-colors">
                <span>Product</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                <div className="p-2">
                  {productMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gold/10 dark:hover:bg-gold/20 hover:text-gold dark:hover:text-gold rounded-lg transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Company Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gold dark:hover:text-gold font-medium transition-colors">
                <span>Company</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                <div className="p-2">
                  {companyMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gold/10 dark:hover:bg-gold/20 hover:text-gold dark:hover:text-gold rounded-lg transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Support Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                <span>Support</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                <div className="p-2">
                  {supportMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gold/10 dark:hover:bg-gold/20 hover:text-gold dark:hover:text-gold rounded-lg transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <button 
              onClick={() => handleNavigation('/pricing')}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Pricing
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => handleNavigation('/dashboard')}
                  className="ecomautos-nav-link"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={() => handleNavigation('/billing')}
                  className="ecomautos-button-primary shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Actualizar
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => handleNavigation('/auth')}
                  className="ecomautos-nav-link"
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  onClick={() => handleNavigation('/auth')}
                  className="ecomautos-button-primary shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Comenzar Gratis
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Product Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Product</h3>
                <div className="space-y-1 ml-4">
                  {productMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Company</h3>
                <div className="space-y-1 ml-4">
                  {companyMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Support Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Support</h3>
                <div className="space-y-1 ml-4">
                  {supportMenuItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleNavigation('/dashboard')}
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                    <Button 
                      onClick={() => handleNavigation('/billing')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      Upgrade
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleNavigation('/auth')}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => handleNavigation('/auth')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      Start Free Trial
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}