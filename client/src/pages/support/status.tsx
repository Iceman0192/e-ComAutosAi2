import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Server, Database, Zap } from 'lucide-react';

export default function StatusPage() {
  const services = [
    { name: 'API Service', status: 'operational', uptime: '99.98%', icon: Server },
    { name: 'Database', status: 'operational', uptime: '99.99%', icon: Database },
    { name: 'Search Engine', status: 'operational', uptime: '99.96%', icon: Zap }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              System Status
            </h1>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                All Systems Operational
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <service.icon className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.uptime} uptime</p>
                      </div>
                    </div>
                    <Badge className="text-green-600 bg-green-100">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {service.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}