'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

interface Creator {
  username: string;
  name: string;
  description?: string;
  follower_count: number;
  verified?: boolean;
  verified_type?: string;
  profile_image_url?: string;
  sample_tweets?: string[];
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (minFollowers) params.set('min_followers', minFollowers);
      if (verifiedOnly) params.set('verified', 'true');

      const response = await fetch(`/api/creators?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch creators');
      }

      setCreators(data.creators);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const handleFilter = () => {
    fetchCreators();
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Find Creators</h1>
            <p className="text-gray-600">Browse indexed creators and find the perfect match for your brand</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="w-40">
                <label htmlFor="minFollowers" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Followers
                </label>
                <select
                  id="minFollowers"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="10000">10K+</option>
                  <option value="50000">50K+</option>
                  <option value="100000">100K+</option>
                  <option value="500000">500K+</option>
                  <option value="1000000">1M+</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verifiedOnly"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor="verifiedOnly" className="text-sm text-gray-700">
                  Verified only
                </label>
              </div>
              <button
                onClick={handleFilter}
                disabled={loading}
                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:bg-gray-300"
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Stats */}
          {!loading && !error && (
            <div className="mb-4 text-sm text-gray-500">
              Found {creators.length} creators
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Creators Grid */}
          {!loading && creators.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((creator) => (
                <div
                  key={creator.username}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {creator.profile_image_url ? (
                      <img
                        src={creator.profile_image_url.replace('_normal', '_bigger')}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg">{creator.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{creator.name}</h3>
                        {creator.verified && (
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                          </svg>
                        )}
                      </div>
                      <a
                        href={`https://x.com/${creator.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        @{creator.username}
                      </a>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {creator.description || 'No bio'}
                  </p>

                  {/* Sample Tweet Preview */}
                  {creator.sample_tweets && creator.sample_tweets.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setExpandedCard(expandedCard === creator.username ? null : creator.username)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <span>{expandedCard === creator.username ? 'Hide' : 'Show'} sample tweets</span>
                        <svg
                          className={`w-3 h-3 transition-transform ${expandedCard === creator.username ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedCard === creator.username && (
                        <div className="mt-2 space-y-2">
                          {creator.sample_tweets.slice(0, 2).map((tweet, i) => (
                            <p key={i} className="text-xs text-gray-500 bg-gray-50 p-2 rounded line-clamp-2">
                              {tweet}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatFollowers(creator.follower_count)} followers</span>
                    <a
                      href={`/match?username=${creator.username}&type=creator`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Find matching brands →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && creators.length === 0 && (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Creators Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No creators match your current filters. Try adjusting the filters or ingest more creators.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
