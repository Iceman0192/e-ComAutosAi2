import Navigation from '@/components/layout/Navigation';

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Terms of Service
            </h1>
            
            <div className="prose dark:prose-invert max-w-none">
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing and using e-ComAutos, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
              
              <h2>Use License</h2>
              <p>
                Permission is granted to temporarily access e-ComAutos for personal, non-commercial
                transitory viewing only.
              </p>
              
              <h2>Service Description</h2>
              <p>
                e-ComAutos provides automotive auction data analysis and market intelligence services.
                We strive to provide accurate and up-to-date information.
              </p>
              
              <h2>User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password
                and for restricting access to your computer.
              </p>
              
              <h2>Payment Terms</h2>
              <p>
                Subscription fees are billed in advance on a monthly or annual basis and are non-refundable
                except as required by law.
              </p>
              
              <h2>Limitation of Liability</h2>
              <p>
                e-ComAutos shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages resulting from your use of the service.
              </p>
              
              <h2>Contact Information</h2>
              <p>
                Questions about the Terms of Service should be sent to us at legal@ecomautos.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}