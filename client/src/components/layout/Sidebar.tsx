import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

import { 
  Home,
  Car, 
  Search,
  Brain, 
  Database, 
  Users, 
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  Calculator,
  History,
  BarChart3
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const { user, hasPermission, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'Sales History',
      href: '/copart',
      icon: Search,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'Active Lot Finder',
      href: '/active-lots',
      icon: Car,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'Live Lot Analysis',
      href: '/live-copart',
      icon: Car,
      permission: 'FULL_ANALYTICS'
    },
    {
      title: 'VIN History Search',
      href: '/vin-history',
      icon: History,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'AuctionMind Pro',
      href: '/auction-mind-v2',
      icon: Brain,
      permission: 'CROSS_PLATFORM_SEARCH'
    },
    {
      title: 'Import Calculator',
      href: '/import-calculator',
      icon: Calculator,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'Datasets',
      href: '/datasets',
      icon: Database,
      permission: 'ADMIN_TOOLS'
    },
    {
      title: 'Team Management',
      href: '/team',
      icon: Users,
      permission: 'ADMIN_TOOLS'
    }
  ];

  const accountItems = [
    {
      title: 'Account Settings',
      href: '/account',
      icon: Settings,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'Usage Dashboard',
      href: '/usage',
      icon: BarChart3,
      permission: 'BASIC_SEARCH'
    },
    {
      title: 'Billing',
      href: '/billing',
      icon: CreditCard,
      permission: 'BASIC_SEARCH'
    }
  ];

  const adminItems = [
    {
      title: 'Admin Dashboard',
      href: '/admin',
      icon: Settings,
      permission: 'ADMIN_TOOLS'
    }
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return location === '/dashboard';
    if (href === '/') return location === '/' && !location.includes('/dashboard');
    if (href === '/copart') return location === '/copart';
    
    // Exact match for similar routes to prevent conflicts
    if (href === '/vin-history' && location === '/vin-history') return true;
    if (href === '/auction-mind-v2' && location === '/auction-mind-v2') return true;
    
    // For other routes, check if location starts with href but ensure it's not a partial match
    if (location.startsWith(href)) {
      const nextChar = location[href.length];
      return nextChar === undefined || nextChar === '/' || nextChar === '?';
    }
    
    return false;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full max-h-screen">
      {/* Logo and User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          e-ComAutos
        </h2>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs">
            {user?.role.toUpperCase()}
          </Badge>
          <Badge 
            variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {user?.subscriptionStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Main Navigation
          </h3>
          {navigationItems.map((item) => {
            // Check for admin-only features
            if (item.permission === 'ADMIN' && user?.role !== 'admin') return null;
            // Check other permissions
            if (item.permission !== 'ADMIN' && !hasPermission(item.permission as any)) return null;
            
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 mb-1 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Admin Section - Only for admin users */}
        {user?.role === 'admin' && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Administration
            </h3>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 mb-1 ${
                      isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Account
          </h3>
          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 mb-1 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-[60] md:hidden bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } overflow-hidden`}>
        <SidebarContent />
      </aside>
    </>
  );
}