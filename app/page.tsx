'use client';

import Link from 'next/link';
import Sidebar from './components/Sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s an overview of your campaigns and content.</p>
          </div>

          {/* Get Started Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">ℹ️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Get Started</h3>
                <p className="text-sm text-gray-600">Start receiving UGC in as little as five minutes!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/campaigns/new"
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
              >
                Take A Tour
              </Link>
              <Link
                href="/search"
                className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Help Center
              </Link>
            </div>
          </div>

          {/* Recent Campaigns Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Recent Campaigns</h2>
                <p className="text-sm text-gray-600">Your most recent campaigns and their current status</p>
              </div>
              <Link
                href="/campaigns"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                View All Campaigns
              </Link>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-600 px-6 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-gray-600 px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-600 px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-600 px-6 py-3">Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty state */}
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <span className="text-2xl">📢</span>
                        </div>
                        <p className="text-gray-600 mb-1">No active campaigns</p>
                        <p className="text-sm text-gray-500">Click + to create one and start connecting with talented creators</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Products</h2>
                <p className="text-sm text-gray-600">Manage your product catalog for campaigns</p>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                View All Products
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Add New Product Card */}
              <Link
                href="/products"
                className="bg-white rounded-xl p-8 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all flex flex-col items-center justify-center min-h-[200px] group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Add New Product</h3>
                <p className="text-sm text-gray-500 text-center">Upload product details</p>
              </Link>

              {/* Empty product placeholders */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 min-h-[200px] opacity-50">
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Product slot</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 min-h-[200px] opacity-50">
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Product slot</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
