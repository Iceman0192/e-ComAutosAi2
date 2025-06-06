import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/layout/Navigation';
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  Filter, 
  Target,
  CheckCircle,
  ArrowRight,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function SearchAnalyticsPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Search,
      title: "Advanced Search Algorithms",
      description: "Proprietary AI-powered search technology that processes millions of auction records in milliseconds to deliver precise, relevant results.",
      benefits: ["99.97% accuracy rate", "Sub-second response times", "Multi-parameter filtering"]
    },
    {
      icon: BarChart3,
      title: "Predictive Market Analytics",
      description: "Machine learning models analyze historical patterns to predict future market trends, pricing fluctuations, and demand cycles.",
      benefits: ["7-day price forecasting", "Market trend predictions", "Seasonal demand analysis"]
    },
    {
      icon: Filter,
      title: "Intelligent Filtering System",
      description: "Dynamic filtering capabilities that adapt to market conditions and user preferences for optimized search results.",
      benefits: ["Smart auto-complete", "Context-aware suggestions", "Personalized filters"]
    },
    {
      icon: Target,
      title: "Precision Targeting",
      description: "Advanced targeting algorithms help identify high-value opportunities based on your specific business requirements and risk tolerance.",
      benefits: ["ROI optimization", "Risk assessment", "Opportunity scoring"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <Navigation />
      
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-6 py-3">
              Advanced Search Technology
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">Discover Hidden</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Market Opportunities
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">with AI-Powered Search</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Transform your vehicle sourcing strategy with the world's most sophisticated auction search and analytics platform. 
              Our proprietary AI algorithms analyze over 136,997 auction records to deliver actionable market intelligence 
              that drives profitable decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
              >
                View Live Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              Core Capabilities
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Intelligent Search Technology
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Built for Professionals
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to revolutionize your vehicle sourcing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful dealers using our advanced search analytics to maximize profits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/auth')}
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}