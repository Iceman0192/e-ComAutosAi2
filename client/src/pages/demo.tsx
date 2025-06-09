import { useState } from "react";
import { Play, Pause, RotateCcw, Maximize2, Volume2, BookOpen, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: 'basic' | 'advanced' | 'enterprise';
  features: string[];
}

const demoVideos: DemoVideo[] = [
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    description: 'Get started with EcomAutos in under 5 minutes',
    duration: '4:32',
    thumbnail: '/api/placeholder/480/270',
    category: 'basic',
    features: ['Account Setup', 'First Search', 'Basic Filters']
  },
  {
    id: 'advanced-search',
    title: 'Advanced Search Techniques',
    description: 'Master complex search filters and data analysis',
    duration: '8:15',
    thumbnail: '/api/placeholder/480/270',
    category: 'advanced',
    features: ['Multi-platform Search', 'Custom Filters', 'Export Data']
  },
  {
    id: 'ai-analysis',
    title: 'AI-Powered Vehicle Analysis',
    description: 'Use artificial intelligence to analyze vehicle conditions and market trends',
    duration: '12:40',
    thumbnail: '/api/placeholder/480/270',
    category: 'enterprise',
    features: ['Image Analysis', 'Market Predictions', 'Risk Assessment']
  },
  {
    id: 'team-management',
    title: 'Team Collaboration',
    description: 'Set up teams and manage user permissions',
    duration: '6:28',
    thumbnail: '/api/placeholder/480/270',
    category: 'enterprise',
    features: ['User Roles', 'Access Control', 'Team Analytics']
  }
];

const featureHighlights = [
  {
    icon: Zap,
    title: 'Lightning Fast Search',
    description: 'Search millions of auction records in milliseconds'
  },
  {
    icon: TrendingUp,
    title: 'Market Intelligence',
    description: 'Advanced analytics and trend predictions'
  },
  {
    icon: BookOpen,
    title: 'Comprehensive Data',
    description: 'Complete vehicle history from multiple sources'
  }
];

export default function Demo() {
  const [currentVideo, setCurrentVideo] = useState<DemoVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'advanced' | 'enterprise'>('all');

  const filteredVideos = selectedCategory === 'all' 
    ? demoVideos 
    : demoVideos.filter(video => video.category === selectedCategory);

  const handleVideoSelect = (video: DemoVideo) => {
    setCurrentVideo(video);
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control video playback
  };

  const resetVideo = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'basic': return 'secondary';
      case 'advanced': return 'default';
      case 'enterprise': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Product Demo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover the power of EcomAutos through interactive tutorials and feature demonstrations
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-3 gap-6">
        {featureHighlights.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <feature.icon className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          {currentVideo ? (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  <img
                    src={currentVideo.thumbnail}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex gap-4">
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={togglePlay}
                        className="rounded-full w-16 h-16"
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6 ml-1" />
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={resetVideo}
                        className="rounded-full w-16 h-16"
                      >
                        <RotateCcw className="h-6 w-6" />
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full w-16 h-16"
                      >
                        <Maximize2 className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">{currentVideo.duration}</Badge>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{currentVideo.title}</h2>
                      <p className="text-muted-foreground">{currentVideo.description}</p>
                    </div>
                    <Badge variant={getCategoryBadgeVariant(currentVideo.category)}>
                      {currentVideo.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">What you'll learn:</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentVideo.features.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="aspect-video flex items-center justify-center">
              <div className="text-center space-y-4">
                <Play className="mx-auto h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Select a Demo Video</h3>
                  <p className="text-muted-foreground">Choose from our tutorial library to get started</p>
                </div>
              </div>
            </Card>
          )}

          {/* Controls */}
          {currentVideo && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={togglePlay}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetVideo}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentVideo.duration}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Video Library */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demo Library</CardTitle>
              <CardDescription>
                Choose from our comprehensive tutorial collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
                </TabsList>
                
                <div className="mt-6 space-y-4">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        currentVideo?.id === video.id ? 'border-primary bg-muted/50' : ''
                      }`}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{video.title}</h4>
                        <Badge 
                          variant={getCategoryBadgeVariant(video.category)}
                          className="text-xs"
                        >
                          {video.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {video.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {video.duration}
                        </span>
                        <Button
                          size="sm"
                          variant={currentVideo?.id === video.id ? "default" : "ghost"}
                          className="text-xs h-6"
                        >
                          {currentVideo?.id === video.id ? "Playing" : "Watch"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
              <Button className="w-full" variant="outline">
                <Zap className="mr-2 h-4 w-4" />
                Try Live Demo
              </Button>
              <Button className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}