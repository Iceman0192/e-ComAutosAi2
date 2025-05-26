import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Crown, 
  Database,
  Search,
  Brain,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EcomNavbar } from '../components/layout/EcomNavbar';

// Hero Section Component
function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-blue-50/30 to-purple-50/20 dark:from-background dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Star className="w-3 h-3 mr-1" />
            Professional Auction Intelligence Platform
          </Badge>
          
          <h1 className="text-display mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            EcomAutos.AI
          </h1>
          
          <p className="text-subheading text-muted-foreground mb-8 max-w-2xl mx-auto">
            Advanced auction intelligence for automotive professionals. Access real-time data from 
            Copart & IAAI with AI-powered insights and cross-platform analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!user ? (
              <>
                <Button size="lg" className="text-lg px-8 gradient-primary" asChild>
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            ) : (
              <Button size="lg" className="text-lg px-8 gradient-primary" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <BarChart3 className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">11,712+</div>
              <div className="text-sm text-muted-foreground">Authentic Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-copart mb-1">2 Platforms</div>
              <div className="text-sm text-muted-foreground">Copart & IAAI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success mb-1">Real-time</div>
              <div className="text-sm text-muted-foreground">Live Intelligence</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Platform Features Component
function PlatformFeatures() {
  const features = [
    {
      icon: Car,
      title: "Copart Intelligence",
      description: "Access Copart's vast auction database with advanced filtering and real-time lot tracking.",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      href: "/copart-search",
      badge: "Live"
    },
    {
      icon: TrendingUp,
      title: "IAAI Intelligence", 
      description: "Comprehensive IAAI auction data with historical trends and pricing analytics.",
      color: "bg-gradient-to-br from-red-500 to-red-600",
      href: "/iaai",
      badge: "Live"
    },
    {
      icon: Brain,
      title: "Cross-Platform AI",
      description: "AI-powered insights comparing prices across both platforms for maximum intelligence.",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      href: "/cross-platform",
      badge: "Platinum",
      premium: true
    },
    {
      icon: Database,
      title: "Data Sets",
      description: "Bulk intelligence downloads for enterprise analysis and reporting needs.",
      color: "bg-gradient-to-br from-gray-500 to-gray-600",
      href: "/datasets",
      badge: "Professional"
    },
    {
      icon: Zap,
      title: "Live Tracking",
      description: "Real-time lot monitoring with instant notifications and price alerts.",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      href: "/live-copart",
      badge: "Real-time"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics with trends, forecasting, and market insights.",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      href: "/dashboard",
      badge: "Pro"
    }
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-heading mb-4">Auction Intelligence Platform</h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Professional tools for automotive auction analysis, pricing intelligence, and market insights.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.href} className="auction-card group cursor-pointer border-0 shadow-lg" asChild>
                <Link href={feature.href}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge 
                        variant={feature.premium ? "default" : "secondary"}
                        className={feature.premium ? "premium-glow" : ""}
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-body">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Quick Search Component
function QuickSearchSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-heading mb-4">Start Your Search</h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto">
            Enter vehicle details to access comprehensive auction intelligence from both platforms.
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Make</label>
                <input 
                  type="text"
                  placeholder="Toyota"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <input 
                  type="text"
                  placeholder="Camry"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Year From</label>
                <input 
                  type="number"
                  placeholder="2020"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Year To</label>
                <input 
                  type="number"
                  placeholder="2025"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" asChild>
                <Link href="/copart-search">
                  <Car className="w-4 h-4 mr-2" />
                  Search Copart
                </Link>
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" asChild>
                <Link href="/iaai">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Search IAAI
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Main Export Function
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <EcomNavbar />
      <HeroSection />
      <PlatformFeatures />
      <QuickSearchSection />
    </div>
  );
}