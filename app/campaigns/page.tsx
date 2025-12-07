import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Campaigns() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Campaigns</h1>
              <p className="text-gray-600">Manage your creator campaigns</p>
            </div>
            <Link
              href="/campaigns/new"
              className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <span>+</span> New Campaign
            </Link>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📢</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">No active campaigns</h2>
              <p className="text-gray-600 mb-6">
                Click + to create one and start connecting with talented creators
              </p>
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
              >
                <span>+</span> Create Your First Campaign
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

