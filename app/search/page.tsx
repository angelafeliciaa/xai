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
    if (score >= 0.5) return 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30';
    if (score >= 0.4) return 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30';
    return 'bg-white/10 text-white/60 ring-1 ring-white/10';
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">Vector Search</h1>
            <p className="text-white/50">Test semantic search against creator posts in the vector database</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <div className="mb-4">
              <label htmlFor="query" className="block text-sm font-medium text-white/70 mb-2">
                Campaign Query / Search Text
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., AI startup seeking tech thought leaders for product launch campaign"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none transition-all"
                rows={3}
              />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="topK" className="block text-sm font-medium text-white/70 mb-2">
                  Results Count
                </label>
                <select
                  id="topK"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                >
                  <option value="5">5 results</option>
                  <option value="10">10 results</option>
                  <option value="20">20 results</option>
                  <option value="50">50 results</option>
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="minFollowers" className="block text-sm font-medium text-white/70 mb-2">
                  Min Followers (optional)
                </label>
                <input
                  type="number"
                  id="minFollowers"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Posts'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white">
                Found {results.length} matching posts
              </h2>

              {results.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/40">#{index + 1}</span>
                      <a
                        href={`https://x.com/${result.metadata.author_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-white/80 transition-colors"
                      >
                        @{result.metadata.author_username}
                      </a>
                      <span className="text-sm text-white/40">
                        {formatFollowers(result.metadata.author_followers)} followers
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(3)}
                    </span>
                  </div>

                  <p className="text-white/70 whitespace-pre-wrap mb-3">
                    {result.metadata.text}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-white/40">
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
                      className="text-white/50 hover:text-white transition-colors ml-auto"
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
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
              <p className="text-white/50">No results found. Try a different query.</p>
            </div>
          )}

          {/* Initial state */}
          {!query && results.length === 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Test Vector Search</h3>
              <p className="text-white/50 max-w-md mx-auto">
                Enter a campaign description or search query above to find semantically similar creator posts from the Pinecone index.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
