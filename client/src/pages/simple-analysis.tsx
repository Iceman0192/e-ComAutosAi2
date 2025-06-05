import SimpleAnalysisPanel from '@/components/market/SimpleAnalysisPanel';

export default function SimpleAnalysisPage() {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Multi-Brand Market Intelligence
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Comprehensive analysis of 14,650+ authentic auction records across Toyota, Hyundai, Ford, Honda, Tesla and more
        </p>
      </div>

      <SimpleAnalysisPanel />
    </div>
  );
}