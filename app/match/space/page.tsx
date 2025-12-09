'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Match3DGallery from '../Match3DGallery';

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

function MatchSpaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [queryProfile, setQueryProfile] = useState<ProfileMetadata | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameParam = searchParams.get('username') || 'Nike';
  const typeParam = (searchParams.get('type') as 'brand' | 'creator') || 'brand';

  const fetchMatches = useCallback(
    async (username: string, type: 'brand' | 'creator') => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          username: username.trim(),
          type,
          top_k: '25',
        });
        const response = await fetch(`/api/match?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load matches');
        setQueryProfile(data.query_profile);
        setMatches(data.matches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setQueryProfile(null);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!usernameParam.trim()) return;
    fetchMatches(usernameParam, typeParam);
  }, [fetchMatches, usernameParam, typeParam]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
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
          <Link href="/match" className="p-2 rounded-lg bg-white/5">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <main className="md:ml-64 flex-1 p-4 sm:p-6 lg:p-10 pt-20 md:pt-6 lg:pt-10 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {queryProfile?.profile_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={queryProfile.profile_image_url.replace('_normal', '_bigger')}
                alt={queryProfile.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {queryProfile?.name || usernameParam}
                </span>
                <span className="text-white/30">@{queryProfile?.username || usernameParam}</span>
              </div>
              <div className="text-sm text-white/40">
                {queryProfile
                  ? `${formatFollowers(queryProfile.follower_count)} followers`
                  : 'Exploring in 3D'}
                {' · '}
                {typeParam === 'brand' ? 'Creator matches' : 'Brand matches'} in space
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const base = '/match';
              const params = new URLSearchParams();
              if (usernameParam) params.set('username', usernameParam);
              if (typeParam) params.set('type', typeParam);
              router.push(`${base}?${params.toString()}`);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-2 flex-1">
          {loading && matches.length === 0 ? (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-3xl border border-white/5 bg-[#050505]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
                <p className="text-sm text-white/50">Loading 3D match space…</p>
              </div>
            </div>
          ) : matches.length > 0 ? (
            <Match3DGallery
              matches={matches}
              onExit={() => {
                const base = '/match';
                const params = new URLSearchParams();
                if (usernameParam) params.set('username', usernameParam);
                if (typeParam) params.set('type', typeParam);
                router.push(`${base}?${params.toString()}`);
              }}
            />
          ) : (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-3xl border border-white/5 bg-[#050505]">
              <div className="text-center max-w-sm">
                <p className="mb-2 text-sm font-medium text-white">
                  No matches to display in 3D yet
                </p>
                <p className="text-xs text-white/40">
                  Go back to the list view, run a match, and then reopen the 3D space.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MatchSpacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#050505]">
          <Sidebar />
          <main className="ml-64 flex-1 p-8 lg:p-12 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-white/10 border-t-white/60 rounded-full mx-auto mb-4"></div>
              <p className="text-white/40">Loading 3D space…</p>
            </div>
          </main>
        </div>
      }
    >
      <MatchSpaceContent />
    </Suspense>
  );
}


