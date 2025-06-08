import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, TrendingUp, BarChart3, ArrowRight, CheckCircle, Globe } from 'lucide-react';

export default function MarketDataPage() {
  const features = [
    {
      icon: Database,
      title: "Comprehensive Database",
      description: "Access millions of auction records from Copart, IAAI, and other major auction houses."
    },
    {
      icon: TrendingUp,
      title: "Real-time Updates",
      description: "Live data feeds ensure you always have the most current market information."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Powerful filtering and analysis tools to identify trends and opportunities."
    },
    {
      icon: Globe,
      title: "Multi-platform Coverage",
      description: "Data from multiple auction platforms in one unified interface."
    }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 via-blue-600 to-green-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-6 bg-white/20 text-white border-white/30">
                  <Database className="h-4 w-4 mr-2" />
                  Market Intelligence
                </Badge>
                <h1 className="text-5xl font-bold mb-6">
                  Comprehensive Market Data
                </h1>
                <p className="text-xl text-green-100 mb-8">
                  Access the most comprehensive automotive auction database with real-time updates, 
                  historical trends, and powerful analytics tools to make informed decisions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                    Explore Data
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    View Sample
                  </Button>
                </div>
              </div>
              <div className="lg:text-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                  <Database className="h-32 w-32 text-white mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">50M+ Records</h3>
                  <p className="text-green-100">Historical auction data points</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Market Intelligence
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our comprehensive market data platform provides everything you need to understand 
              automotive auction trends and make profitable decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-green-600 mx-auto mb-4" />
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
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">50M+</div>
                <div className="text-gray-600 dark:text-gray-400">Auction Records</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-gray-600 dark:text-gray-400">Auction Locations</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600 dark:text-gray-400">Data Updates</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Access Market Data?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join thousands of dealers using our market intelligence platform
            </p>
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}