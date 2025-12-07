'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'name'>('followers');

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

  // Filter and sort creators
  const filteredCreators = creators
    .filter(creator => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        creator.username.toLowerCase().includes(query) ||
        creator.name.toLowerCase().includes(query) ||
        (creator.description?.toLowerCase().includes(query) ?? false)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'followers') return b.follower_count - a.follower_count;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 lg:p-12">
        <div className="max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-white mb-2 tracking-tight">Creators</h1>
            <p className="text-white/40">Browse and discover creator profiles in the database</p>
          </div>

          {/* Search & Filters Bar */}
          <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search creators..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-white/[0.08]" />

              {/* Min Followers */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 uppercase tracking-wider">Followers</span>
                <select
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                >
                  <option value="">Any</option>
                  <option value="10000">10K+</option>
                  <option value="50000">50K+</option>
                  <option value="100000">100K+</option>
                  <option value="500000">500K+</option>
                  <option value="1000000">1M+</option>
                </select>
              </div>

              {/* Verified Toggle */}
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  verifiedOnly
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/[0.03] text-white/50 border border-white/[0.08] hover:border-white/[0.15] hover:text-white/70'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                </svg>
                Verified
              </button>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 uppercase tracking-wider">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'followers' | 'name')}
                  className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                >
                  <option value="followers">Most followers</option>
                  <option value="name">A-Z</option>
                </select>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleFilter}
                disabled={loading}
                className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 disabled:opacity-40 transition-all text-sm"
              >
                {loading ? 'Loading...' : 'Apply'}
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {!loading && !error && (
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-white/40">
                Showing {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/[0.05] rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/[0.05] rounded w-24 mb-2"></div>
                      <div className="h-3 bg-white/[0.05] rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-white/[0.05] rounded w-full mb-2"></div>
                  <div className="h-3 bg-white/[0.05] rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Creators Grid */}
          {!loading && filteredCreators.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.username}
                  className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] p-5 transition-all duration-300"
                >
                  {/* Profile Header */}
                  <div className="flex items-start gap-3 mb-4">
                    {creator.profile_image_url ? (
                      <img
                        src={creator.profile_image_url.replace('_normal', '_bigger')}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full ring-2 ring-white/[0.06]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center ring-2 ring-white/[0.06]">
                        <span className="text-white/40 font-medium text-lg">{creator.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-medium text-white truncate">{creator.name}</h3>
                        {creator.verified && (
                          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                          </svg>
                        )}
                      </div>
                      <a
                        href={`https://x.com/${creator.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/30 hover:text-white/50 transition-colors"
                      >
                        @{creator.username}
                      </a>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-white/40 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {creator.description || 'No bio available'}
                  </p>

                  {/* Sample Tweets */}
                  {creator.sample_tweets && creator.sample_tweets.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedCard(expandedCard === creator.username ? null : creator.username)}
                        className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {expandedCard === creator.username ? 'Hide tweets' : 'Sample tweets'}
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
                        <div className="mt-3 space-y-2">
                          {creator.sample_tweets.slice(0, 2).map((tweet, i) => (
                            <p key={i} className="text-xs text-white/35 bg-white/[0.03] px-3 py-2.5 rounded-lg line-clamp-3 border border-white/[0.04]">
                              "{tweet}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">{formatFollowers(creator.follower_count)}</span>
                    </div>
                    <Link
                      href={`/match?username=${creator.username}&type=creator`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] text-white/70 hover:bg-white hover:text-black transition-all duration-200"
                    >
                      Find brands
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredCreators.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No creators found</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : 'Try adjusting your filters or ingest more creators.'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
