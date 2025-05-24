import { useState } from 'react';
import { Link } from 'wouter';
import { Car, BarChart3, Search, TrendingUp, Database, Users } from 'lucide-react';

export default function Dashboard() {
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Vehicle Sales Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive auction data analysis across Copart and IAAI platforms
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">Free Tier</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-500" />
            Quick Vehicle Search
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Make
              </label>
              <select
                value={searchMake}
                onChange={(e) => setSearchMake(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Make</option>
                <option value="Toyota">Toyota</option>
                <option value="Honda">Honda</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes-Benz">Mercedes-Benz</option>
                <option value="Tesla">Tesla</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                placeholder="Enter model"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 flex items-end space-x-3">
              <Link href="/copart" className="flex-1">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center">
                  <Car className="h-4 w-4 mr-2" />
                  Search Copart
                </button>
              </Link>
              <Link href="/iaai" className="flex-1">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center">
                  <Car className="h-4 w-4 mr-2" />
                  Search IAAI
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Copart Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Car className="h-6 w-6 mr-2" />
                Copart Analytics
              </h3>
              <p className="text-blue-100 mt-1">North America's largest vehicle auction platform</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform Focus</span>
                  <span className="font-medium text-gray-900 dark:text-white">Salvage & Clean Title</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Inventory</span>
                  <span className="font-medium text-gray-900 dark:text-white">150,000+ vehicles</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Auction Frequency</span>
                  <span className="font-medium text-gray-900 dark:text-white">Daily</span>
                </div>
              </div>
              <Link href="/copart">
                <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  Analyze Copart Data
                </button>
              </Link>
            </div>
          </div>

          {/* IAAI Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-red-600 px-6 py-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Car className="h-6 w-6 mr-2" />
                IAAI Analytics
              </h3>
              <p className="text-red-100 mt-1">Insurance Auto Auctions - total loss specialists</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform Focus</span>
                  <span className="font-medium text-gray-900 dark:text-white">Insurance Total Loss</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Inventory</span>
                  <span className="font-medium text-gray-900 dark:text-white">75,000+ vehicles</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Auction Frequency</span>
                  <span className="font-medium text-gray-900 dark:text-white">Weekly</span>
                </div>
              </div>
              <Link href="/iaai">
                <button className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  Analyze IAAI Data
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Damage analysis, price trends, and market insights</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historical Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive sales history and pricing data</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Trends</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Price movements and demand analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Membership Tiers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Currently on Free Tier - Upgrade for advanced filtering and unlimited access
              </p>
            </div>
            <div className="space-x-3">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Upgrade to Gold
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Upgrade to Platinum
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">Free Tier</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <li>• Basic search (25 results)</li>
                <li>• Limited analytics</li>
                <li>• Single platform access</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
              <h4 className="font-medium text-gray-900 dark:text-white">Gold Tier</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <li>• Advanced filtering</li>
                <li>• Unlimited results</li>
                <li>• Both platforms</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="font-medium text-gray-900 dark:text-white">Platinum Tier</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <li>• AI-powered analysis</li>
                <li>• Market predictions</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}