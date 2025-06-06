import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/ui/logo';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function SimpleLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
      
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Demo credentials for quick access
  const fillDemoCredentials = () => {
    setFormData({
      email: 'admin@ecomautos.com',
      password: 'admin123'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Logo size="lg" className="justify-center mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to e-ComAutos
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-2 pb-6">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="h-11"
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
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo Access */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillDemoCredentials}
                  className="w-full"
                >
                  Use Demo Credentials
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Quick access for testing purposes
                </p>
              </div>

              {/* Navigation */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Need an account?{' '}
                  <button
                    onClick={() => setLocation('/auth')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}