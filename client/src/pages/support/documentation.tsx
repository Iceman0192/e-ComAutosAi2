import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Code, FileText } from 'lucide-react';

export default function DocumentationPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Documentation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive guides and tutorials for e-ComAutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Book className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Quick start guide for new users</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Code className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>API Reference</CardTitle>
                <CardDescription>Complete API documentation</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>User Guides</CardTitle>
                <CardDescription>Detailed feature explanations</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}