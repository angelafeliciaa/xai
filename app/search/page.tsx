'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  const getScoreStyle = (score: number) => {
    if (score >= 0.5) return 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20';
    if (score >= 0.4) return 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20';
    return 'from-white/10 to-white/5 text-white/50 border-white/10';
  };

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#050505]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <img src="/images/logo-64.png" alt="xCreator" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-medium text-sm">xCreator</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/match" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </Link>
            <Link href="/creators" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link href="/search" className="p-2 rounded-lg bg-white/5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8 lg:p-12 pt-20 md:pt-8 lg:pt-12">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="mb-6 md:mb-10">
            <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2 tracking-tight">Vector Search</h1>
            <p className="text-sm md:text-base text-white/40">Test semantic search against creator tweets</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6 md:mb-8">
            <div className="mb-4">
              <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Query</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="AI startup seeking tech thought leaders for product launch campaign"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all resize-none text-sm md:text-base"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Results</label>
                <select
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Min Followers</label>
                <input
                  type="number"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  placeholder="Any"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full sm:flex-1 px-6 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    Searching
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="text-sm text-white/40 mb-4">{results.length} results</div>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-white/[0.08] to-transparent hover:from-white/[0.12] transition-all duration-300"
                  >
                    <div className="rounded-2xl bg-[#080808] group-hover:bg-[#0a0a0a] p-5 transition-all">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-light text-white/15">{index + 1}</span>
                          <a
                            href={`https://x.com/${result.metadata.author_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-white hover:text-white/80 transition-colors"
                          >
                            @{result.metadata.author_username}
                          </a>
                          <span className="text-sm text-white/30">
                            {formatFollowers(result.metadata.author_followers)}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-lg bg-gradient-to-r border text-sm font-medium ${getScoreStyle(result.score)}`}>
                          {result.score.toFixed(3)}
                        </div>
                      </div>

                      <p className="text-white/60 text-sm leading-relaxed mb-3">
                        {result.metadata.text}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-white/30">
                        {result.metadata.like_count !== undefined && (
                          <span>{result.metadata.like_count.toLocaleString()} likes</span>
                        )}
                        {result.metadata.retweet_count !== undefined && (
                          <span>{result.metadata.retweet_count.toLocaleString()} retweets</span>
                        )}
                        <a
                          href={`https://x.com/${result.metadata.author_username}/status/${result.metadata.post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/40 hover:text-white/60 transition-colors ml-auto"
                        >
                          View on X
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state after search */}
          {!loading && !error && results.length === 0 && query && (
            <div className="text-center py-12">
              <p className="text-white/40">No results found. Try a different query.</p>
            </div>
          )}

          {/* Initial state */}
          {!query && results.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Semantic tweet search</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                Enter a campaign description to find matching creator tweets from the vector index
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
