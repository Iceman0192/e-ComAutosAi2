import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  Crown, 
  Zap, 
  Check, 
  Star,
  TrendingUp,
  Shield,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  reason?: string;
  feature?: string;
}

const tiers = [
  {
    name: 'Basic',
    role: 'basic',
    monthlyPrice: 29,
    yearlyPrice: 290,
    yearlyDiscount: '17%',
    color: 'bg-blue-600',
    icon: <TrendingUp className="h-5 w-5" />,
    features: [
      '1,000 monthly searches',
      '25 VIN history lookups',
      '100 data exports',
      'Basic analytics',
      'Email support'
    ],
    limits: 'Daily: 50 searches'
  },
  {
    name: 'Gold',
    role: 'gold',
    monthlyPrice: 79,
    yearlyPrice: 790,
    yearlyDiscount: '17%',
    color: 'bg-yellow-600',
    icon: <Star className="h-5 w-5" />,
    popular: true,
    features: [
      '5,000 monthly searches',
      '100 VIN history lookups',
      '500 data exports',
      'Cross-platform search',
      'Advanced analytics',
      'Priority support',
      'Bulk export tools'
    ],
    limits: 'Daily: 200 searches'
  },
  {
    name: 'Platinum',
    role: 'platinum',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    yearlyDiscount: '17%',
    color: 'bg-purple-600',
    icon: <Crown className="h-5 w-5" />,
    features: [
      'Unlimited searches',
      'Unlimited VIN lookups',
      'Unlimited exports',
      'AuctionMind Pro AI',
      'Market intelligence',
      'API access',
      'Custom reporting',
      'White-glove support'
    ],
    limits: 'No limits'
  }
];

export function UpgradePrompt({ isOpen, onClose, currentTier = 'freemium', reason, feature }: UpgradePromptProps) {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async (planRole: string) => {
    if (!user) return;
    
    setIsProcessing(true);
    setSelectedTier(planRole);

    try {
      const tier = tiers.find(t => t.role === planRole);
      if (!tier) return;

      const response = await apiRequest('POST', '/api/subscription/create-checkout', {
        planId: tier.role, // This should be the actual plan ID from the database
        billing: billingCycle
      });

      if (response.success) {
        window.location.href = response.sessionUrl;
      } else {
        console.error('Upgrade failed:', response.message);
      }
    } catch (error) {
      console.error('Error initiating upgrade:', error);
    } finally {
      setIsProcessing(false);
      setSelectedTier(null);
    }
  };

  const getCurrentTierIndex = () => {
    return tiers.findIndex(t => t.role === currentTier);
  };

  const getRecommendedTier = () => {
    if (feature === 'aiAnalysis') return 'platinum';
    if (feature === 'crossPlatform') return 'gold';
    return 'basic';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-600" />
                Upgrade Your Plan
              </DialogTitle>
              <DialogDescription className="mt-2">
                {reason || 'Unlock more powerful features for your auction intelligence needs'}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-muted rounded-lg p-1 flex">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="relative"
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => {
            const currentTierIndex = getCurrentTierIndex();
            const isCurrentTier = tier.role === currentTier;
            const isDowngrade = index <= currentTierIndex;
            const isRecommended = tier.role === getRecommendedTier();
            const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
            const monthlyEquivalent = billingCycle === 'yearly' ? tier.yearlyPrice / 12 : tier.monthlyPrice;

            return (
              <Card 
                key={tier.role} 
                className={`relative ${tier.popular ? 'ring-2 ring-blue-500' : ''} ${isRecommended ? 'ring-2 ring-green-500' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                {isRecommended && !tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white">Recommended</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${tier.color} text-white`}>
                      {tier.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <CardDescription className="text-sm">{tier.limits}</CardDescription>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${Math.round(monthlyEquivalent)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-muted-foreground">
                        ${tier.yearlyPrice}/year (save {tier.yearlyDiscount})
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentTier ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="outline" disabled className="w-full">
                      Contact Support
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUpgrade(tier.role)}
                      disabled={isProcessing}
                      className={`w-full ${tier.color} hover:opacity-90`}
                    >
                      {isProcessing && selectedTier === tier.role ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Upgrade to {tier.name}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center mt-6 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 mr-2" />
          Secure payment processing powered by Stripe
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuickUpgradeCard({ currentTier, onUpgrade }: { currentTier: string; onUpgrade: () => void }) {
  const getNextTier = () => {
    const currentIndex = tiers.findIndex(t => t.role === currentTier);
    return tiers[currentIndex + 1];
  };

  const nextTier = getNextTier();
  if (!nextTier) return null;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${nextTier.color} text-white`}>
              {nextTier.icon}
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Upgrade to {nextTier.name}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Starting at ${nextTier.monthlyPrice}/month
              </p>
            </div>
          </div>
          <Button onClick={onUpgrade} className="bg-blue-600 hover:bg-blue-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}