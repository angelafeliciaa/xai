import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Campaigns() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <img src="/images/logo-64.png" alt="xCreator" className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-900 font-medium text-sm">xCreator</span>
          </Link>
          <Link href="/campaigns/new" className="p-2 rounded-lg bg-black text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8 pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Campaigns</h1>
              <p className="text-sm md:text-base text-gray-600">Manage your creator campaigns</p>
            </div>
            <Link
              href="/campaigns/new"
              className="w-full sm:w-auto px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
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

