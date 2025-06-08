import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Eye, 
  CheckCircle,
  ArrowRight,
  BarChart3,
  Database,
  Clock
} from 'lucide-react';

export default function AIAnalysisPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Advanced machine learning algorithms analyze market patterns and predict price trends with 94% accuracy."
    },
    {
      icon: Target,
      title: "Smart Recommendations",
      description: "Get personalized buying and selling recommendations based on historical data and market conditions."
    },
    {
      icon: TrendingUp,
      title: "Trend Prediction",
      description: "Forecast future market movements and identify emerging opportunities before your competition."
    },
    {
      icon: Eye,
      title: "Visual Analytics",
      description: "Interactive charts and visualizations make complex data easy to understand and act upon."
    }
  ];

  const capabilities = [
    "Real-time market sentiment analysis",
    "Automated vehicle condition assessment",
    "Price optimization recommendations",
    "Risk assessment and alerts",
    "Competitive positioning analysis",
    "Seasonal trend identification"
  ];

  const plans = [
    {
      name: "Basic AI",
      price: "$39",
      period: "/month",
      description: "Essential AI insights for individual dealers",
      features: [
        "100 AI analyses per month",
        "Basic trend predictions",
        "Standard reporting",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Pro AI",
      price: "$79",
      period: "/month", 
      description: "Advanced AI tools for growing businesses",
      features: [
        "500 AI analyses per month",
        "Advanced trend predictions",
        "Custom alerts and notifications",
        "API access",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise AI",
      price: "Custom",
      period: "",
      description: "Full AI suite for large organizations",
      features: [
        "Unlimited AI analyses",
        "Custom model training",
        "White-label solutions",
        "Dedicated support",
        "On-premise deployment"
      ],
      popular: false
    }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-6 bg-white/20 text-white border-white/30">
                  <Brain className="h-4 w-4 mr-2" />
                  AI-Powered Analytics
                </Badge>
                <h1 className="text-5xl font-bold mb-6">
                  Intelligent Market Analysis
                </h1>
                <p className="text-xl text-blue-100 mb-8">
                  Harness the power of artificial intelligence to make smarter decisions in the automotive auction market. Our AI analyzes millions of data points to deliver actionable insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Watch Demo
                  </Button>
                </div>
              </div>
              <div className="lg:text-center">
                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                    <BarChart3 className="h-32 w-32 text-white mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">94% Accuracy</h3>
                    <p className="text-blue-100">AI prediction accuracy for price trends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Driven Market Intelligence
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our advanced AI platform transforms complex auction data into clear, actionable insights that give you a competitive edge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Capabilities */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Advanced AI Capabilities
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Our AI engine continuously learns from market data to provide increasingly accurate predictions and recommendations.
              </p>
              <div className="space-y-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:text-center">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
                <Database className="h-24 w-24 text-blue-600 mx-auto mb-6" />
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">50M+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Data Points Analyzed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Uptime Guarantee</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                AI Analysis Pricing
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Choose the AI plan that fits your business needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                    </div>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Unlock AI-Powered Insights?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of dealers already using our AI platform to make smarter decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Clock className="h-5 w-5 mr-2" />
                Start 14-Day Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}