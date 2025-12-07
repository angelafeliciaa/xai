'use client';

import { useState, useEffect, useRef } from 'react';

const loadingMessages = [
  "Analyzing content patterns...",
  "Evaluating audience alignment...",
  "Crunching engagement data...",
  "Cross-referencing brand values...",
  "Calculating partnership potential...",
  "Synthesizing insights...",
  "Almost there...",
];

export default function GrokLoader({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dotsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messageIntervalRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    dotsIntervalRef.current = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);

    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
    };
  }, []);

  const dots = '.'.repeat(dotCount);

  if (size === 'small') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-spin" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-[2px] rounded-full bg-[#0a0a0a]" />
          <div className="absolute inset-[3px] rounded-full bg-gradient-to-r from-purple-500/50 to-cyan-500/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[220px]">
      {/* Main animated orb */}
      <div className="relative w-16 h-16 mb-4">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />

        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full rounded-full bg-gradient-conic p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0a0a0a]" />
          </div>
        </div>

        {/* Inner pulsing core */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 animate-pulse" />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      {/* Animated text */}
      <div className="text-center h-[52px] flex flex-col justify-center">
        <div className="flex items-center justify-center mb-1">
          <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Grok is thinking
          </span>
          <span className="text-purple-400 w-[18px] text-left font-mono">{dots || '\u00A0'}</span>
        </div>
        <p className="text-xs text-white/40 h-4">
          {loadingMessages[messageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-40 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-grok-progress" />
      </div>
    </div>
  );
}
