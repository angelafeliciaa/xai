'use client';

import Link from 'next/link';
import Sidebar from './components/Sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
            <p className="text-white/50">Welcome to CreatorMatch. Find the perfect creators for your brand.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link
              href="/match"
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Brand Match</h3>
              <p className="text-sm text-white/50">Find creators that match your brand&apos;s voice and content style</p>
            </Link>

            <Link
              href="/creators"
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Find Creators</h3>
              <p className="text-sm text-white/50">Browse all indexed creators and filter by followers</p>
            </Link>

            <Link
              href="/search"
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Vector Search</h3>
              <p className="text-sm text-white/50">Test semantic search against creator posts</p>
            </Link>
          </div>

          {/* How It Works */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-semibold">1</span>
                </div>
                <h4 className="font-medium text-white mb-2">Ingest Profiles</h4>
                <p className="text-sm text-white/40">Profiles from X are fetched and embedded using OpenAI</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-semibold">2</span>
                </div>
                <h4 className="font-medium text-white mb-2">Semantic Matching</h4>
                <p className="text-sm text-white/40">Bio + tweets are combined into profile embeddings</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-semibold">3</span>
                </div>
                <h4 className="font-medium text-white mb-2">Find Matches</h4>
                <p className="text-sm text-white/40">Vector similarity finds creators that match your brand voice</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <p className="text-3xl font-semibold text-white mb-1">51</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Profiles Indexed</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <p className="text-3xl font-semibold text-white mb-1">484</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Tweets Analyzed</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <p className="text-3xl font-semibold text-white mb-1">21</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Brands</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center">
              <p className="text-3xl font-semibold text-white mb-1">30</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Creators</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
