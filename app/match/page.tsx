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

  // Filter state
  const [minFollowers, setMinFollowers] = useState<string>('');

  // Drill-down state
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorTweets, setCreatorTweets] = useState<TweetResult[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);

  // Expanded card state
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const ingestProfile = useCallback(async (user: string, type: string): Promise<boolean> => {
    setStatusMessage(`Ingesting @${user} from X (this may take a few seconds)...`);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ingestion failed');
      }

      setStatusMessage(data.existed ? 'Profile found!' : `Ingested @${user} successfully!`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest profile');
      return false;
    }
  }, []);

  // Core match logic that can be called programmatically
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

      if (minFollowersFilter) {
        params.set('min_followers', minFollowersFilter);
      }

      let response = await fetch(`/api/match?${params}`);
      let data = await response.json();

      // If profile not found, try to ingest it
      if (response.status === 404 && data.error?.includes('not found')) {
        const ingested = await ingestProfile(searchUsername.trim(), type);
        if (!ingested) {
          setLoading(false);
          return;
        }

        // Retry the match
        setStatusMessage('Finding matches...');
        response = await fetch(`/api/match?${params}`);
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || 'Match failed');
      }

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

  // Read URL params and auto-trigger search
  useEffect(() => {
    if (initialized) return;

    const urlUsername = searchParams.get('username');
    const urlType = searchParams.get('type') as 'brand' | 'creator' | null;

    if (urlUsername) {
      setUsername(urlUsername);
      if (urlType === 'brand' || urlType === 'creator') {
        setSearcherType(urlType);
      }
      setInitialized(true);
      // Auto-trigger search after state is set
      setTimeout(() => {
        performMatch(urlUsername, urlType || 'brand');
      }, 100);
    } else {
      setUsername('Nike'); // Default
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get tweets');
      }

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

  const getScoreColor = (score: number) => {
    if (score >= 0.55) return 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30';
    if (score >= 0.5) return 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30';
    return 'bg-white/10 text-white/60 ring-1 ring-white/10';
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">Brand-Creator Match</h1>
            <p className="text-white/50">Find creators that match a brand&apos;s voice and content style</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleMatch} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="username" className="block text-sm font-medium text-white/70 mb-2">
                  Username (without @)
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., Nike"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                />
              </div>
              <div className="w-36">
                <label htmlFor="type" className="block text-sm font-medium text-white/70 mb-2">
                  I am a...
                </label>
                <select
                  id="type"
                  value={searcherType}
                  onChange={(e) => setSearcherType(e.target.value as 'brand' | 'creator')}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                >
                  <option value="brand">Brand</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
              <div className="w-40">
                <label htmlFor="minFollowers" className="block text-sm font-medium text-white/70 mb-2">
                  Min Followers
                </label>
                <select
                  id="minFollowers"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                >
                  <option value="">Any</option>
                  <option value="10000">10K+</option>
                  <option value="50000">50K+</option>
                  <option value="100000">100K+</option>
                  <option value="500000">500K+</option>
                  <option value="1000000">1M+</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Matching...
                  </span>
                ) : 'Find Matches'}
              </button>
            </div>
          </form>

          {/* Status Message */}
          {statusMessage && !error && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-white/40 border-t-transparent rounded-full"></div>
              <p className="text-white/70">{statusMessage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Query Profile Info */}
          {queryProfile && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center gap-4">
              {queryProfile.profile_image_url && (
                <img
                  src={queryProfile.profile_image_url.replace('_normal', '_bigger')}
                  alt={queryProfile.name}
                  className="w-10 h-10 rounded-full ring-2 ring-white/10"
                />
              )}
              <div>
                <p className="text-white">
                  Searching as <strong>{queryProfile.name}</strong>
                  <span className="text-white/40"> (@{queryProfile.username})</span>
                </p>
                <p className="text-sm text-white/40">
                  {formatFollowers(queryProfile.follower_count)} followers · Finding matching {searcherType === 'brand' ? 'creators' : 'brands'}
                </p>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {matches.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {matches.map((match, index) => (
                <div
                  key={match.profile.username}
                  className={`group bg-white/5 backdrop-blur-sm rounded-2xl p-5 border transition-all cursor-pointer ${
                    selectedCreator === match.profile.username
                      ? 'border-white/40 bg-white/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                  onClick={() => searcherType === 'brand' && handleDrillDown(match.profile.username)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white/20 w-8">#{index + 1}</span>
                      {match.profile.profile_image_url ? (
                        <img
                          src={match.profile.profile_image_url.replace('_normal', '_bigger')}
                          alt={match.profile.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/10">
                          <span className="text-white/50 text-lg">{match.profile.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{match.profile.name}</h3>
                          {match.profile.verified && (
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                            </svg>
                          )}
                        </div>
                        <a
                          href={`https://x.com/${match.profile.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/40 hover:text-white/60 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{match.profile.username}
                        </a>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score || 0)}`}>
                      {((match.score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-sm text-white/50 mb-3 line-clamp-2">
                    {match.profile.description || 'No bio'}
                  </p>

                  {/* Sample Tweet Preview */}
                  {match.profile.sample_tweets && match.profile.sample_tweets.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCard(expandedCard === match.profile.username ? null : match.profile.username);
                        }}
                        className="text-xs text-white/30 hover:text-white/50 flex items-center gap-1 transition-colors"
                      >
                        <span>{expandedCard === match.profile.username ? 'Hide' : 'Show'} sample tweets</span>
                        <svg
                          className={`w-3 h-3 transition-transform ${expandedCard === match.profile.username ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedCard === match.profile.username && (
                        <div className="mt-2 space-y-2">
                          {match.profile.sample_tweets.slice(0, 2).map((tweet, i) => (
                            <p key={i} className="text-xs text-white/40 bg-black/30 p-2 rounded-lg line-clamp-2">
                              {tweet}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                    <span className="text-white/40">{formatFollowers(match.profile.follower_count)} followers</span>
                    {searcherType === 'brand' && (
                      <span className="text-white/50 group-hover:text-white transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View tweets
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drill-down: Creator Tweets */}
          {selectedCreator && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                @{selectedCreator}&apos;s tweets that match @{username}
              </h2>

              {loadingTweets ? (
                <div className="flex items-center gap-2 text-white/50">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading tweets...
                </div>
              ) : creatorTweets.length > 0 ? (
                <div className="space-y-4">
                  {creatorTweets.map((item, index) => (
                    <div key={index} className="border-l-2 border-white/20 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(item.score || 0)}`}>
                          {((item.score || 0) * 100).toFixed(0)}% match
                        </span>
                        <span className="text-xs text-white/40">
                          {item.tweet.likes?.toLocaleString() || 0} likes
                        </span>
                      </div>
                      <p className="text-white/70">{item.tweet.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">No matching tweets found</p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && matches.length === 0 && (
            <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Find Your Match</h3>
              <p className="text-white/50 max-w-md mx-auto mb-4">
                Enter a brand or creator username to find profiles with similar content and voice.
              </p>
              <p className="text-sm text-white/30">
                Try: Nike, WHOOP, Topicals (brands) or elonmusk, MKBHD, garyvee (creators)
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
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-56 flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <MatchContent />
    </Suspense>
  );
}
