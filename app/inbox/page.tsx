import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Inbox() {
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
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8 pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Inbox</h1>
              <p className="text-sm md:text-base text-gray-600">Messages and notifications</p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                All mail
              </button>
              <button className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Unread
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📥</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Your inbox is empty</h2>
              <p className="text-gray-600 mb-6">
                Ready to connect with creators? Let's get started!
              </p>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900">Post a campaign for creators to see</p>
                <button className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-900 transition-colors">
                  View Campaigns
                </button>
                <p className="text-sm text-gray-600 mt-2">Or manually search creators</p>
                <button className="text-gray-700 hover:text-gray-900 font-medium">
                  View Creators
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

