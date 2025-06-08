import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, Shield, Globe, ArrowRight, CheckCircle } from 'lucide-react';

export default function APIAccessPage() {
  const features = [
    {
      icon: Code,
      title: "RESTful API",
      description: "Clean, well-documented REST API endpoints for easy integration with your applications."
    },
    {
      icon: Zap,
      title: "High Performance",
      description: "Lightning-fast responses with 99.9% uptime and sub-100ms average response times."
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Enterprise-grade security with API keys, rate limiting, and encrypted connections."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access from anywhere with our globally distributed CDN and robust infrastructure."
    }
  ];

  const endpoints = [
    { method: 'GET', path: '/api/cars', description: 'Search active auction lots' },
    { method: 'GET', path: '/api/sales-history', description: 'Get historical sales data' },
    { method: 'POST', path: '/api/ai-analysis', description: 'Run AI-powered vehicle analysis' },
    { method: 'GET', path: '/api/vin-lookup', description: 'Look up vehicle by VIN' }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-6 bg-white/20 text-white border-white/30">
                  <Code className="h-4 w-4 mr-2" />
                  Developer Tools
                </Badge>
                <h1 className="text-5xl font-bold mb-6">
                  Powerful API Access
                </h1>
                <p className="text-xl text-purple-100 mb-8">
                  Integrate e-ComAutos data directly into your applications with our robust, 
                  developer-friendly API. Build custom solutions with real-time auction data.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    Get API Key
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    View Docs
                  </Button>
                </div>
              </div>
              <div className="lg:text-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                  <Code className="h-32 w-32 text-white mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">RESTful API</h3>
                  <p className="text-purple-100">Easy integration with any platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Developer-First API
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Built for developers who need reliable, fast access to automotive auction data 
              with comprehensive documentation and support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
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

        {/* API Endpoints */}
        <div className="bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Key API Endpoints
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Essential endpoints to get you started with our API
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {endpoints.map((endpoint, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{endpoint.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Build with Our API?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Get started with comprehensive documentation and dedicated developer support
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Get API Access
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Read Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}