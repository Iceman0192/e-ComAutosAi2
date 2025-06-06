import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Car, Check, ArrowRight, Shield, Globe, Zap, Eye, EyeOff, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';
import { StripeWrapper } from '@/components/StripeWrapper';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'trial'>('login');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'gold' | 'platinum'>('gold');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const plans = {
    basic: { name: 'Basic', price: 29, features: ['Core auction data', 'Basic search', 'Export tools'] },
    gold: { name: 'Gold', price: 59, features: ['Everything in Basic', 'AI Analysis', 'Advanced filters', 'Priority support'] },
    platinum: { name: 'Platinum', price: 99, features: ['Everything in Gold', 'Real-time alerts', 'API access', 'Custom reports'] }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTrialSuccess = () => {
    setLocation('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For signup, require trial flow with card capture
    if (authMode === 'signup') {
      setAuthMode('trial');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Login Successful",
          description: data.message,
        });
        
        window.location.href = '/';
      } else {
        toast({
          title: "Authentication Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrialFlow = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Choose Your Plan</h3>
        <div className="grid gap-4">
          {Object.entries(plans).map(([key, plan]) => (
            <div 
              key={key}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPlan === key 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(key as any)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {key === 'gold' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">${plan.price}/month</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlan === key 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === key && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
          <Check className="h-5 w-5" />
          <span className="font-semibold">7-Day Free Trial</span>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          Trial {plans[selectedPlan].name} plan free for 7 days, then ${plans[selectedPlan].price}/month. Cancel anytime.
        </p>
      </div>

      <StripeWrapper onSuccess={handleTrialSuccess} />
    </div>
  );

  const renderAuthForm = () => (
    <div className="space-y-6">
      {authMode === 'signup' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
            <Check className="h-5 w-5" />
            <span className="font-semibold">7-Day Free Trial Included</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Full access to all premium features. Cancel anytime.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === 'signup' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
          size="lg"
        >
          {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Start Free Trial')}
          {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <button
          onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium block mx-auto"
        >
          {authMode === 'login' 
            ? "New to e-ComAutos? Start your free trial" 
            : "Already have an account? Sign in"
          }
        </button>
        
        {authMode === 'login' && (
          <button
            onClick={() => setAuthMode('trial')}
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center justify-center mx-auto"
          >
            <CreditCard className="mr-1 h-4 w-4" />
            Start Premium Trial (Card Required)
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">e-ComAutos</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Click. Win. Export.
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to the Future of
                <span className="text-blue-600 block">Vehicle Auctions</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                Join thousands who use e-ComAutos to Click. Win. Export vehicles worldwide.
              </p>
            </div>

            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {authMode === 'login' ? 'Sign In to e-ComAutos' : 
                   authMode === 'trial' ? 'Start Your Premium Trial' :
                   'Join e-ComAutos Today'}
                </CardTitle>
                <CardDescription>
                  {authMode === 'login' 
                    ? 'Access your vehicle auction dashboard' 
                    : authMode === 'trial'
                    ? '7 days free, then $29/month. Card required but not charged during trial.'
                    : 'Start your 7-day free trial - no credit card required'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {authMode === 'trial' ? renderTrialFlow() : renderAuthForm()}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose e-ComAutos?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                The most comprehensive vehicle auction platform designed for modern buyers.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Global Access
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Access auction data from Copart and IAAI with real-time updates and comprehensive vehicle histories.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    AI-Powered Analysis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Get intelligent insights with our advanced AI analysis of vehicle conditions, market trends, and investment opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Secure & Reliable
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Bank-level security with 99.9% uptime. Your data and transactions are always protected.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
              <p className="mb-4">
                Join over 10,000+ dealers and exporters who trust e-ComAutos for their vehicle sourcing needs.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4" />
                <span>Cancel anytime during trial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}