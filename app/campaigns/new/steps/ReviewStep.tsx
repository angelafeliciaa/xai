'use client';

interface ReviewStepProps {
  data: any;
}

export default function ReviewStep({ data }: ReviewStepProps) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Campaign</h2>
        <p className="text-sm text-gray-600">
          Review all the details before publishing your campaign
        </p>
      </div>

      <div className="space-y-6">
        {/* Campaign Overview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span> Campaign Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Campaign Name</p>
              <p className="text-sm font-medium text-gray-900">{data.campaignName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Campaign Type</p>
              <p className="text-sm font-medium text-gray-900">
                {data.campaignType === 'ugc' ? 'User-Generated Content' : 'Influencer Partnership'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Visibility</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{data.visibility}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Brand</p>
              <p className="text-sm font-medium text-gray-900">{data.brand || 'Not selected'}</p>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📦</span> Product Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Product</p>
              <p className="text-sm font-medium text-gray-900">{data.product || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Retail Price</p>
              <p className="text-sm font-medium text-gray-900">
                {data.retailPrice ? `$${data.retailPrice}` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Shipping</p>
              <p className="text-sm font-medium text-gray-900">
                {data.shippingRequired ? 'Physical shipping required' : 'No shipping required'}
              </p>
            </div>
          </div>
        </div>

        {/* Creator Preferences */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>👥</span> Creator Preferences
          </h3>
          <div className="space-y-3">
            {data.ageRange?.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Age Range</p>
                <div className="flex flex-wrap gap-1">
                  {data.ageRange.map((age: string) => (
                    <span key={age} className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                      {age}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.location?.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Location</p>
                <div className="flex flex-wrap gap-1">
                  {data.location.map((loc: string) => (
                    <span key={loc} className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.gender?.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Gender</p>
                <div className="flex flex-wrap gap-1">
                  {data.gender.map((g: string) => (
                    <span key={g} className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.ethnicity?.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Ethnicity</p>
                <div className="flex flex-wrap gap-1">
                  {data.ethnicity.map((eth: string) => (
                    <span key={eth} className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                      {eth}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Asset Requirements */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎬</span> Asset Requirements
          </h3>
          <div className="space-y-3">
            {data.deliverables?.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Required Deliverables</p>
                <div className="flex flex-wrap gap-1">
                  {data.deliverables.map((del: string) => (
                    <span key={del} className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                      {del}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.budgetPerCreator && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Budget per Creator</p>
                <p className="text-sm font-medium text-gray-900">${data.budgetPerCreator}</p>
              </div>
            )}
            {data.deadline && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Deadline</p>
                <p className="text-sm font-medium text-gray-900">{data.deadline}</p>
              </div>
            )}
            {data.usageRights && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Usage Rights</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{data.usageRights}</p>
              </div>
            )}
            {data.guidelines && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Content Guidelines</p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                  {data.guidelines}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Once you publish this campaign, creators will be able to see and apply to it.
          </p>
          <div className="flex gap-3">
            <button className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Save as Draft
            </button>
            <button className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors">
              Publish Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

