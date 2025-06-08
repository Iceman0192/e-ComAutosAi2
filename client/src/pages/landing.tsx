import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/layout/Navigation';
import { 
  Car, 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Brain,
  BarChart3,
  Database,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning algorithms analyze millions of auction records to provide predictive insights and market trends.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Live market data with instant notifications, price alerts, and comprehensive damage analysis across all major auction platforms.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Database,
      title: "Comprehensive Database",
      description: "Access to 136,997+ verified auction records with complete vehicle histories, damage assessments, and export documentation.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Global Export Solutions",
      description: "Streamlined international shipping, customs documentation, and duty calculations for seamless global vehicle export.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { number: "136,997+", label: "Auction Records", description: "Verified vehicle data" },
    { number: "500+", label: "Daily Updates", description: "Fresh market insights" },
    { number: "50+", label: "Countries Served", description: "Global reach" },
    { number: "99.9%", label: "Uptime", description: "Reliable platform" }
  ];

  const testimonials = [
    {
      name: "Marcus Rodriguez",
      role: "International Auto Dealer",
      company: "Global Motors Ltd",
      content: "ecomautos.ai transformed our business. The AI insights helped us increase profit margins by 40% while reducing research time by 80%.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Export Specialist",
      company: "Pacific Auto Export",
      content: "The platform's export calculations and shipping integration saved us countless hours. It's like having a team of experts at your fingertips.",
      rating: 5
    },
    {
      name: "Ahmed Hassan",
      role: "Vehicle Trader",
      company: "Middle East Auto Hub",
      content: "The real-time alerts and damage analysis features give us a competitive edge. We've expanded to 12 new markets using their insights.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Free",
      period: "",
      description: "Perfect for getting started",
      features: [
        "10 daily searches",
        "5 VIN lookups per month",
        "10 data exports per month",
        "Basic search filters",
        "Community support"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Basic",
      price: "$19",
      period: "/month",
      originalPrice: "$49",
      description: "Essential features for buyers",
      features: [
        "1,000 monthly searches",
        "25 VIN history lookups",
        "100 data exports",
        "Basic analytics",
        "Email support",
        "Mobile app access"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Gold",
      price: "$39",
      period: "/month",
      originalPrice: "$89",
      description: "Most popular for serious dealers",
      features: [
        "5,000 monthly searches",
        "100 VIN history lookups",
        "500 data exports",
        "Cross-platform search",
        "Advanced analytics",
        "Priority support",
        "Bulk export tools"
      ],
      cta: "Start Trial",
      popular: true
    },
    {
      name: "Platinum",
      price: "$79",
      period: "/month",
      originalPrice: "$149",
      description: "Premium features for professionals",
      features: [
        "Unlimited searches",
        "Unlimited VIN lookups",
        "Unlimited exports",
        "AuctionMind Pro AI",
        "Market intelligence",
        "Custom reporting",
        "Premium support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* SEO Meta Tags would be handled by a helmet component */}
      <title>ecomautos.ai - AI-Powered Vehicle Auction Intelligence Platform</title>
      
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2">
                  🚀 Next-Generation AI Platform
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-gray-900 dark:text-white">The Future of</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Vehicle Auctions
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">is Here</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Harness the power of artificial intelligence to dominate global vehicle auction markets. 
                  Our platform transforms complex auction data into profitable insights, giving you the 
                  competitive edge you need to succeed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => setLocation('/product/demo')}
                  className="border-2 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                >
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Live Market Data
                      </Badge>
                      <div className="flex items-center space-x-1 text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Real-time</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {stats.map((stat, index) => (
                        <div key={index} className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                          <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Updated 2 minutes ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Everything you need to dominate
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                global auction markets
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered tools gives you unprecedented insight 
              into vehicle auction markets worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Trusted by dealers worldwide
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of successful vehicle traders who rely on our platform for market intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 font-semibold mb-1">
                  {stat.label}
                </div>
                <div className="text-blue-200 text-sm">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-purple-200 text-purple-700">
              Customer Success
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              What our customers are saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-green-200 text-green-700">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Choose the perfect plan for your business
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include our core AI features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-500 shadow-xl scale-105 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                    }`}
                    onClick={() => setLocation('/auth')}
                  >
                    {plan.cta}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your vehicle trading business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of successful dealers who use ecomautos.ai to maximize profits and minimize risks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/auth')}
              className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => setLocation('/company/contact')}
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ecomautos.ai
                </span>
              </div>
              <p className="text-gray-400">
                The world's most advanced AI-powered vehicle auction intelligence platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setLocation('/product/search-analytics')} className="hover:text-white">Search Analytics</button></li>
                <li><button onClick={() => setLocation('/product/ai-analysis')} className="hover:text-white">AI Analysis</button></li>
                <li><button onClick={() => setLocation('/product/market-data')} className="hover:text-white">Market Data</button></li>
                <li><button onClick={() => setLocation('/product/api-access')} className="hover:text-white">API Access</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setLocation('/company/about')} className="hover:text-white">About Us</button></li>
                <li><button onClick={() => setLocation('/company/contact')} className="hover:text-white">Contact</button></li>
                <li><button onClick={() => setLocation('/company/privacy')} className="hover:text-white">Privacy Policy</button></li>
                <li><button onClick={() => setLocation('/company/terms')} className="hover:text-white">Terms of Service</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setLocation('/support/help')} className="hover:text-white">Help Center</button></li>
                <li><button onClick={() => setLocation('/support/documentation')} className="hover:text-white">Documentation</button></li>
                <li><button onClick={() => setLocation('/support/contact')} className="hover:text-white">Contact Support</button></li>
                <li><button onClick={() => setLocation('/support/status')} className="hover:text-white">Status Page</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ecomautos.ai. All rights reserved. Powered by artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}