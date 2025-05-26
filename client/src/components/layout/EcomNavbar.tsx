import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  Car, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Zap,
  Crown,
  Database,
  TrendingUp,
  Search,
  Brain
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: BarChart3,
    description: "Analytics overview"
  },
  { 
    name: "Copart Intelligence", 
    href: "/", 
    icon: Car,
    description: "Blue auction platform",
    badge: "Live"
  },
  { 
    name: "IAAI Intelligence", 
    href: "/iaai", 
    icon: TrendingUp,
    description: "Red auction platform",
    badge: "Live"
  },
  { 
    name: "Cross-Platform AI", 
    href: "/cross-platform", 
    icon: Brain,
    description: "Multi-platform analysis",
    badge: "Platinum",
    premium: true
  },
  { 
    name: "Live Copart", 
    href: "/live-copart", 
    icon: Zap,
    description: "Real-time lots"
  },
  { 
    name: "Live IAAI", 
    href: "/live-iaai", 
    icon: Search,
    description: "Real-time lots"
  },
  { 
    name: "Data Sets", 
    href: "/datasets", 
    icon: Database,
    description: "Bulk intelligence"
  }
];

export function EcomNavbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"><Crown className="w-3 h-3 mr-1" />Platinum</Badge>;
      case "GOLD":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"><Zap className="w-3 h-3 mr-1" />Gold</Badge>;
      case "ADMIN":
        return <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navigationItems[0], mobile?: boolean }) => {
    const isActive = location === item.href;
    const Icon = item.icon;
    
    return (
      <Link 
        href={item.href}
        onClick={() => mobile && setIsOpen(false)}
        className={`
          group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-primary text-primary-foreground shadow-md' 
            : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground'
          }
          ${mobile ? 'w-full' : ''}
        `}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${mobile ? 'text-base' : 'text-sm'}`}>
              {item.name}
            </span>
            {item.badge && (
              <Badge 
                variant={item.premium ? "default" : "secondary"} 
                className={`text-xs px-2 py-0 ${item.premium ? 'premium-glow' : ''}`}
              >
                {item.badge}
              </Badge>
            )}
          </div>
          {mobile && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                EcomAutos.AI
              </h1>
              <p className="text-xs text-muted-foreground leading-none">
                Auction Intelligence Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                {getTierBadge(user.role)}
              </div>
            )}

            {/* User Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-3 h-3" />
                    </div>
                    <span className="hidden md:block font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="font-medium">{user.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTierBadge(user.role)}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="w-full">
                      <Crown className="w-4 h-4 mr-2" />
                      Billing & Plans
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">EcomAutos.AI</h2>
                      <p className="text-sm text-muted-foreground">
                        Auction Intelligence
                      </p>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navigationItems.map((item) => (
                      <NavLink key={item.href} item={item} mobile />
                    ))}
                  </nav>

                  {user && (
                    <div className="mt-auto pt-4 border-t">
                      <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.role.toLowerCase()} member
                          </p>
                        </div>
                        {getTierBadge(user.role)}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}