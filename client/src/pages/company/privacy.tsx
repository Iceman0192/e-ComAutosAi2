import Navigation from '@/components/layout/Navigation';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Privacy Policy
            </h1>
            
            <div className="prose dark:prose-invert max-w-none">
              <h2>Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account,
                subscribe to our service, or contact us for support.
              </p>
              
              <h2>How We Use Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services,
                process transactions, and communicate with you.
              </p>
              
              <h2>Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties
                without your consent, except as described in this policy.
              </p>
              
              <h2>Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction.
              </p>
              
              <h2>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at privacy@ecomautos.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}