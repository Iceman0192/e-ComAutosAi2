import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/layout/Navigation';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare,
  Send,
  CheckCircle,
  Globe,
  Users,
  Headphones,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    inquiry_type: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent Successfully",
        description: "We'll get back to you within 24 hours.",
      });
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: '',
        inquiry_type: ''
      });
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Get in touch via email",
      contact: "hello@ecomautos.ai",
      action: "mailto:hello@ecomautos.ai",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our team",
      contact: "+1 (555) 123-4567",
      action: "tel:+15551234567",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with support",
      contact: "Available 24/7",
      action: "#",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Our headquarters",
      contact: "San Francisco, CA",
      action: "#",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const offices = [
    {
      city: "San Francisco",
      country: "United States",
      address: "123 Technology Drive, Suite 456, San Francisco, CA 94105",
      phone: "+1 (555) 123-4567",
      email: "us@ecomautos.ai",
      type: "Headquarters"
    },
    {
      city: "London",
      country: "United Kingdom",
      address: "45 Innovation Street, London EC2A 3LT, UK",
      phone: "+44 20 7123 4567",
      email: "eu@ecomautos.ai",
      type: "European Office"
    },
    {
      city: "Tokyo",
      country: "Japan",
      address: "1-2-3 Tech District, Shibuya, Tokyo 150-0002, Japan",
      phone: "+81 3 1234 5678",
      email: "asia@ecomautos.ai",
      type: "Asia Pacific Office"
    }
  ];

  const supportTeams = [
    {
      icon: Headphones,
      title: "Technical Support",
      description: "Platform issues, API integration, technical troubleshooting",
      email: "support@ecomautos.ai",
      hours: "24/7 Support"
    },
    {
      icon: Users,
      title: "Sales Team",
      description: "Pricing, demos, enterprise solutions, partnerships",
      email: "sales@ecomautos.ai",
      hours: "Mon-Fri 9AM-6PM PST"
    },
    {
      icon: Building,
      title: "Business Development",
      description: "Strategic partnerships, enterprise accounts, custom solutions",
      email: "business@ecomautos.ai",
      hours: "Mon-Fri 9AM-6PM PST"
    }
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
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">Let's Build the Future</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Together
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Whether you're looking to transform your business with AI-powered vehicle intelligence, 
              need technical support, or want to explore partnership opportunities, we're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              Contact Options
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Multiple Ways to Reach Us
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${method.gradient} mb-6`}>
                    <method.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {method.description}
                  </p>
                  <a 
                    href={method.action}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {method.contact}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-purple-200 text-purple-700">
              Send a Message
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Tell Us About Your Project
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry_type">Inquiry Type *</Label>
                  <Select value={formData.inquiry_type} onValueChange={(value) => handleInputChange('inquiry_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales & Pricing</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                      <SelectItem value="demo">Request Demo</SelectItem>
                      <SelectItem value="enterprise">Enterprise Solutions</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Brief subject of your inquiry"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us more about your needs and how we can help..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                  size="lg"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  <Send className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Teams */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-green-200 text-green-700">
              Specialized Support
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Expert Teams Ready to Help
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {supportTeams.map((team, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 w-fit mb-4">
                    <team.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {team.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    {team.description}
                  </p>
                  <div className="space-y-2">
                    <a 
                      href={`mailto:${team.email}`}
                      className="block text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      {team.email}
                    </a>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{team.hours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global Offices */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Global Presence, Local Support
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              With offices across three continents, we provide world-class support in your timezone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {office.city}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      {office.type}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{office.country}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{office.address}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <a href={`tel:${office.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {office.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <a href={`mailto:${office.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {office.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}