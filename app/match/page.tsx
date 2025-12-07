'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../components/Sidebar';
import GrokLoader from '../components/GrokLoader';

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

interface TweetResult {
  score: number;
  tweet: {
    text: string;
    likes?: number;
    retweets?: number;
    author_username: string;
  };
}

interface StatResult {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
}

function MatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [searcherType, setSearcherType] = useState<'brand' | 'creator'>('brand');
  const [initialized, setInitialized] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [queryProfile, setQueryProfile] = useState<ProfileMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [minFollowers, setMinFollowers] = useState<number>(0);
  const [maxFollowers, setMaxFollowers] = useState<number>(10000000);
  const [showFollowerFilter, setShowFollowerFilter] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorTweets, setCreatorTweets] = useState<TweetResult[]>([]);
  const [creatorStats, setCreatorStats] = useState<StatResult[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Grok AI features
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [campaignBrief, setCampaignBrief] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [briefCreator, setBriefCreator] = useState<ProfileMetadata | null>(null);
  
  // Predictions
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [loadingPrediction, setLoadingPrediction] = useState<string | null>(null);
  const [expandedPrediction, setExpandedPrediction] = useState<string | null>(null);

  // Outreach DM
  const [outreachMessage, setOutreachMessage] = useState<string | null>(null);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [outreachCreator, setOutreachCreator] = useState<ProfileMetadata | null>(null);
  const [copiedOutreach, setCopiedOutreach] = useState(false);

  const ingestProfile = useCallback(async (user: string, type: string): Promise<boolean> => {
    setStatusMessage(`Ingesting @${user} from X...`);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ingestion failed');
      setStatusMessage(data.existed ? 'Profile found!' : `Ingested @${user}!`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest profile');
      return false;
    }
  }, []);

  const performMatch = useCallback(async (searchUsername: string, type: 'brand' | 'creator', minFollowersFilter?: number, maxFollowersFilter?: number) => {
    if (!searchUsername.trim()) return;
    setLoading(true);
    setError(null);
    setStatusMessage(null);
    setSelectedCreator(null);
    setCreatorTweets([]);
    setCreatorStats([]);
    setExplanations({});
    setCampaignBrief(null);
    setPredictions({});
    setExpandedPrediction(null);
    setExpandedExplanation(null);

    try {
      const params = new URLSearchParams({
        username: searchUsername.trim(),
        type: type,
        top_k: '10',
      });
      if (minFollowersFilter && minFollowersFilter > 0) params.set('min_followers', minFollowersFilter.toString());
      if (maxFollowersFilter && maxFollowersFilter < 10000000) params.set('max_followers', maxFollowersFilter.toString());

      let response = await fetch(`/api/match?${params}`);
      let data = await response.json();

      if (response.status === 404 && data.error?.includes('not found')) {
        const ingested = await ingestProfile(searchUsername.trim(), type);
        if (!ingested) { setLoading(false); return; }
        setStatusMessage('Finding matches...');
        response = await fetch(`/api/match?${params}`);
        data = await response.json();
      }

      if (!response.ok) throw new Error(data.error || 'Match failed');
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
  }, [ingestProfile]);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL to persist username and type
    const params = new URLSearchParams();
    params.set('username', username.trim());
    params.set('type', searcherType);
    router.push(`/match?${params.toString()}`, { scroll: false });
    await performMatch(username, searcherType, minFollowers, maxFollowers);
  };

  useEffect(() => {
    if (initialized) return;
    const urlUsername = searchParams.get('username');
    const urlType = searchParams.get('type') as 'brand' | 'creator' | null;
    if (urlUsername) {
      setUsername(urlUsername);
      if (urlType === 'brand' || urlType === 'creator') setSearcherType(urlType);
      setInitialized(true);
      setTimeout(() => performMatch(urlUsername, urlType || 'brand'), 100);
    } else {
      if (urlType === 'brand'){
        setUsername('elon');
        setInitialized(true);
      } else if (urlType == 'creator'){
        setUsername('Elonmusk');
        setInitialized(true);  
      }
    }
  }, [searchParams, initialized, performMatch]);

  // Fetch profile preview when username changes (debounced)
  useEffect(() => {
    if (!username.trim() || loading) return;
    
    const timer = setTimeout(async () => {
      try {
        setError(null);
        const params = new URLSearchParams({
          username: username.trim(),
          type: searcherType,
          top_k: '0', // Just fetch the profile, no matches needed
        });
        const response = await fetch(`/api/match?${params}`);
        if (response.ok) {
          const data = await response.json();
          setQueryProfile(data.query_profile);
        } else {
          // Profile not found, clear it
          setQueryProfile(null);
        }
      } catch (err) {
        console.error('Profile preview error:', err);
        setQueryProfile(null);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [username, searcherType, loading]);

  const handleDrillDown = async (creatorUsername: string) => {
    if (!queryProfile) return;
    setSelectedCreator(creatorUsername);
    setLoadingTweets(true);
    try {
    //   const response = await fetch('/api/engagement', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       brand_username: username.trim(),
    //       creator_username: creatorUsername,
    //       top_k: 5,
    //     }),
    //   });

    //   const data = await response.json();
    //   if (!response.ok) throw new Error(data.error || 'Failed to get tweets');
    //   setCreatorStats(data.public_metrics);
    //   setCreatorTweets(data.tweets);
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
      if (!response.ok) throw new Error(data.error || 'Failed to get tweets');
      setCreatorTweets(data.tweets);
      
      // Auto-load prediction if not already loaded
      const match = matches.find(m => m.profile.username === creatorUsername);
      if (match && !predictions[creatorUsername] && !loadingPrediction) {
        // Trigger prediction automatically
        setTimeout(() => {
          const fakeEvent = { stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent;
          handlePredictPerformance(fakeEvent, match);
        }, 500); // Small delay to avoid overwhelming
      }
    } catch (err) {
      console.error('Drill-down error:', err);
      setCreatorTweets([]);
    } finally {
      setLoadingTweets(false);
    }
  };

  const handleExplainMatch = async (e: React.MouseEvent, match: MatchResult) => {
    e.stopPropagation();
    e.preventDefault();
    if (!queryProfile) return;
    const username = match.profile.username;
    if (explanations[username]) {
      setExpandedExplanation(prev => prev === username ? null : username);
      return;
    }

    setLoadingExplanation(username);
    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain_match',
          brand: queryProfile,
          creator: match.profile,
          matchScore: match.score,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get explanation');
      setExplanations(prev => ({ ...prev, [match.profile.username]: data.content }));
      setExpandedExplanation(match.profile.username);
    } catch (err) {
      console.error('Explain match error:', err);
      setExplanations(prev => ({ ...prev, [match.profile.username]: 'Failed to generate explanation. Please try again.' }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  const handlePredictPerformance = async (e: React.MouseEvent, match: MatchResult) => {
    e.stopPropagation();
    e.preventDefault();
    if (!queryProfile) return;
    const username = match.profile.username;
    if (predictions[username]) {
      setExpandedPrediction(prev => prev === username ? null : username);
      return;
    }

    setLoadingPrediction(username);
    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'predict_performance',
          brand: queryProfile,
          creator: match.profile,
          matchScore: match.score,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get predictions');
      setPredictions(prev => ({ ...prev, [match.profile.username]: data.content }));
      setExpandedPrediction(match.profile.username);
    } catch (err) {
      console.error('Predict performance error:', err);
      setPredictions(prev => ({ ...prev, [match.profile.username]: 'Failed to generate predictions. Please try again.' }));
    } finally {
      setLoadingPrediction(null);
    }
  };

  // Cost estimator based on follower count and engagement
  const estimateCost = (followerCount: number, matchScore: number) => {
    // HOW THIS WORKS:
    // 1. Industry standard = $10-100 per 1K followers for sponsored posts
    // 2. We use $20/1K as base (mid-range)
    // 3. Better match = worth paying more (adjusted by match score)
    // 4. Example: 100K followers × 54% match = $100K/1K × $20 × 1.04 = ~$2,080
    
    const baseRate = 20; // $20 per 1k followers (industry average)
    const matchAdjustment = 1 + (matchScore - 0.5); // 54% match = 1.04x multiplier
    const costPer1k = baseRate * matchAdjustment;
    const estimatedCost = (followerCount / 1000) * costPer1k;
    
    // Round to clean, readable numbers with ranges
    const roundToNice = (num: number) => {
      if (num < 100) return Math.round(num / 10) * 10; // Round to nearest $10
      if (num < 1000) return Math.round(num / 50) * 50; // Round to nearest $50
      if (num < 10000) return Math.round(num / 100) * 100; // Round to nearest $100
      return Math.round(num / 500) * 500; // Round to nearest $500
    };
    
    // Create ranges (±20-30% depending on size)
    let min, max;
    if (estimatedCost < 100) {
      min = 50;
      max = 150;
    } else if (estimatedCost < 500) {
      min = roundToNice(estimatedCost * 0.7);
      max = roundToNice(estimatedCost * 1.3);
    } else if (estimatedCost < 2000) {
      min = roundToNice(estimatedCost * 0.8);
      max = roundToNice(estimatedCost * 1.2);
    } else {
      min = roundToNice(estimatedCost * 0.9);
      max = roundToNice(estimatedCost * 1.1);
    }
    
    return { min, max };
  };

  // Format currency for display
  const formatCost = (cost: number) => {
    if (cost >= 1000000) return `$${(cost / 1000000).toFixed(1)}M`;
    if (cost >= 1000) return `$${(cost / 1000).toFixed(0)}K`;
    return `$${cost}`;
  };

  // Calculate ROI value score (higher match + lower relative cost = better value)
  const calculateValueScore = (followerCount: number, matchScore: number) => {
    const cost = estimateCost(followerCount, matchScore);
    const avgCost = (cost.min + cost.max) / 2;
    const costPerFollower = avgCost / followerCount;
    
    // Match score contributes 70% of value (0-70 points)
    const matchPoints = matchScore * 70;
    
    // Cost efficiency contributes 30% (0-30 points)
    // Industry baseline: $0.02 per follower
    // Better than baseline = higher score
    const baselineCost = 0.02;
    const costEfficiency = Math.max(0, Math.min(1, 1 - ((costPerFollower - baselineCost) / baselineCost)));
    const costPoints = costEfficiency * 30;
    
    return Math.min(100, Math.max(0, matchPoints + costPoints));
  };

  const handleGenerateBrief = async (e: React.MouseEvent, creator: ProfileMetadata) => {
    e.stopPropagation();
    if (!queryProfile) return;

    setBriefCreator(creator);
    setShowBriefModal(true);
    setLoadingBrief(true);
    setCampaignBrief(null);

    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'campaign_brief',
          brand: queryProfile,
          creator: creator,
          matchingTweets: creatorTweets.map(t => t.tweet),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate brief');
      setCampaignBrief(data.content);
    } catch (err) {
      console.error('Campaign brief error:', err);
      setCampaignBrief('Failed to generate campaign brief. Please try again.');
    } finally {
      setLoadingBrief(false);
    }
  };

  const handleGenerateOutreach = async (e: React.MouseEvent, creator: ProfileMetadata, matchScore: number) => {
    e.stopPropagation();
    if (!queryProfile) return;

    setOutreachCreator(creator);
    setShowOutreachModal(true);
    setLoadingOutreach(true);
    setOutreachMessage(null);
    setCopiedOutreach(false);

    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_outreach',
          brand: queryProfile,
          creator: creator,
          matchScore: matchScore,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate outreach');
      setOutreachMessage(data.content);
    } catch (err) {
      console.error('Outreach generation error:', err);
      setOutreachMessage('Failed to generate outreach message. Please try again.');
    } finally {
      setLoadingOutreach(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getScoreStyle = (score: number) => {
    if (score >= 0.55) return 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20';
    if (score >= 0.5) return 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20';
    return 'from-white/10 to-white/5 text-white/50 border-white/10';
  };

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 lg:p-12">
        <div className="max-w-5xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-medium text-white mb-2 tracking-tight">Brand Match</h1>
            <p className="text-white/40">Discover creators whose content style aligns with your brand</p>
          </div>

          {/* Search */}
          <form onSubmit={handleMatch} className="mb-8">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={searcherType === 'brand' ? 'nike' : 'elonmusk'}
                    className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Type</label>
                <select
                  value={searcherType}
                  onChange={(e) => setSearcherType(e.target.value as 'brand' | 'creator')}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="brand">Brand</option>
                  <option value="creator">Creator</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowerFilter(!showFollowerFilter)}
                className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.12] transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm">Filter</span>
                {(minFollowers > 0 || maxFollowers < 10000000) && (
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                )}
              </button>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="relative w-4 h-4">
                      <div className="absolute inset-0 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    </div>
                    <span>Matching</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Match</span>
                  </>
                )}
              </button>
            </div>

            {/* Follower Range Filter */}
            {showFollowerFilter && (
              <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Follower Range</label>
                
                {/* Range Display */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-white/40 mb-0.5">Min</div>
                    <div className="text-sm font-medium text-white">{formatFollowers(minFollowers)}</div>
                  </div>
                  <div className="text-white/20">—</div>
                  <div className="text-center">
                    <div className="text-xs text-white/40 mb-0.5">Max</div>
                    <div className="text-sm font-medium text-white">
                      {maxFollowers >= 10000000 ? '∞' : formatFollowers(maxFollowers)}
                    </div>
                  </div>
                </div>

                {/* Dual Range Slider */}
                <div className="relative mb-3 pb-2">
                  <div className="relative h-1.5 rounded-full bg-white/[0.05]">
                    {/* Active range highlight */}
                    <div 
                      className="absolute h-full bg-white/20 rounded-full pointer-events-none"
                      style={{
                        left: `${(minFollowers / 10000000) * 100}%`,
                        right: `${100 - (maxFollowers / 10000000) * 100}%`
                      }}
                    />
                  
                    {/* Min thumb slider */}
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="10000"
                      value={minFollowers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val <= maxFollowers) setMinFollowers(val);
                      }}
                      className="dual-range-slider"
                    />
                    
                    {/* Max thumb slider */}
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="50000"
                      value={maxFollowers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= minFollowers) setMaxFollowers(val);
                      }}
                      className="dual-range-slider"
                    />
                  </div>
                </div>

                <div className="flex justify-between mb-4 text-[10px] text-white/20">
                  <span>0</span>
                  <span>2.5M</span>
                  <span>5M</span>
                  <span>7.5M</span>
                  <span>10M+</span>
                </div>

                {/* Quick Presets */}
                <div className="mb-3">
                  <div className="text-xs text-white/40 mb-2">Quick Filters</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setMinFollowers(0); setMaxFollowers(10000); }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
                    >
                      &lt;10K
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMinFollowers(10000); setMaxFollowers(100000); }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
                    >
                      10K-100K
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMinFollowers(100000); setMaxFollowers(1000000); }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
                    >
                      100K-1M
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMinFollowers(1000000); setMaxFollowers(10000000); }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white transition-all"
                    >
                      1M+
                    </button>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={async () => {
                    setShowFollowerFilter(false);
                    if (username.trim()) {
                      await performMatch(username, searcherType, minFollowers, maxFollowers);
                    }
                  }}
                  disabled={loading}
                  className="relative z-10 w-full px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Apply Filter
                </button>
              </div>
            )}
          </form>

          {/* Loading State with Skeleton */}
          {loading && (
            <div className="mb-8 animate-in fade-in duration-300">
              {/* Loading Header */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/[0.06]">
                <div className="w-12 h-12 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-white/[0.05] rounded animate-pulse mb-2" />
                  <div className="h-4 w-48 bg-white/[0.03] rounded animate-pulse" />
                </div>
              </div>

              {/* Grok Loading Animation */}
              <div className="mb-8">
                <GrokLoader />
              </div>

              {/* Skeleton Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="h-3 w-16 bg-white/[0.05] rounded mb-3" />
                    <div className="h-6 w-12 bg-white/[0.08] rounded mb-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/[0.05]" />
                      <div className="flex-1">
                        <div className="h-3 w-20 bg-white/[0.05] rounded mb-1" />
                        <div className="h-2 w-16 bg-white/[0.03] rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skeleton Result Rows */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-white/[0.03]" />
                      <div className="w-11 h-11 rounded-full bg-white/[0.05]" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-white/[0.05] rounded mb-2" />
                        <div className="h-3 w-48 bg-white/[0.03] rounded" />
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-12 bg-white/[0.05] rounded mb-1" />
                        <div className="h-3 w-16 bg-white/[0.03] rounded" />
                      </div>
                      <div className="h-10 w-16 rounded-xl bg-white/[0.05]" />
                      <div className="h-9 w-20 rounded-lg bg-white/[0.03]" />
                      <div className="h-9 w-16 rounded-lg bg-white/[0.03]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Message (for ingestion) */}
          {statusMessage && !error && !loading && (
            <div className="flex items-center gap-3 mb-6 text-white/50">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              {statusMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Query Profile + view toggle */}
          {queryProfile && (
            <div className="mb-8 pb-8 border-b border-white/[0.06] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {queryProfile.profile_image_url && (
                  <img
                    src={queryProfile.profile_image_url.replace('_normal', '_bigger')}
                    alt={queryProfile.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{queryProfile.name}</span>
                    <a
                      href={`https://x.com/${queryProfile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white/50 transition-colors"
                    >
                      @{queryProfile.username}
                    </a>
                  </div>
                  <div className="text-sm text-white/40">
                    {formatFollowers(queryProfile.follower_count)} followers · Finding {searcherType === 'brand' ? 'creators' : 'brands'}
                  </div>
                </div>
              </div>

              {matches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!queryProfile) return;
                    const params = new URLSearchParams();
                    params.set('username', queryProfile.username);
                    params.set('type', searcherType);
                    router.push(`/match/space?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-xs font-medium text-black px-3 py-1.5 hover:bg-white/90"
                >
                  <span>Open 3D space</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {matches.length > 0 && (
            <>
              {/* Quick Insights */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                {(() => {
                  // Filter matches by follower range
                  const filteredMatches = matches.filter(m => {
                    const followers = m.profile.follower_count;
                    const meetsMin = minFollowers === 0 || followers >= minFollowers;
                    const meetsMax = maxFollowers >= 10000000 || followers <= maxFollowers;
                    return meetsMin && meetsMax;
                  });

                  if (filteredMatches.length === 0) return null;

                  // Calculate best picks from filtered matches
                  const highestMatch = filteredMatches[0]; // Already sorted by match score
                  
                  const mostCostEffective = filteredMatches.reduce((best, curr) => {
                    const currCost = estimateCost(curr.profile.follower_count, curr.score);
                    const bestCost = estimateCost(best.profile.follower_count, best.score);
                    return (currCost.min + currCost.max) / 2 < (bestCost.min + bestCost.max) / 2 ? curr : best;
                  });
                  
                  const highestReach = filteredMatches.reduce((best, curr) => 
                    curr.profile.follower_count > best.profile.follower_count ? curr : best
                  );

                  const insights: Array<{ label: string; creator: typeof highestMatch; metric: string; color: string }> = [
                    // { label: 'Best Match', creator: highestMatch, metric: `${(highestMatch.score * 100).toFixed(0)}%`, color: 'emerald' },
                    // { label: 'Most Affordable', creator: mostCostEffective, metric: `${formatCost(estimateCost(mostCostEffective.profile.follower_count, mostCostEffective.score).min)}+`, color: 'cyan' },
                    // { label: 'Highest Reach', creator: highestReach, metric: formatFollowers(highestReach.profile.follower_count), color: 'purple' },
                  ];

                  const colorMap = {
                    emerald: { text: 'rgb(52, 211, 153)', textFaded: 'rgba(52, 211, 153, 0.6)' },
                    cyan: { text: 'rgb(34, 211, 238)', textFaded: 'rgba(34, 211, 238, 0.6)' },
                    purple: { text: 'rgb(192, 132, 252)', textFaded: 'rgba(192, 132, 252, 0.6)' },
                  };

                  return insights.map((insight, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.03] transition-all cursor-pointer"
                      onClick={() => handleDrillDown(insight.creator.profile.username)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: colorMap[insight.color as keyof typeof colorMap].textFaded }}>
                          {insight.label}
                        </div>
                        <div className="text-lg font-medium" style={{ color: colorMap[insight.color as keyof typeof colorMap].text }}>
                          {insight.metric}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {insight.creator.profile.profile_image_url && (
                          <img src={insight.creator.profile.profile_image_url} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">{insight.creator.profile.name}</div>
                          <div className="text-xs text-white/30 truncate">
                            <a
                              href={`https://x.com/${insight.creator.profile.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-white/50 transition-colors"
                            >
                              @{insight.creator.profile.username}
                            </a>
                            {' · '}{formatFollowers(insight.creator.profile.follower_count)} followers
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="space-y-3">
              {matches.filter(m => {
                const followers = m.profile.follower_count;
                const meetsMin = minFollowers === 0 || followers >= minFollowers;
                const meetsMax = maxFollowers >= 10000000 || followers <= maxFollowers;
                return meetsMin && meetsMax;
              }).map((match, index) => (
                <div
                  key={match.profile.username}
                  onClick={() => {
                    if (searcherType !== 'brand') return;
                    // Toggle: if already selected, deselect; otherwise select
                    if (selectedCreator === match.profile.username) {
                      setSelectedCreator(null);
                      setCreatorTweets([]);
                      setExpandedExplanation(null);
                      setExpandedPrediction(null);
                      setExpandedCard(null);
                    } else {
                      handleDrillDown(match.profile.username);
                    }
                  }}
                  className={`group relative rounded-2xl p-[1px] transition-all duration-300 cursor-pointer ${
                    selectedCreator === match.profile.username
                      ? 'bg-gradient-to-r from-white/30 to-white/10'
                      : 'bg-gradient-to-r from-white/[0.08] to-transparent hover:from-white/[0.12]'
                  }`}
                >
                  <div className={`rounded-2xl p-5 transition-all ${
                    selectedCreator === match.profile.username ? 'bg-[#0a0a0a]' : 'bg-[#080808] group-hover:bg-[#0a0a0a]'
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-8 text-center">
                        <span className="text-2xl font-light text-white/10">{index + 1}</span>
                      </div>

                      {/* Avatar */}
                      {match.profile.profile_image_url ? (
                        <img
                          src={match.profile.profile_image_url.replace('_normal', '_bigger')}
                          alt={match.profile.name}
                          className="w-11 h-11 rounded-full"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-white/30 font-medium">{match.profile.name.charAt(0)}</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-white">{match.profile.name}</span>
                          {match.profile.verified && (
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                            </svg>
                          )}
                          <a
                            href={`https://x.com/${match.profile.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-white/30 hover:text-white/50 transition-colors"
                          >
                            @{match.profile.username}
                          </a>
                        </div>
                        <p className="text-sm text-white/40 truncate">{match.profile.description || 'No bio'}</p>
                      </div>

                      {/* Followers */}
                      <div className="text-right mr-4">
                        <div className="text-sm text-white/60">{formatFollowers(match.profile.follower_count)}</div>
                        <div className="text-xs text-white/30">followers</div>
                      </div>

                      {/* Mini Metrics Preview */}
                      {/* <div className="flex items-center gap-3 mr-4">
                        {(() => {
                          const cost = estimateCost(match.profile.follower_count, match.score);
                          return (
                            <div className="text-right">
                              <div className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Cost</div>
                              <div className="text-sm text-white/60 font-medium">{formatCost(cost.min)}-{formatCost(cost.max)}</div>
                            </div>
                          );
                        })()}
                      </div> */}

                      {/* Score */}
                      <div className={`px-3 py-2 rounded-lg bg-gradient-to-r border flex items-center h-[38px] ${getScoreStyle(match.score)}`}>
                        <span className="text-sm font-medium">{((match.score || 0) * 100).toFixed(0)}%</span>
                      </div>

                      {/* Predict button */}
                      <button
                        onClick={(e) => handlePredictPerformance(e, match)}
                        disabled={loadingPrediction === match.profile.username}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:from-cyan-500/30 hover:to-cyan-500/10 transition-all disabled:opacity-50 flex items-center gap-1.5 h-[38px]"
                      >
                        {loadingPrediction === match.profile.username ? (
                          <GrokLoader size="small" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                        {loadingPrediction === match.profile.username ? 'Thinking...' : 'Predict'}
                      </button>

                      {/* Why button */}
                      <button
                        onClick={(e) => handleExplainMatch(e, match)}
                        disabled={loadingExplanation === match.profile.username}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-500/5 border border-purple-500/20 text-purple-400 text-xs font-medium hover:from-purple-500/30 hover:to-purple-500/10 transition-all disabled:opacity-50 flex items-center gap-1.5 h-[38px]"
                      >
                        {loadingExplanation === match.profile.username ? (
                          <GrokLoader size="small" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                        {loadingExplanation === match.profile.username ? 'Thinking...' : 'Why?'}
                      </button>

                      {/* Arrow */}
                      {searcherType === 'brand' && (
                        <svg className="w-5 h-5 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>

                    {/* AI Explanation */}
                    {explanations[match.profile.username] && expandedExplanation === match.profile.username && (
                      <div className="mt-4 pt-4 border-t border-white/[0.04]">
                        <div className="flex items-start gap-2">
                          <div className="shrink-0 w-5 h-5 rounded bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-purple-400/60 mb-2">Grok Analysis</div>
                            <div className="text-sm text-white/60 leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-2 prose-strong:text-white/80 prose-ol:my-2 prose-li:my-0.5">
                              <ReactMarkdown>{explanations[match.profile.username]}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Performance Predictions */}
                    {predictions[match.profile.username] && expandedPrediction === match.profile.username && (
                      <div className="mt-4 pt-4 border-t border-white/[0.04]">
                        <div className="flex items-start gap-2">
                          <div className="shrink-0 w-5 h-5 rounded bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-cyan-400/60 mb-2">Performance Prediction</div>
                            <div className="text-sm text-white/60 leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-2 prose-strong:text-white/80 prose-ol:my-2 prose-li:my-0.5 prose-ul:my-2">
                              <ReactMarkdown>{predictions[match.profile.username]}</ReactMarkdown>
                            </div>
                            {/* Cost Breakdown */}
                            <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Estimated Campaign Cost</div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-light text-white">
                                  {formatCost(estimateCost(match.profile.follower_count, match.score).min)}
                                </span>
                                <span className="text-white/30">-</span>
                                <span className="text-2xl font-light text-white">
                                  {formatCost(estimateCost(match.profile.follower_count, match.score).max)}
                                </span>
                                <span className="text-xs text-white/30 ml-2">per post</span>
                              </div>
                              <div className="mt-2 text-xs text-white/40">
                                Based on {formatFollowers(match.profile.follower_count)} followers × $20/1K (industry avg) × {((match.score || 0) * 100).toFixed(0)}% match quality
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expandable tweets + Campaign brief button */}
                    {match.profile.sample_tweets && match.profile.sample_tweets.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const username = match.profile.username;
                            setExpandedCard(prev => prev === username ? null : username);
                          }}
                          className="text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1"
                        >
                          {expandedCard === match.profile.username ? 'Hide' : 'View'} sample tweets
                          <svg className={`w-3 h-3 transition-transform ${expandedCard === match.profile.username ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {selectedCreator === match.profile.username && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleGenerateBrief(e, match.profile)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:from-blue-500/30 hover:to-cyan-500/20 transition-all flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Campaign Brief
                            </button>
                            <button
                              onClick={(e) => handleGenerateOutreach(e, match.profile, match.score)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:from-green-500/30 hover:to-emerald-500/20 transition-all flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Reach Out
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {expandedCard === match.profile.username && match.profile.sample_tweets && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-3.5 h-3.5 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          <span className="text-[10px] uppercase tracking-wider text-white/30">Recent Posts</span>
                        </div>
                        {match.profile.sample_tweets.slice(0, 3).map((tweet, i) => (
                          <div key={i} className="group/tweet relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 transition-all">
                            <div className="flex gap-3">
                              {match.profile.profile_image_url && (
                                <img
                                  src={match.profile.profile_image_url}
                                  alt=""
                                  className="w-8 h-8 rounded-full shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs font-medium text-white/70">{match.profile.name}</span>
                                  <span className="text-xs text-white/30">@{match.profile.username}</span>
                                </div>
                                <p className="text-sm text-white/50 leading-relaxed">{tweet}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}

          {/* Drill-down */}
          {selectedCreator && (
            <div className="mt-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4">
                Tweets from @{selectedCreator} matching @{username}
              </h3>
              {loadingTweets ? (
                <div className="flex items-center gap-2 text-white/40">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  Loading...
                </div>
              ) : creatorTweets.length > 0 ? (
                <div className="space-y-4">
                  {creatorTweets.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`shrink-0 px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${getScoreStyle(item.score)}`}>
                        {((item.score || 0) * 100).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-white/60 text-sm leading-relaxed">{item.tweet.text}</p>
                        <p className="text-xs text-white/30 mt-1">{item.tweet.likes?.toLocaleString() || 0} likes</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40">No matching tweets found</p>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && matches.length === 0 && !statusMessage && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Find your match</h3>
              <p className="text-white/40 max-w-sm mx-auto mb-4">
                Enter a username to discover profiles with similar content style
              </p>
              <p className="text-sm text-white/20">
                Try: Nike, WHOOP, Topicals, elonmusk, MKBHD
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Campaign Brief Modal */}
      {showBriefModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-white">Campaign Brief</h2>
                <p className="text-sm text-white/40 mt-1">
                  {queryProfile?.name} × {briefCreator?.name}
                </p>
              </div>
              <button
                onClick={() => setShowBriefModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
              {loadingBrief ? (
                <GrokLoader />
              ) : campaignBrief ? (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-medium prose-h1:text-xl prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-p:text-white/70 prose-p:my-2 prose-strong:text-white/90 prose-ul:my-2 prose-ol:my-2 prose-li:text-white/70 prose-li:my-1">
                  <ReactMarkdown>{campaignBrief}</ReactMarkdown>
                </div>
              ) : null}
            </div>
            {!loadingBrief && campaignBrief && (
              <div className="p-4 border-t border-white/[0.06] flex justify-end gap-3">
                <button
                  onClick={() => setShowBriefModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(campaignBrief);
                  }}
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Brief
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outreach DM Modal */}
      {showOutreachModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {outreachCreator?.profile_image_url && (
                  <img
                    src={outreachCreator.profile_image_url.replace('_normal', '_bigger')}
                    alt={outreachCreator.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h2 className="text-lg font-medium text-white">Reach Out to @{outreachCreator?.username}</h2>
                  <p className="text-sm text-white/40">Personalized DM message</p>
                </div>
              </div>
              <button
                onClick={() => setShowOutreachModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {loadingOutreach ? (
                <div className="py-8">
                  <GrokLoader />
                </div>
              ) : outreachMessage ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                      {outreachMessage}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-xs text-white/30">{outreachMessage.length} chars</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 text-center">
                    Copy this message and send it via X DM
                  </p>
                </div>
              ) : null}
            </div>
            {!loadingOutreach && outreachMessage && (
              <div className="p-4 border-t border-white/[0.06] flex justify-end gap-3">
                <button
                  onClick={() => setShowOutreachModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(outreachMessage);
                    setCopiedOutreach(true);
                    setTimeout(() => setCopiedOutreach(false), 2000);
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
                >
                  {copiedOutreach ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Copy Message
                    </>
                  )}
                </button>
                <a
                  href={`https://x.com/messages/compose?recipient_id=${outreachCreator?.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    navigator.clipboard.writeText(outreachMessage);
                  }}
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Open DM on X
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#050505]">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 lg:p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-white/10 border-t-white/60 rounded-full mx-auto mb-4"></div>
            <p className="text-white/40">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <MatchContent />
    </Suspense>
  );
}
