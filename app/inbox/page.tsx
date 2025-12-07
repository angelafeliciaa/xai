import Sidebar from '../components/Sidebar';

export default function Inbox() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Inbox</h1>
              <p className="text-gray-600">Messages and notifications</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                All mail
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
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

