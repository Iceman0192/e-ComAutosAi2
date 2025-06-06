import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TrialSignupFormProps {
  onSuccess: () => void;
}

export function TrialSignupForm({ onSuccess }: TrialSignupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment System Loading",
        description: "Please wait for the payment system to initialize.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create setup intent for trial
      const setupResponse = await fetch('/api/auth/trial-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name
        })
      });

      if (!setupResponse.ok) {
        throw new Error('Failed to initialize payment setup');
      }

      const { clientSecret } = await setupResponse.json();

      // Step 2: Confirm setup intent with card
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.name,
            email: formData.email,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment setup failed');
      }

      // Step 3: Create user account with trial
      const signupResponse = await fetch('/api/auth/trial-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          setupIntentId: setupIntent.id
        })
      });

      if (!signupResponse.ok) {
        throw new Error('Failed to create account');
      }

      toast({
        title: "Account Created Successfully!",
        description: "Your 7-day free trial has started. No charges until trial ends.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Start Your Free Trial</CardTitle>
        <CardDescription>
          7 days free, then $29/month. Cancel anytime during trial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Your card will be securely saved but not charged during the trial.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Start Free Trial'}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
            You can cancel anytime during your trial without being charged.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}