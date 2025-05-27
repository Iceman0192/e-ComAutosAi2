import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AIAnalysisWidget from '@/components/AIAnalysisWidget';
import ComparableSearchForm from '@/components/ComparableSearchForm';

interface VehicleData {
  platform: string;
  lotId: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  series?: string;
  mileage: string;
  damage: string;
  color?: string;
  location?: string;
  currentBid?: number;
  images: string[];
}

interface AnalysisTabsWidgetProps {
  vehicleData: VehicleData;
  lotData: any; // For comparable search form
}

export default function AnalysisTabsWidget({ vehicleData, lotData }: AnalysisTabsWidgetProps) {
  const { hasPermission } = useAuth();
  
  // Determine which tabs are available based on user permissions
  const hasAIAnalysis = hasPermission('AI_ANALYSIS');
  const hasComparables = hasPermission('FULL_ANALYTICS');
  
  // Don't render if user has no access to either feature
  if (!hasAIAnalysis && !hasComparables) {
    return null;
  }
  
  // Default to first available tab
  const defaultTab = hasAIAnalysis ? 'ai-analysis' : 'comparables';
  
  return (
    <Card className="border-purple-200 shadow-lg mt-6">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
        <CardTitle className="text-purple-900 dark:text-purple-100">
          Vehicle Analysis & Research Tools
        </CardTitle>
        <CardDescription className="text-purple-700 dark:text-purple-300">
          Advanced tools for vehicle evaluation and market research
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {hasAIAnalysis && (
              <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Analysis
              </TabsTrigger>
            )}
            {hasComparables && (
              <TabsTrigger value="comparables" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Find Comparables
              </TabsTrigger>
            )}
          </TabsList>
          
          {hasAIAnalysis && (
            <TabsContent value="ai-analysis" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">AI Vehicle Analysis</h3>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Platinum Feature
                    </span>
                  </div>
                </div>
                <AIAnalysisWidget vehicleData={vehicleData} />
              </div>
            </TabsContent>
          )}
          
          {hasComparables && (
            <TabsContent value="comparables" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold">Find Comparable Vehicles</h3>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Gold+ Feature
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Search for similar vehicles in your database to compare prices across platforms
                </p>
                <ComparableSearchForm 
                  lotData={lotData}
                  platform={vehicleData.platform as 'iaai' | 'copart'}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}