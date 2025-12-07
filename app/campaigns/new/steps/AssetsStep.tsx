'use client';

interface AssetsStepProps {
  data: any;
  updateData: (data: any) => void;
}

export default function AssetsStep({ data, updateData }: AssetsStepProps) {
  const deliverableTypes = [
    { id: 'video-short', name: 'Short-Form Video', icon: '🎬', desc: 'TikTok, Reels, Shorts' },
    { id: 'video-long', name: 'Long-Form Video', icon: '🎥', desc: 'YouTube, IGTV' },
    { id: 'photo', name: 'Photo Content', icon: '📸', desc: 'Instagram posts, product shots' },
    { id: 'story', name: 'Story Content', icon: '📱', desc: 'Instagram/Facebook Stories' },
    { id: 'carousel', name: 'Carousel Post', icon: '🖼️', desc: 'Multi-image posts' },
    { id: 'blog', name: 'Blog Post', icon: '✍️', desc: 'Written content' },
  ];

  const toggleDeliverable = (id: string) => {
    const current = data.deliverables || [];
    const updated = current.includes(id)
      ? current.filter((item: string) => item !== id)
      : [...current, id];
    updateData({ deliverables: updated });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset Requirements</h2>
        <p className="text-sm text-gray-600">
          Specify what content you need creators to deliver
        </p>
      </div>

      <div className="space-y-8">
        {/* Deliverables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Required Deliverables <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {deliverableTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleDeliverable(type.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  data.deliverables?.includes(type.id)
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{type.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{type.desc}</p>
                  </div>
                  {data.deliverables?.includes(type.id) && (
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Guidelines */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Guidelines
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Provide specific instructions, talking points, or requirements for the content
          </p>
          <textarea
            value={data.guidelines || ''}
            onChange={(e) => updateData({ guidelines: e.target.value })}
            placeholder="Example: Please mention our brand name at least twice, focus on the product benefits, show the product in use, use upbeat music..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          />
        </div>

        {/* Usage Rights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Content Usage Rights
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="usage"
                checked={data.usageRights === 'organic'}
                onChange={() => updateData({ usageRights: 'organic' })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-sm">Organic Use Only</p>
                <p className="text-xs text-gray-600">Content stays on creator's profile</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="usage"
                checked={data.usageRights === 'limited'}
                onChange={() => updateData({ usageRights: 'limited' })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-sm">Limited Usage Rights</p>
                <p className="text-xs text-gray-600">Brand can use on social media for 6 months</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="usage"
                checked={data.usageRights === 'full'}
                onChange={() => updateData({ usageRights: 'full' })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-sm">Full Usage Rights</p>
                <p className="text-xs text-gray-600">Unlimited use across all channels</p>
              </div>
            </label>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Deadline
          </label>
          <input
            type="date"
            value={data.deadline || ''}
            onChange={(e) => updateData({ deadline: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {/* Budget per Creator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget per Creator
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={data.budgetPerCreator || ''}
              onChange={(e) => updateData({ budgetPerCreator: e.target.value })}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              step="0.01"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This is the compensation each creator will receive for completing the deliverables
          </p>
        </div>
      </div>
    </div>
  );
}

