import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { EcomautosLogo } from '@/components/ui/ecomautos-logo';
import { 
  ArrowRight, 
  Shield, 
  Globe, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Home,
  Star,
  Sparkles,
  Brain,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'trial'>('login');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'gold' | 'platinum' | 'enterprise'>('gold');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      originalPrice: 0,
      description: 'Perfect for getting started',
      features: [
        '10 daily searches',
        '5 VIN lookups per month',
        '10 data exports per month',
        'Basic search filters',
        'Community support'
      ],
      highlight: false
    },
    basic: { 
      name: 'Basic', 
      price: 19, 
      originalPrice: 49,
      description: 'Essential features for buyers',
      features: [
        '100 daily searches',
        '50 VIN lookups per month', 
        '200 data exports per month',
        'Basic search filters',
        'Email support',
        'Mobile app access'
      ],
      highlight: false
    },
    gold: { 
      name: 'Gold', 
      price: 39, 
      originalPrice: 89,
      description: 'Most popular for serious dealers',
      features: [
        '500 daily searches',
        '200 VIN lookups per month',
        '1000 data exports per month', 
        'Advanced search filters',
        'Cross-platform search',
        'Priority support',
        'API access',
        'Advanced analytics'
      ],
      highlight: true
    },
    platinum: { 
      name: 'Platinum', 
      price: 79, 
      originalPrice: 149,
      description: 'Premium features for professionals',
      features: [
        '2000 daily searches',
        '500 VIN lookups per month',
        '5000 data exports per month',
        'Premium analytics',
        'Custom reports',
        'Priority support',
        'API access',
        'Advanced integrations'
      ],
      highlight: false
    },
    enterprise: { 
      name: 'Enterprise', 
      price: 199, 
      originalPrice: 399,
      description: 'Unlimited access for large operations',
      features: [
        'Unlimited searches',
        'Unlimited VIN lookups',
        'Unlimited data exports',
        'White-label options',
        'Dedicated support',
        'Custom integrations',
        'Team collaboration',
        'Enterprise security'
      ],
      highlight: false
    }
  };

  const benefits = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced algorithms analyze market trends in real-time"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Analytics",
      description: "Deep insights into vehicle auction markets worldwide"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and data protection"
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Access to 50+ international auction platforms"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login' 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            username: formData.username,
            name: formData.name,
            subscriptionPlan: authMode === 'trial' ? selectedPlan : 'free'
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: authMode === 'login' ? "Welcome back!" : "Account created successfully!",
          description: authMode === 'login' ? "You've been logged in." : "Welcome to ECOMAUTOS",
        });
        
        if (authMode === 'trial') {
          setLocation('/checkout');
        } else {
          window.location.reload();
        }
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen ecomautos-gradient">
      <nav className="border-b border-white/20 backdrop-blur-sm bg-slateDark/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <EcomautosLogo size="md" />
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="ecomautos-nav-link"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 ecomautos-gradient relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <g fill="none" fillRule="evenodd">
                <g fill="#ffffff" fillOpacity="0.1">
                  <circle cx="7" cy="7" r="7"/>
                </g>
              </g>
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-20 text-white">
            <div className="max-w-lg">
              <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Platform
              </Badge>
              
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                Welcome to the Future of
                <span className="block ecomautos-gradient-text">Vehicle Intelligence</span>
              </h1>
              
              <p className="text-xl text-slate-100 mb-8 leading-relaxed">
                Join thousands of successful buyers, dealers, and exporters who use our AI-powered platform to maximize profits 
                and dominate global auction markets.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-amber-400/20">
                  <div className="text-2xl font-bold text-amber-400">136,997+</div>
                  <div className="text-sm text-slate-200">Auction Records</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-amber-400/20">
                  <div className="text-2xl font-bold text-amber-400">50+</div>
                  <div className="text-sm text-slate-200">Countries Served</div>
                </div>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg border border-amber-400/30">
                      <benefit.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{benefit.title}</h4>
                      <p className="text-blue-100 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-300 fill-current" />
                  ))}
                </div>
                <p className="text-blue-100 italic mb-3">
                  "Increased our profit margins by 40% in just 3 months. The AI insights are incredible."
                </p>
                <div className="text-white font-semibold">Marcus Chen</div>
                <div className="text-blue-200 text-sm">International Dealer</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden text-center mb-8">
              <EcomautosLogo size="lg" className="justify-center mx-auto" />
            </div>

            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Free Signup
              </button>
              <button
                onClick={() => setAuthMode('trial')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  authMode === 'trial'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Start Trial
              </button>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
              <CardHeader className="text-center space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {authMode === 'login' && 'Welcome Back'}
                  {authMode === 'signup' && 'Start Free Today'}
                  {authMode === 'trial' && 'Start Your 7-Day Trial'}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {authMode === 'login' && 'Sign in to access your dashboard'}
                  {authMode === 'signup' && 'Join thousands of successful dealers'}
                  {authMode === 'trial' && 'Access premium features with no commitment'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {authMode === 'trial' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Choose Your Plan
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(plans).map(([key, plan]) => (
                        <div
                          key={key}
                          onClick={() => setSelectedPlan(key as any)}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPlan === key
                              ? 'border-gold bg-gold/10 dark:bg-gold/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${plan.highlight ? 'ring-2 ring-gold ring-opacity-50' : ''}`}
                        >
                          {plan.highlight && (
                            <Badge className="absolute -top-2 left-4 ecomautos-gradient text-white">
                              Más Popular
                            </Badge>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                                <span className="text-sm text-gray-500 line-through">${plan.originalPrice}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">/month</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode !== 'login' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="Choose username"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {authMode === 'trial' && selectedPlan !== 'free' && (
                    <>
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {plans[selectedPlan].name} Plan Features:
                        </h4>
                        <div className="space-y-1">
                          {plans[selectedPlan].features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-amber-600" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                          Payment Information
                        </Label>
                        <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cardNumber">Card Number</Label>
                              <Input
                                id="cardNumber"
                                placeholder="1234 5678 9012 3456"
                                value={formData.cardNumber || ''}
                                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                className="font-mono"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input
                                  id="expiry"
                                  placeholder="MM/YY"
                                  value={formData.expiry || ''}
                                  onChange={(e) => handleInputChange('expiry', e.target.value)}
                                  className="font-mono"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input
                                  id="cvc"
                                  placeholder="123"
                                  value={formData.cvc || ''}
                                  onChange={(e) => handleInputChange('cvc', e.target.value)}
                                  className="font-mono"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Secure payment powered by Stripe. Your card will be charged ${plans[selectedPlan].price} after the 7-day trial period.
                        </div>
                      </div>
                    </>
                  )}

                  {authMode === 'trial' && selectedPlan === 'free' && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Free Plan Features:
                      </h4>
                      <div className="space-y-1">
                        {plans[selectedPlan].features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full ecomautos-button-primary shadow-xl hover:shadow-2xl transition-all duration-300"
                    size="lg"
                  >
                    {isLoading ? 'Processing...' : (
                      <>
                        {authMode === 'trial' ? (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Start 7-Day Trial - ${plans[selectedPlan].price}/mo
                          </>
                        ) : (
                          <>
                            {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Gratis'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-4">
                  {authMode !== 'login' && (
                    <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        <span>{selectedPlan === 'free' ? 'Completely free' : 'No credit card required for free tier'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-amber-500" />
                        <span>Cancel anytime</span>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {authMode === 'login' ? (
                      <>
                        ¿No tienes cuenta?{' '}
                        <button
                          onClick={() => setAuthMode('signup')}
                          className="text-gold dark:text-gold hover:underline font-medium"
                        >
                          Regístrate gratis
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tienes cuenta?{' '}
                        <button
                          onClick={() => setAuthMode('login')}
                          className="text-gold dark:text-gold hover:underline font-medium"
                        >
                          Iniciar sesión
                        </button>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      By continuing, you agree to our{' '}
                      <a href="/company/terms" className="text-gold dark:text-gold hover:underline">
                        Términos de Servicio
                      </a>{' '}
                      y{' '}
                      <a href="/company/privacy" className="text-gold dark:text-gold hover:underline">
                        Política de Privacidad
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}