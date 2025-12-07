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

  // Drill-down state
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorTweets, setCreatorTweets] = useState<TweetResult[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedCreator(null);
    setCreatorTweets([]);

    try {
      const params = new URLSearchParams({
        username: username.trim(),
        type: searcherType,
        top_k: '10',
      });

      const response = await fetch(`/api/match?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Match failed');
      }

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
            <div className="flex gap-4 items-end">
              <div className="flex-1">
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
              <div className="w-48">
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
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:bg-gray-300"
              >
                {loading ? 'Matching...' : 'Find Matches'}
              </button>
            </div>
          </form>

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
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{match.profile.name}</h3>
                          {match.profile.verified && (
                            <span className="text-blue-500">&#10003;</span>
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
                      {(match.score || 0).toFixed(3)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {match.profile.description || 'No bio'}
                  </p>

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
