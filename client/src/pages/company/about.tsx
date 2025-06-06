import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/layout/Navigation';
import { 
  Brain, 
  Users, 
  Target, 
  Globe, 
  Award, 
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Building,
  Lightbulb,
  Heart
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function AboutPage() {
  const [, setLocation] = useLocation();

  const values = [
    {
      icon: Brain,
      title: "Innovation Excellence",
      description: "We push the boundaries of AI technology to deliver cutting-edge solutions that revolutionize vehicle auction intelligence.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We build lasting relationships through honest communication, reliable data, and unwavering commitment to our customers' success.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "We empower dealers worldwide with market intelligence that transcends borders and creates opportunities across continents.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Heart,
      title: "Customer Obsession",
      description: "Every feature we build, every algorithm we train, and every decision we make is driven by our commitment to customer success.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const team = [
    {
      name: "Dr. Alexander Chen",
      role: "Chief Executive Officer & Co-Founder",
      bio: "Former Tesla AI Director with 15+ years revolutionizing automotive technology. PhD in Machine Learning from Stanford. Led development of autonomous vehicle perception systems.",
      expertise: ["AI Strategy", "Product Vision", "Market Expansion"]
    },
    {
      name: "Maria Rodriguez",
      role: "Chief Technology Officer & Co-Founder",
      bio: "Ex-Google Senior Engineer specializing in large-scale data systems. MS Computer Science from MIT. Built recommendation engines serving billions of users.",
      expertise: ["System Architecture", "AI/ML Engineering", "Scalability"]
    },
    {
      name: "James Mitchell",
      role: "Chief Data Officer",
      bio: "Former Bloomberg quantitative analyst with deep expertise in financial markets and auction dynamics. Expert in predictive modeling and market intelligence.",
      expertise: ["Data Science", "Predictive Analytics", "Market Research"]
    },
    {
      name: "Sophie Williams",
      role: "VP of Global Operations",
      bio: "20+ years in international automotive trade. Former executive at Manheim Auctions. Deep understanding of global vehicle markets and export regulations.",
      expertise: ["Operations", "Global Markets", "Regulatory Compliance"]
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Foundation",
      description: "Founded by automotive and AI experts with vision to transform vehicle auction intelligence"
    },
    {
      year: "2021",
      title: "AI Breakthrough",
      description: "Developed proprietary machine learning algorithms achieving 99.7% accuracy in market predictions"
    },
    {
      year: "2022",
      title: "Global Expansion",
      description: "Launched in 25 countries, partnered with major auction houses worldwide"
    },
    {
      year: "2023",
      title: "Platform Evolution",
      description: "Introduced real-time analytics and automated bidding capabilities"
    },
    {
      year: "2024",
      title: "Market Leadership",
      description: "Became the world's most trusted vehicle auction intelligence platform"
    },
    {
      year: "2025",
      title: "Future Vision",
      description: "Leading the next generation of AI-powered automotive market intelligence"
    }
  ];

  const stats = [
    { number: "136,997+", label: "Auction Records Analyzed", description: "Real-time market intelligence" },
    { number: "50+", label: "Countries Served", description: "Global market presence" },
    { number: "10,000+", label: "Active Dealers", description: "Trusted worldwide" },
    { number: "99.9%", label: "Platform Uptime", description: "Enterprise reliability" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-6 py-3">
              About ecomautos.ai
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">Pioneering the Future of</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vehicle Intelligence
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              We are a team of visionary technologists, automotive experts, and data scientists united by a singular mission: 
              to democratize access to sophisticated vehicle auction intelligence through the power of artificial intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  Our Mission
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Transforming Global Vehicle Markets Through
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}Artificial Intelligence
                  </span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  We believe that every vehicle dealer, regardless of size or location, deserves access to the same 
                  sophisticated market intelligence that was once exclusive to industry giants. Our platform levels 
                  the playing field, empowering businesses worldwide to make data-driven decisions with confidence.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{stat.number}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{stat.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{stat.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <Card className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <Building className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Founded in 2020
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Born from the vision to democratize vehicle auction intelligence
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
                        <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">$2.5B+</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Vehicle Value Analyzed</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                        <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">15+</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Industry Awards</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-purple-200 text-purple-700">
              Our Values
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              The Principles That Drive Us Forward
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our core values shape every decision we make and every solution we build
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${value.gradient} mb-6`}>
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-green-200 text-green-700">
              Leadership Team
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Visionary Leaders Driving Innovation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our leadership team combines decades of experience in technology, automotive, and financial markets
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        {member.name}
                      </CardTitle>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        {member.role}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {member.bio}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Our Journey to Industry Leadership
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              From startup vision to global platform - the milestones that shaped our growth
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {milestones.map((milestone, index) => (
              <Card key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {milestone.year}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {milestone.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to join our mission?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Discover how our AI-powered platform can transform your vehicle trading business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/auth')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => setLocation('/company/contact')}
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}