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
    setIsLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
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
          title: authMode === 'login' ? "Login Successful" : "Account Created",
          description: data.message,
        });
        
        // Force a page reload to refresh auth state
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
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
          {/* Left Side - Auth Card */}
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
                {!isLogin && (
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
                  {!isLogin && (
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
                          required={!isLogin}
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
                          required={!isLogin}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                    size="lg"
                  >
                    {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Start Free Trial')}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {isLogin 
                      ? "New to e-ComAutos? Start your free trial" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Benefits */}
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
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Click - Instant Search
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Access millions of vehicles across Copart and IAAI with AI-powered search filters 
                    and real-time availability updates.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Win - Smart Bidding
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    AI damage assessment, repair cost estimates, and market value predictions 
                    to maximize your winning potential and ROI.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Export - Global Shipping
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Integrated shipping solutions with customs handling, tracking, 
                    and door-to-door delivery anywhere in the world.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Start Your Free Trial Today</h3>
              <p className="text-blue-100 mb-4">
                7 days of full access to all premium features. No credit card required.
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