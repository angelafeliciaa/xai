import Link from 'next/link';
import Sidebar from './components/Sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Welcome to UGC Platform</h1>
            <p className="text-gray-600">Create and manage your influencer campaigns</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
              <p className="text-3xl font-semibold text-gray-900">0</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Creators</p>
              <p className="text-3xl font-semibold text-gray-900">0</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Content Pieces</p>
              <p className="text-3xl font-semibold text-gray-900">0</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Budget Spent</p>
              <p className="text-3xl font-semibold text-gray-900">$0</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📢</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Create Your First Campaign
              </h2>
              <p className="text-gray-600 mb-6">
                Get started by creating a campaign to connect with talented creators and grow your brand
              </p>
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
              >
                <span>+ New Campaign</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <Link href="/creators" className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all">
              <span className="text-2xl mb-3 block">👥</span>
              <h3 className="font-medium text-gray-900 mb-1">Find Creators</h3>
              <p className="text-sm text-gray-600">Browse our marketplace of talented creators</p>
            </Link>
            <Link href="/products" className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all">
              <span className="text-2xl mb-3 block">📦</span>
              <h3 className="font-medium text-gray-900 mb-1">Manage Products</h3>
              <p className="text-sm text-gray-600">Add products to feature in campaigns</p>
            </Link>
            <Link href="/assets" className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all">
              <span className="text-2xl mb-3 block">🖼️</span>
              <h3 className="font-medium text-gray-900 mb-1">Asset Library</h3>
              <p className="text-sm text-gray-600">View and download created content</p>
            </Link>
        </div>
        </div>
      </main>
    </div>
  );
}
