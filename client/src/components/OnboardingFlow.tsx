import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { 
  Search, 
  Brain, 
  History, 
  Shield, 
  Zap, 
  Check,
  ArrowRight,
  Star
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  action?: {
    label: string;
    href: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Auction Intelligence Platform',
    description: 'Get comprehensive insights from Copart and IAAI auction data with AI-powered analysis.',
    icon: <Shield className="h-8 w-8 text-blue-600" />,
    features: [
      'Access to over 400,000+ auction records',
      'Real-time active lot monitoring',
      'Cross-platform price comparisons',
      'Professional auction analytics'
    ]
  },
  {
    id: 'search',
    title: 'Start Your Vehicle Research',
    description: 'Search active lots on both Copart and IAAI platforms with advanced filtering.',
    icon: <Search className="h-8 w-8 text-green-600" />,
    features: [
      'Live auction lot search',
      'Advanced filtering by make, model, year',
      'Location-based results',
      'Real-time bidding information'
    ],
    action: {
      label: 'Try Live Search',
      href: '/copart'
    }
  },
  {
    id: 'ai-analysis',
    title: 'AI-Powered Vehicle Analysis',
    description: 'Get professional damage assessments and market intelligence with AuctionMind Pro.',
    icon: <Brain className="h-8 w-8 text-purple-600" />,
    features: [
      'Computer vision damage analysis',
      'Similar vehicle comparisons',
      'Market value estimations',
      'Bidding recommendations'
    ],
    action: {
      label: 'Explore AI Analysis',
      href: '/auction-mind-v2'
    }
  },
  {
    id: 'vin-history',
    title: 'Complete VIN History Research',
    description: 'Track any vehicle\'s complete auction history across all platforms.',
    icon: <History className="h-8 w-8 text-orange-600" />,
    features: [
      'Comprehensive VIN lookup',
      'Historical price tracking',
      'Previous auction appearances',
      'Ownership transfer history'
    ],
    action: {
      label: 'Search VIN History',
      href: '/vin-history'
    }
  }
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
    setLocation('/dashboard');
  };

  const handleAction = (href: string) => {
    setLocation(href);
    onComplete();
  };

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">Step {currentStep + 1} of {onboardingSteps.length}</Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="mb-6" />
          
          <div className="flex justify-center mb-4">
            {step.icon}
          </div>
          
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-lg mt-2">
            {step.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            {step.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {currentStep === 0 && user && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Your Current Plan: {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</h4>
                <Badge variant={user.role === 'platinum' ? 'default' : 'secondary'}>
                  {user.role === 'platinum' && <Star className="h-3 w-3 mr-1" />}
                  {user.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {step.action && (
                <Button 
                  variant="outline"
                  onClick={() => handleAction(step.action!.href)}
                >
                  {step.action.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              <Button onClick={handleNext}>
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OnboardingTrigger() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isNewUser = user && !localStorage.getItem(`onboarding_completed_${user.id}`);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleCompleteOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  if (!isNewUser && !showOnboarding) {
    return null;
  }

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={handleCompleteOnboarding} />}
      {isNewUser && !showOnboarding && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Welcome to your auction intelligence platform!
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Take a quick tour to discover all the powerful features available to you.
                  </p>
                </div>
              </div>
              <Button onClick={handleStartOnboarding} className="bg-blue-600 hover:bg-blue-700">
                Start Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}