import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Brain, Star, TrendingUp, Car, Settings, RefreshCw, Eye, X, Target, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: number;
  vehicleId: string;
  type: string;
  score: number;
  reasoning: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    damage: string;
    location: string;
    platform: string;
  };
  createdAt: string;
  viewed: boolean;
}

interface UserPreferences {
  preferredMakes: string[];
  budgetMin: number;
  budgetMax: number;
  preferredYearMin: number;
  preferredYearMax: number;
  preferredMileageMax: number;
  preferredBodyTypes: string[];
  avoidDamageTypes: string[];
  preferredStates: string[];
  riskTolerance: string;
  investmentGoal: string;
}

export default function Recommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredMakes: [],
    budgetMin: 0,
    budgetMax: 100000,
    preferredYearMin: 2010,
    preferredYearMax: new Date().getFullYear(),
    preferredMileageMax: 150000,
    preferredBodyTypes: [],
    avoidDamageTypes: [],
    preferredStates: [],
    riskTolerance: 'medium',
    investmentGoal: 'personal_use'
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: recsLoading, refetch: refetchRecs } = useQuery({
    queryKey: ['/api/recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/recommendations');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const result = await response.json();
      return result.recommendations as Recommendation[];
    }
  });

  // Fetch user preferences
  const { data: userProfile, isLoading: prefsLoading } = useQuery({
    queryKey: ['/api/preferences'],
    queryFn: async () => {
      const response = await fetch('/api/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    }
  });

  // Update user preferences
  const updatePreferences = useMutation({
    mutationFn: async (newPrefs: UserPreferences) => {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Preferences updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
    }
  });

  // Generate fresh recommendations
  const generateRecommendations = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxRecommendations: 15 })
      });
      if (!response.ok) throw new Error('Failed to generate recommendations');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: `Generated ${data.count} new recommendations` });
      refetchRecs();
    }
  });

  // Mark recommendation as viewed
  const markViewed = useMutation({
    mutationFn: async (recommendationId: number) => {
      const response = await fetch(`/api/recommendations/${recommendationId}/view`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark as viewed');
      return response.json();
    },
    onSuccess: () => {
      refetchRecs();
    }
  });

  // Dismiss recommendation
  const dismissRecommendation = useMutation({
    mutationFn: async (recommendationId: number) => {
      const response = await fetch(`/api/recommendations/${recommendationId}/dismiss`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to dismiss recommendation');
      return response.json();
    },
    onSuccess: () => {
      refetchRecs();
      toast({ title: 'Recommendation dismissed' });
    }
  });

  // Load preferences when data is available
  useEffect(() => {
    if (userProfile?.preferences) {
      setPreferences({
        ...preferences,
        ...userProfile.preferences
      });
    }
  }, [userProfile]);

  const handlePreferenceUpdate = () => {
    updatePreferences.mutate(preferences);
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'trending': return 'bg-green-100 text-green-800';
      case 'opportunity': return 'bg-blue-100 text-blue-800';
      case 'match': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const popularMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 
    'Audi', 'Lexus', 'Hyundai', 'Kia', 'Volkswagen', 'Subaru', 'Mazda'
  ];

  const bodyTypes = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible', 'Wagon'];
  const damageTypes = ['FLOOD', 'FIRE', 'COLLISION', 'VANDALISM', 'THEFT', 'HAIL'];
  const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Vehicle Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Personalized vehicle suggestions based on your preferences and market analysis
          </p>
        </div>
        <Button 
          onClick={() => generateRecommendations.mutate()}
          disabled={generateRecommendations.isPending}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate New
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">
            <Star className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-6">
          {recsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations?.length ? (
            <div className="space-y-6">
              {recommendations.map((rec) => (
                <Card key={rec.id} className={`transition-all hover:shadow-md ${!rec.viewed ? 'ring-2 ring-blue-200' : ''}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">
                            {rec.vehicle.year} {rec.vehicle.make} {rec.vehicle.model}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getRecommendationTypeColor(rec.type)}>
                              {rec.type.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={getScoreColor(rec.score)}>
                              {rec.score}% Match
                            </Badge>
                            <Badge variant="secondary">
                              {rec.vehicle.platform.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!rec.viewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markViewed.mutate(rec.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dismissRecommendation.mutate(rec.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="font-semibold">{formatCurrency(rec.vehicle.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Mileage</p>
                          <p className="font-semibold">{rec.vehicle.mileage?.toLocaleString() || 'N/A'} mi</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Damage</p>
                          <p className="font-semibold">{rec.vehicle.damage || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-semibold">{rec.vehicle.location || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">AI Analysis:</span>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {rec.reasoning}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Match Score:</span>
                        <div className="flex-1 max-w-24">
                          <Progress value={rec.score} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{rec.score}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Added {new Date(rec.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recommendations Yet</h3>
              <p className="text-gray-500 mb-4">
                Set your preferences and generate personalized vehicle recommendations
              </p>
              <Button onClick={() => setActiveTab('preferences')}>
                Configure Preferences
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Preferences</CardTitle>
              <p className="text-sm text-gray-600">
                Configure your vehicle preferences to get better recommendations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Budget Range */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Budget Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetMin">Minimum ($)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={preferences.budgetMin}
                      onChange={(e) => setPreferences({...preferences, budgetMin: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax">Maximum ($)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={preferences.budgetMax}
                      onChange={(e) => setPreferences({...preferences, budgetMax: parseInt(e.target.value) || 100000})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preferred Makes */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Preferred Makes</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {popularMakes.map((make) => (
                    <div key={make} className="flex items-center space-x-2">
                      <Checkbox
                        id={make}
                        checked={preferences.preferredMakes.includes(make)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreferences({
                              ...preferences,
                              preferredMakes: [...preferences.preferredMakes, make]
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              preferredMakes: preferences.preferredMakes.filter(m => m !== make)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={make} className="text-sm">{make}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Year Range */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Year Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearMin">From Year</Label>
                    <Input
                      id="yearMin"
                      type="number"
                      value={preferences.preferredYearMin}
                      onChange={(e) => setPreferences({...preferences, preferredYearMin: parseInt(e.target.value) || 2010})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearMax">To Year</Label>
                    <Input
                      id="yearMax"
                      type="number"
                      value={preferences.preferredYearMax}
                      onChange={(e) => setPreferences({...preferences, preferredYearMax: parseInt(e.target.value) || new Date().getFullYear()})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Investment Goal */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Investment Goal</Label>
                <Select
                  value={preferences.investmentGoal}
                  onValueChange={(value) => setPreferences({...preferences, investmentGoal: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_use">Personal Use</SelectItem>
                    <SelectItem value="resale">Resale Investment</SelectItem>
                    <SelectItem value="parts">Parts/Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Risk Tolerance</Label>
                <Select
                  value={preferences.riskTolerance}
                  onValueChange={(value) => setPreferences({...preferences, riskTolerance: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handlePreferenceUpdate}
                disabled={updatePreferences.isPending}
                className="w-full"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Recommendations</p>
                    <p className="text-2xl font-bold">{recommendations?.length || 0}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold">
                      {recommendations?.length ? 
                        Math.round(recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length) : 0}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Viewed</p>
                    <p className="text-2xl font-bold">
                      {recommendations?.filter(rec => rec.viewed).length || 0}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Preferences Set</p>
                    <p className="text-2xl font-bold">
                      {userProfile?.preferences ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recommendation Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {userProfile?.searchPatterns ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Most Searched Makes:</p>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.searchPatterns.commonMakes?.map((make: string) => (
                        <Badge key={make} variant="outline">{make}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Search Price Range:</p>
                    <p className="text-sm text-gray-700">
                      {formatCurrency(userProfile.searchPatterns.priceRange?.min || 0)} - {formatCurrency(userProfile.searchPatterns.priceRange?.max || 100000)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Recent Activity:</p>
                    <p className="text-sm text-gray-700">{userProfile.activityCount || 0} actions in the last 30 days</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Start using the platform to see insights about your preferences and search patterns.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}