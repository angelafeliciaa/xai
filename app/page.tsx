'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from './components/Sidebar';

interface Stats {
  profiles: number;
  tweets: number;
  brands: number;
  creators: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ profiles: 0, tweets: 0, brands: 0, creators: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          profiles: data.profiles || 0,
          tweets: data.tweets || 0,
          brands: data.brands || 0,
          creators: data.creators || 0,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 lg:p-12">
        <div className="max-w-5xl">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {stats.profiles} profiles indexed
            </div>
            <h1 className="text-5xl font-medium text-white mb-4 tracking-tight">
              Find creators that
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
                match your brand
              </span>
            </h1>
            <p className="text-lg text-white/40 max-w-xl leading-relaxed">
              Semantic matching powered by embeddings. Discover creators whose content style aligns with your brand voice.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            <Link
              href="/match"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px]"
            >
              <div className="relative rounded-2xl bg-[#0a0a0a] p-6 h-full transition-all duration-300 group-hover:bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white mb-1">Brand Match</h3>
                  <p className="text-sm text-white/40">Find matching creators</p>
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/creators"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px]"
            >
              <div className="relative rounded-2xl bg-[#0a0a0a] p-6 h-full transition-all duration-300 group-hover:bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white mb-1">Browse Creators</h3>
                  <p className="text-sm text-white/40">Explore indexed profiles</p>
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/search"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px]"
            >
              <div className="relative rounded-2xl bg-[#0a0a0a] p-6 h-full transition-all duration-300 group-hover:bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-white mb-1">Vector Search</h3>
                  <p className="text-sm text-white/40">Test semantic queries</p>
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* How it works */}
          <div className="mb-16">
            <h2 className="text-xs font-medium text-white/30 uppercase tracking-widest mb-8">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="text-6xl font-light text-white/[0.03] absolute -top-4 -left-2">01</div>
                <div className="relative">
                  <h4 className="font-medium text-white mb-2">Ingest profiles</h4>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Fetch profiles from X and generate embeddings from bio + recent tweets
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="text-6xl font-light text-white/[0.03] absolute -top-4 -left-2">02</div>
                <div className="relative">
                  <h4 className="font-medium text-white mb-2">Semantic matching</h4>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Profile embeddings capture content style, not just keywords
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="text-6xl font-light text-white/[0.03] absolute -top-4 -left-2">03</div>
                <div className="relative">
                  <h4 className="font-medium text-white mb-2">Find matches</h4>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Vector similarity surfaces creators whose voice matches your brand
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-12 py-8 border-t border-white/5">
            <div>
              <div className="text-2xl font-medium text-white">{stats.profiles}</div>
              <div className="text-xs text-white/30">Profiles</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-white">{stats.tweets}</div>
              <div className="text-xs text-white/30">Tweets</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-white">{stats.brands}</div>
              <div className="text-xs text-white/30">Brands</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-white">{stats.creators}</div>
              <div className="text-xs text-white/30">Creators</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
