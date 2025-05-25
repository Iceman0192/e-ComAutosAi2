import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Crown,
  Zap,
  Star,
  Users
} from 'lucide-react';

export default function Billing() {
  const { user } = useAuth();

  const currentPlan = {
    free: { name: 'Free', price: 0, features: ['Basic search', 'Limited results', 'Standard support'] },
    gold: { name: 'Gold', price: 49, features: ['Advanced filters', 'Full analytics', 'Both auction platforms', 'Priority support'] },
    platinum: { name: 'Platinum', price: 99, features: ['Cross-platform analysis', 'AI insights', 'Unlimited results', 'Export data', 'Premium support'] },
    admin: { name: 'Enterprise', price: 199, features: ['All features', 'Team management', 'Admin tools', 'White-label options'] }
  };

  const plan = currentPlan[user?.role as keyof typeof currentPlan];

  const pricingPlans = [
    {
      name: 'Free',
      price: 0,
      icon: CheckCircle,
      description: 'Perfect for getting started',
      features: ['Basic search functionality', '50 searches per month', 'Standard support', 'Single auction access'],
      buttonText: 'Current Plan',
      disabled: user?.role === 'free'
    },
    {
      name: 'Gold',
      price: 49,
      icon: Star,
      description: 'For serious vehicle exporters',
      features: ['Advanced search filters', 'Both auction platforms', 'Full analytics dashboard', '500 searches per month', 'Priority support', 'Dataset creation'],
      buttonText: user?.role === 'gold' ? 'Current Plan' : 'Upgrade to Gold',
      disabled: user?.role === 'gold',
      popular: true
    },
    {
      name: 'Platinum',
      price: 99,
      icon: Crown,
      description: 'Maximum insights and flexibility',
      features: ['Cross-platform analysis', 'AI-powered insights', 'Unlimited searches', 'Data export capabilities', 'Premium support', 'Custom reports'],
      buttonText: user?.role === 'platinum' ? 'Current Plan' : 'Upgrade to Platinum',
      disabled: user?.role === 'platinum'
    },
    {
      name: 'Enterprise',
      price: 199,
      icon: Users,
      description: 'For teams and organizations',
      features: ['All Platinum features', 'Team management', 'Multiple user seats', 'Admin dashboard', 'White-label options', 'Dedicated support'],
      buttonText: user?.role === 'admin' ? 'Current Plan' : 'Contact Sales',
      disabled: user?.role === 'admin'
    }
  ];

  const billingHistory = [
    { date: '2024-01-01', amount: plan?.price || 0, status: 'Paid', invoice: 'INV-2024-001' },
    { date: '2023-12-01', amount: plan?.price || 0, status: 'Paid', invoice: 'INV-2023-012' },
    { date: '2023-11-01', amount: plan?.price || 0, status: 'Paid', invoice: 'INV-2023-011' }
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">{plan?.name} Plan</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${plan?.price}<span className="text-sm font-normal text-gray-500">/month</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Next Billing Date</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">February 25, 2025</p>
                <Badge variant="outline" className="mt-1">
                  {user?.subscriptionStatus.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Usage This Month</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">127 / 500 searches</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '25%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((planOption) => {
              const Icon = planOption.icon;
              return (
                <div key={planOption.name} className={`relative border rounded-lg p-6 ${
                  planOption.popular ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200 dark:border-gray-700'
                } ${planOption.disabled ? 'opacity-75' : ''}`}>
                  {planOption.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center mb-4">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${
                      planOption.popular ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-lg">{planOption.name}</h3>
                    <p className="text-2xl font-bold mt-1">
                      ${planOption.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {planOption.description}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {planOption.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={planOption.disabled ? "outline" : "default"}
                    disabled={planOption.disabled}
                  >
                    {planOption.buttonText}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/2027</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Billing History</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {billingHistory.map((bill, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{bill.invoice}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{bill.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${bill.amount}</p>
                    <Badge variant="outline" className="text-xs">
                      {bill.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}