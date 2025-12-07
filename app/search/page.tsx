'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface SearchResult {
  id: string;
  score: number;
  metadata: {
    post_id: string;
    text: string;
    author_username: string;
    author_followers: number;
    like_count?: number;
    retweet_count?: number;
    created_at?: string;
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [topK, setTopK] = useState('10');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        top_k: topK,
      });
      if (minFollowers) {
        params.append('min_followers', minFollowers);
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.5) return 'bg-green-100 text-green-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-56 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Vector Search</h1>
            <p className="text-gray-600">Test semantic search against creator posts in the vector database</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Query / Search Text
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., AI startup seeking tech thought leaders for product launch campaign"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="topK" className="block text-sm font-medium text-gray-700 mb-2">
                  Results Count
                </label>
                <select
                  id="topK"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="5">5 results</option>
                  <option value="10">10 results</option>
                  <option value="20">20 results</option>
                  <option value="50">50 results</option>
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="minFollowers" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Followers (optional)
                </label>
                <input
                  type="number"
                  id="minFollowers"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Posts'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">
                Found {results.length} matching posts
              </h2>

              {results.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                      <a
                        href={`https://x.com/${result.metadata.author_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        @{result.metadata.author_username}
                      </a>
                      <span className="text-sm text-gray-500">
                        {formatFollowers(result.metadata.author_followers)} followers
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(3)}
                    </span>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-3">
                    {result.metadata.text}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {result.metadata.like_count !== undefined && (
                      <span>❤️ {result.metadata.like_count.toLocaleString()}</span>
                    )}
                    {result.metadata.retweet_count !== undefined && (
                      <span>🔁 {result.metadata.retweet_count.toLocaleString()}</span>
                    )}
                    <a
                      href={`https://x.com/${result.metadata.author_username}/status/${result.metadata.post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-auto"
                    >
                      View on X →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && query && (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <p className="text-gray-600">No results found. Try a different query.</p>
            </div>
          )}

          {/* Initial state */}
          {!query && results.length === 0 && (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Test Vector Search</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter a campaign description or search query above to find semantically similar creator posts from the Pinecone index.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
