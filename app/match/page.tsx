'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export const dynamic = 'force-dynamic';

interface ProfileMetadata {
  type: string;
  username: string;
  name: string;
  description?: string;
  follower_count: number;
  verified?: boolean;
  verified_type?: string;
  profile_image_url?: string;
  sample_tweets?: string[];
}

interface MatchResult {
  score: number;
  profile: ProfileMetadata;
}

interface TweetResult {
  score: number;
  tweet: {
    text: string;
    likes?: number;
    retweets?: number;
    author_username: string;
  };
}

function MatchContent() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [searcherType, setSearcherType] = useState<'brand' | 'creator'>('brand');
  const [initialized, setInitialized] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [queryProfile, setQueryProfile] = useState<ProfileMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorTweets, setCreatorTweets] = useState<TweetResult[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const ingestProfile = useCallback(async (user: string, type: string): Promise<boolean> => {
    setStatusMessage(`Ingesting @${user} from X...`);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ingestion failed');
      setStatusMessage(data.existed ? 'Profile found!' : `Ingested @${user}!`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest profile');
      return false;
    }
  }, []);

  const performMatch = useCallback(async (searchUsername: string, type: 'brand' | 'creator', minFollowersFilter?: string) => {
    if (!searchUsername.trim()) return;
    setLoading(true);
    setError(null);
    setStatusMessage(null);
    setSelectedCreator(null);
    setCreatorTweets([]);

    try {
      const params = new URLSearchParams({
        username: searchUsername.trim(),
        type: type,
        top_k: '10',
      });
      if (minFollowersFilter) params.set('min_followers', minFollowersFilter);

      let response = await fetch(`/api/match?${params}`);
      let data = await response.json();

      if (response.status === 404 && data.error?.includes('not found')) {
        const ingested = await ingestProfile(searchUsername.trim(), type);
        if (!ingested) { setLoading(false); return; }
        setStatusMessage('Finding matches...');
        response = await fetch(`/api/match?${params}`);
        data = await response.json();
      }

      if (!response.ok) throw new Error(data.error || 'Match failed');
      setStatusMessage(null);
      setQueryProfile(data.query_profile);
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMatches([]);
      setQueryProfile(null);
    } finally {
      setLoading(false);
    }
  }, [ingestProfile]);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performMatch(username, searcherType, minFollowers);
  };

  useEffect(() => {
    if (initialized) return;
    const urlUsername = searchParams.get('username');
    const urlType = searchParams.get('type') as 'brand' | 'creator' | null;
    if (urlUsername) {
      setUsername(urlUsername);
      if (urlType === 'brand' || urlType === 'creator') setSearcherType(urlType);
      setInitialized(true);
      setTimeout(() => performMatch(urlUsername, urlType || 'brand'), 100);
    } else {
      setUsername('Nike');
      setInitialized(true);
    }
  }, [searchParams, initialized, performMatch]);

  const handleDrillDown = async (creatorUsername: string) => {
    if (!queryProfile) return;
    setSelectedCreator(creatorUsername);
    setLoadingTweets(true);
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_username: username.trim(),
          creator_username: creatorUsername,
          top_k: 5,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get tweets');
      setCreatorTweets(data.tweets);
    } catch (err) {
      console.error('Drill-down error:', err);
      setCreatorTweets([]);
    } finally {
      setLoadingTweets(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getScoreStyle = (score: number) => {
    if (score >= 0.55) return 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20';
    if (score >= 0.5) return 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20';
    return 'from-white/10 to-white/5 text-white/50 border-white/10';
  };

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 lg:p-12">
        <div className="max-w-5xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-medium text-white mb-2 tracking-tight">Brand Match</h1>
            <p className="text-white/40">Discover creators whose content style aligns with your brand</p>
          </div>

          {/* Search */}
          <form onSubmit={handleMatch} className="mb-8">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nike"
                    className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Type</label>
                <select
                  value={searcherType}
                  onChange={(e) => setSearcherType(e.target.value as 'brand' | 'creator')}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="brand">Brand</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Min Followers</label>
                <select
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Any</option>
                  <option value="10000">10K+</option>
                  <option value="100000">100K+</option>
                  <option value="1000000">1M+</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Matching</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Match</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Status */}
          {statusMessage && !error && (
            <div className="flex items-center gap-3 mb-6 text-white/50">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              {statusMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Query Profile */}
          {queryProfile && (
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/[0.06]">
              {queryProfile.profile_image_url && (
                <img
                  src={queryProfile.profile_image_url.replace('_normal', '_bigger')}
                  alt={queryProfile.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{queryProfile.name}</span>
                  <span className="text-white/30">@{queryProfile.username}</span>
                </div>
                <div className="text-sm text-white/40">
                  {formatFollowers(queryProfile.follower_count)} followers · Finding {searcherType === 'brand' ? 'creators' : 'brands'}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {matches.length > 0 && (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <div
                  key={match.profile.username}
                  onClick={() => searcherType === 'brand' && handleDrillDown(match.profile.username)}
                  className={`group relative rounded-2xl p-[1px] transition-all duration-300 cursor-pointer ${
                    selectedCreator === match.profile.username
                      ? 'bg-gradient-to-r from-white/30 to-white/10'
                      : 'bg-gradient-to-r from-white/[0.08] to-transparent hover:from-white/[0.12]'
                  }`}
                >
                  <div className={`rounded-2xl p-5 transition-all ${
                    selectedCreator === match.profile.username ? 'bg-[#0a0a0a]' : 'bg-[#080808] group-hover:bg-[#0a0a0a]'
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-8 text-center">
                        <span className="text-2xl font-light text-white/10">{index + 1}</span>
                      </div>

                      {/* Avatar */}
                      {match.profile.profile_image_url ? (
                        <img
                          src={match.profile.profile_image_url.replace('_normal', '_bigger')}
                          alt={match.profile.name}
                          className="w-11 h-11 rounded-full"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-white/30 font-medium">{match.profile.name.charAt(0)}</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-white">{match.profile.name}</span>
                          {match.profile.verified && (
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                            </svg>
                          )}
                          <a
                            href={`https://x.com/${match.profile.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-white/30 hover:text-white/50 transition-colors"
                          >
                            @{match.profile.username}
                          </a>
                        </div>
                        <p className="text-sm text-white/40 truncate">{match.profile.description || 'No bio'}</p>
                      </div>

                      {/* Followers */}
                      <div className="text-right mr-4">
                        <div className="text-sm text-white/60">{formatFollowers(match.profile.follower_count)}</div>
                        <div className="text-xs text-white/30">followers</div>
                      </div>

                      {/* Score */}
                      <div className={`px-4 py-2 rounded-xl bg-gradient-to-r border ${getScoreStyle(match.score)}`}>
                        <span className="text-lg font-medium">{((match.score || 0) * 100).toFixed(0)}%</span>
                      </div>

                      {/* Arrow */}
                      {searcherType === 'brand' && (
                        <svg className="w-5 h-5 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>

                    {/* Expandable tweets */}
                    {match.profile.sample_tweets && match.profile.sample_tweets.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/[0.04]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCard(expandedCard === match.profile.username ? null : match.profile.username);
                          }}
                          className="text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1"
                        >
                          {expandedCard === match.profile.username ? 'Hide' : 'View'} sample tweets
                          <svg className={`w-3 h-3 transition-transform ${expandedCard === match.profile.username ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedCard === match.profile.username && (
                          <div className="mt-3 space-y-2">
                            {match.profile.sample_tweets.slice(0, 2).map((tweet, i) => (
                              <p key={i} className="text-xs text-white/30 bg-white/[0.02] px-3 py-2 rounded-lg line-clamp-2">{tweet}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drill-down */}
          {selectedCreator && (
            <div className="mt-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4">
                Tweets from @{selectedCreator} matching @{username}
              </h3>
              {loadingTweets ? (
                <div className="flex items-center gap-2 text-white/40">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  Loading...
                </div>
              ) : creatorTweets.length > 0 ? (
                <div className="space-y-4">
                  {creatorTweets.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`shrink-0 px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${getScoreStyle(item.score)}`}>
                        {((item.score || 0) * 100).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-white/60 text-sm leading-relaxed">{item.tweet.text}</p>
                        <p className="text-xs text-white/30 mt-1">{item.tweet.likes?.toLocaleString() || 0} likes</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40">No matching tweets found</p>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && matches.length === 0 && !statusMessage && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Find your match</h3>
              <p className="text-white/40 max-w-sm mx-auto mb-4">
                Enter a username to discover profiles with similar content style
              </p>
              <p className="text-sm text-white/20">
                Try: Nike, WHOOP, Topicals, elonmusk, MKBHD
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#050505]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 lg:p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-white/10 border-t-white/60 rounded-full mx-auto mb-4"></div>
            <p className="text-white/40">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <MatchContent />
    </Suspense>
  );
}
