'use client';

interface CreatorsStepProps {
  data: any;
  updateData: (data: any) => void;
}

export default function CreatorsStep({ data, updateData }: CreatorsStepProps) {
  const toggleArrayItem = (key: string, value: string) => {
    const current = data[key] || [];
    const updated = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value];
    updateData({ [key]: updated });
  };

  const ageRanges = ['18-24', '25-34', '35-44', '45+', 'No Preference'];
  const locations = ['United States', 'Canada', 'United Kingdom', 'Australia', 'International'];
  const genders = ['Male', 'Female', 'All'];
  const ethnicities = [
    'American Indian or Alaska Native',
    'Asian',
    'Black/African/Caribbean',
    'Hispanic or Latino',
    'Middle Eastern or North African',
    'Native Hawaiian or Pacific Islander',
    'White',
    'No Preference',
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Creator Preferences</h2>
        <p className="text-sm text-gray-600">
          Define your ideal creator profile by selecting preferences across different categories.
        </p>
      </div>

      <div className="space-y-8">
        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Age Range</label>
          <div className="flex flex-wrap gap-2">
            {ageRanges.map((age) => (
              <button
                key={age}
                onClick={() => toggleArrayItem('ageRange', age)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  data.ageRange?.includes(age)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => toggleArrayItem('location', loc)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  data.location?.includes(loc)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loc === 'United States' && '🇺🇸'}
                {loc === 'Canada' && '🇨🇦'}
                {loc === 'United Kingdom' && '🇬🇧'}
                {loc === 'Australia' && '🇦🇺'}
                {loc === 'International' && '🌍'}
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
          <div className="flex gap-2">
            {genders.map((gender) => (
              <button
                key={gender}
                onClick={() => toggleArrayItem('gender', gender)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  data.gender?.includes(gender)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Ethnicity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Ethnicity</label>
          <div className="flex flex-wrap gap-2">
            {ethnicities.map((ethnicity) => (
              <button
                key={ethnicity}
                onClick={() => toggleArrayItem('ethnicity', ethnicity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  data.ethnicity?.includes(ethnicity)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ethnicity}
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Industry <span className="text-gray-400 text-xs ml-1">(Optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'fashion', label: 'Fashion & Apparel', icon: '👗' },
              { value: 'beauty', label: 'Beauty & Cosmetics', icon: '💄' },
              { value: 'fitness', label: 'Health & Fitness', icon: '💪' },
              { value: 'food', label: 'Food & Beverage', icon: '🍔' },
              { value: 'tech', label: 'Technology', icon: '💻' },
              { value: 'home', label: 'Home & Lifestyle', icon: '🏠' },
              { value: 'travel', label: 'Travel', icon: '✈️' },
              { value: 'gaming', label: 'Gaming', icon: '🎮' },
            ].map((industry) => (
              <button
                key={industry.value}
                onClick={() => toggleArrayItem('industries', industry.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  data.industries?.includes(industry.value)
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{industry.icon}</span>
                {industry.label}
              </button>
            ))}
          </div>
        </div>

        {/* Follower Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Minimum Follower Count <span className="text-gray-400 text-xs ml-1">(Optional)</span>
          </label>
          <input
            type="number"
            value={data.minFollowers || ''}
            onChange={(e) => updateData({ minFollowers: e.target.value })}
            placeholder="e.g., 10000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

