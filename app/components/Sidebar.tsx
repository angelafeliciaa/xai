'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { name: 'Brand Match', href: '/match', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )},
    { name: 'Find Creators', href: '/creators', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { name: 'Vector Search', href: '/search', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )},
  ];

  return (
    <div className="w-64 h-screen bg-black flex flex-col fixed left-0 top-0 border-r border-white/10">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">X</span>
          </div>
          <div>
            <h1 className="text-white font-semibold tracking-tight">CreatorMatch</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">by xAI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-white text-black font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Index Stats</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xl font-semibold text-white">51</p>
              <p className="text-[10px] text-white/40 uppercase">Profiles</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">484</p>
              <p className="text-[10px] text-white/40 uppercase">Tweets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Powered by */}
      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 text-center">
          Powered by Grok & Pinecone
        </p>
      </div>
    </div>
  );
}
