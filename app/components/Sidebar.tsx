'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState({ profiles: 0, tweets: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats({ profiles: data.profiles || 0, tweets: data.tweets || 0 }))
      .catch(() => {});
  }, []);

  const navItems = [
    { name: 'Home', href: '/', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { name: 'Brand Match', href: '/match', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )},
    { name: 'Creators', href: '/creators', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { name: 'Search', href: '/search', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )},
  ];

  return (
    <div className="hidden md:flex w-64 h-screen bg-[#050505] flex-col fixed left-0 top-0 border-r border-white/[0.06] z-40">
      {/* Logo */}
      <div className="p-6 pb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden group-hover:scale-105 transition-transform">
            <Image
              src="/images/logo-64.png"
              alt="xCreator Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-white font-medium text-sm tracking-tight">xCreator</h1>
            <p className="text-[10px] text-white/30">by xAI</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Index Status */}
      <div className="p-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Index</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-emerald-500/80">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-lg font-medium text-white">{stats.profiles}</div>
              <div className="text-[10px] text-white/30">Profiles</div>
            </div>
            <div>
              <div className="text-lg font-medium text-white">{stats.tweets}</div>
              <div className="text-[10px] text-white/30">Tweets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pt-0">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/20">
          <span>Powered by</span>
          <span className="text-white/40">Grok</span>
          <span>&</span>
          <span className="text-white/40">Pinecone</span>
        </div>
      </div>
    </div>
  );
}
