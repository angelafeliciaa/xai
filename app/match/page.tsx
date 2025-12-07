'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

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

export default function MatchPage() {
  const [username, setUsername] = useState('Nike');
  const [searcherType, setSearcherType] = useState<'brand' | 'creator'>('brand');
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

  const ingestProfile = async (user: string, type: string): Promise<boolean> => {
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
  };

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setStatusMessage(null);
    setSelectedCreator(null);
    setCreatorTweets([]);

    try {
      const params = new URLSearchParams({
        username: username.trim(),
        type: searcherType,
        top_k: '10',
      });

      if (minFollowers) {
        params.set('min_followers', minFollowers);
      }

      let response = await fetch(`/api/match?${params}`);
      let data = await response.json();

      // If profile not found, try to ingest it
      if (response.status === 404 && data.error?.includes('not found')) {
        const ingested = await ingestProfile(username.trim(), searcherType);
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
  };

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
    if (score >= 0.55) return 'bg-green-100 text-green-800';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-56 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Brand-Creator Match</h1>
            <p className="text-gray-600">Find creators that match a brand's voice and content style</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleMatch} className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username (without @)
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., Nike"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="w-36">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  I am a...
                </label>
                <select
                  id="type"
                  value={searcherType}
                  onChange={(e) => setSearcherType(e.target.value as 'brand' | 'creator')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="brand">Brand</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
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
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:bg-gray-300"
              >
                {loading ? 'Matching...' : 'Find Matches'}
              </button>
            </div>
          </form>

          {/* Status Message */}
          {statusMessage && !error && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              <p className="text-gray-700">{statusMessage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Query Profile Info */}
          {queryProfile && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800">
                Searching as <strong>{queryProfile.name}</strong> (@{queryProfile.username}) -
                {' '}{formatFollowers(queryProfile.follower_count)} followers -
                Finding matching {searcherType === 'brand' ? 'creators' : 'brands'}
              </p>
            </div>
          )}

          {/* Results Grid */}
          {matches.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {matches.map((match, index) => (
                <div
                  key={match.profile.username}
                  className={`bg-white rounded-xl p-5 border transition-all cursor-pointer ${
                    selectedCreator === match.profile.username
                      ? 'border-black ring-2 ring-black'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => searcherType === 'brand' && handleDrillDown(match.profile.username)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                      {match.profile.profile_image_url ? (
                        <img
                          src={match.profile.profile_image_url.replace('_normal', '_bigger')}
                          alt={match.profile.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-lg">{match.profile.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{match.profile.name}</h3>
                          {match.profile.verified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                            </svg>
                          )}
                        </div>
                        <a
                          href={`https://x.com/${match.profile.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
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

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
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
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
                            <p key={i} className="text-xs text-gray-500 bg-gray-50 p-2 rounded line-clamp-2">
                              {tweet}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formatFollowers(match.profile.follower_count)} followers</span>
                    {searcherType === 'brand' && (
                      <span className="text-blue-600">Click to see matching tweets →</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drill-down: Creator Tweets */}
          {selectedCreator && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">
                @{selectedCreator}&apos;s tweets that match @{username}
              </h2>

              {loadingTweets ? (
                <p className="text-gray-500">Loading tweets...</p>
              ) : creatorTweets.length > 0 ? (
                <div className="space-y-4">
                  {creatorTweets.map((item, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(item.score || 0)}`}>
                          Score: {(item.score || 0).toFixed(3)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.tweet.likes?.toLocaleString() || 0} likes
                        </span>
                      </div>
                      <p className="text-gray-700">{item.tweet.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No matching tweets found</p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && matches.length === 0 && (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Find Your Match</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                Enter a brand or creator username to find profiles with similar content and voice.
              </p>
              <p className="text-sm text-gray-500">
                Available profiles: Nike (brand), elonmusk, sama, paulg, naval, garyvee, MKBHD (creators)
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
