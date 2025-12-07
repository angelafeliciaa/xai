'use client';

interface CampaignStepProps {
  data: any;
  updateData: (data: any) => void;
}

export default function CampaignStep({ data, updateData }: CampaignStepProps) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Information</h2>
        <p className="text-sm text-gray-600">Set up your campaign details and requirements</p>
      </div>

      <div className="space-y-6">
        {/* Campaign Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Campaign Visibility
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => updateData({ visibility: 'public' })}
              className={`flex-1 px-4 py-3 border rounded-lg text-left transition-all ${
                data.visibility === 'public'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className="font-medium text-sm">Public</span>
            </button>
            <button
              onClick={() => updateData({ visibility: 'private' })}
              className={`flex-1 px-4 py-3 border rounded-lg text-left transition-all ${
                data.visibility === 'private'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className="font-medium text-sm">Private</span>
            </button>
          </div>
        </div>

        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <select
              value={data.brand}
              onChange={(e) => updateData({ brand: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Select a brand...</option>
              <option value="brand1">My Brand</option>
              <option value="brand2">Brand Two</option>
            </select>
          </div>
          <button className="mt-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <span className="text-green-600">+</span> Add Brand
          </button>
        </div>

        {/* Campaign Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Campaign Type <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Choose whether you need content creation only, influencer partnership, or Instagram whitelisting.
          </p>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => updateData({ campaignType: 'ugc' })}
              className={`w-full px-5 py-4 flex items-center gap-4 transition-all ${
                data.campaignType === 'ugc'
                  ? 'bg-gray-50 border-l-4 border-l-black'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xl">📹</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">User-Generated Content</p>
                <p className="text-sm text-gray-600">Raw content creation</p>
              </div>
              {data.campaignType === 'ugc' && (
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            <div className="border-t border-gray-200">
              <button
                onClick={() => updateData({ campaignType: 'partnership' })}
                className={`w-full px-5 py-4 flex items-center gap-4 transition-all ${
                  data.campaignType === 'partnership'
                    ? 'bg-gray-50 border-l-4 border-l-black'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🤝</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Influencer Partnership</p>
                  <p className="text-sm text-gray-600">Full collaboration with posting</p>
                </div>
                {data.campaignType === 'partnership' && (
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={data.campaignName}
            onChange={(e) => updateData({ campaignName: e.target.value })}
            placeholder="Enter campaign name..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

