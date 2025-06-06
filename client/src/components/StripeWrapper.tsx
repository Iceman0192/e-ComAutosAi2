import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { TrialSignupForm } from './TrialSignupForm';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeWrapperProps {
  onSuccess: () => void;
}

export function StripeWrapper({ onSuccess }: StripeWrapperProps) {
  return (
    <Elements stripe={stripePromise}>
      <TrialSignupForm onSuccess={onSuccess} />
    </Elements>
  );
}