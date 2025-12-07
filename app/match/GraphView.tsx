'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

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

interface GraphViewProps {
  queryProfile: ProfileMetadata;
  matches: MatchResult[];
  onCreatorClick: (username: string) => void;
}

interface GraphNode {
  id: string;
  name: string;
  username: string;
  score: number;
  followers: number;
  type: 'query' | 'match';
  imageUrl?: string;
  verified?: boolean;
  description?: string;
  x?: number;
  y?: number;
  z?: number; // 3D depth
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

export default function GraphView({ queryProfile, matches, onCreatorClick }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);

  // 3D to 2D projection with perspective
  const project3D = (x: number, y: number, z: number, centerX: number, centerY: number) => {
    const perspective = 600;
    const scale = perspective / (perspective + z);
    return {
      x: centerX + (x - centerX) * scale,
      y: centerY + (y - centerY) * scale,
      scale: scale,
    };
  };

  // Rotate point in 3D space
  const rotate3D = (x: number, y: number, z: number, rotX: number, rotY: number) => {
    // Rotate around Y axis
    let newX = x * Math.cos(rotY) - z * Math.sin(rotY);
    let newZ = x * Math.sin(rotY) + z * Math.cos(rotY);
    
    // Rotate around X axis
    let newY = y * Math.cos(rotX) - newZ * Math.sin(rotX);
    newZ = y * Math.sin(rotX) + newZ * Math.cos(rotX);
    
    return { x: newX, y: newY, z: newZ };
  };

  useEffect(() => {
    const updateDimensions = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(700, container.clientHeight),
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || matches.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create nodes
    const nodes: GraphNode[] = [
      {
        id: `query_${queryProfile.username}`,
        name: queryProfile.name,
        username: queryProfile.username,
        score: 1,
        followers: queryProfile.follower_count,
        type: 'query',
        imageUrl: queryProfile.profile_image_url,
        verified: queryProfile.verified,
        description: queryProfile.description,
      },
      ...matches.map((match) => ({
        id: `match_${match.profile.username}`,
        name: match.profile.name,
        username: match.profile.username,
        score: match.score,
        followers: match.profile.follower_count,
        type: 'match' as const,
        imageUrl: match.profile.profile_image_url,
        verified: match.profile.verified,
        description: match.profile.description,
      })),
    ];

    // Create minimal connections
    const links: GraphLink[] = [];
    
    // Connect query to all matches
    matches.forEach((match) => {
      links.push({
        source: `query_${queryProfile.username}`,
        target: `match_${match.profile.username}`,
        value: match.score,
      });
    });
    
    // Only connect very similar creators to each other (minimal connections)
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const match1 = matches[i];
        const match2 = matches[j];
        
        // Only connect creators with very similar scores (tight clusters)
        const scoreDiff = Math.abs(match1.score - match2.score);
        
        // Only create edge if scores are very close AND both are high quality
        if (scoreDiff < 0.05 && match1.score > 0.52 && match2.score > 0.52) {
          links.push({
            source: `match_${match1.profile.username}`,
            target: `match_${match2.profile.username}`,
            value: 1 - scoreDiff,
          });
        }
      }
    }

    // Position nodes in 3D space
    nodes.forEach((node, i) => {
      if (node.type === 'query') {
        // Brand at center in 3D space
        node.x = 0;
        node.y = 0;
        node.z = 0;
      } else {
        // Position in 3D based on score
        const matchIndex = i - 1;
        const totalMatches = matches.length;
        
        // Distance from center inversely proportional to score
        const minDistance = 150;
        const maxDistance = 400;
        const distance = minDistance + (1 - node.score) * (maxDistance - minDistance);
        
        // Distribute in 3D sphere
        // Theta: horizontal angle
        const theta = (matchIndex / totalMatches) * 2 * Math.PI + Math.sin(matchIndex * 7) * 1.5;
        
        // Phi: vertical angle (more spread in 3D)
        const phi = (Math.sin(matchIndex * 5) * 0.5 + 0.5) * Math.PI;
        
        // Convert spherical to Cartesian coordinates
        node.x = distance * Math.sin(phi) * Math.cos(theta);
        node.y = distance * Math.sin(phi) * Math.sin(theta);
        node.z = distance * Math.cos(phi);
      }
    });

    // Apply 3D rotation and project to 2D
    nodes.forEach((node) => {
      const rotated = rotate3D(node.x!, node.y!, node.z!, rotationX, rotationY);
      const projected = project3D(rotated.x, rotated.y, rotated.z, centerX, centerY);
      
      node.x = projected.x;
      node.y = projected.y;
      node.z = rotated.z; // Keep z for depth sorting
      node.fx = projected.x;
      node.fy = projected.y;
    });

    // Sort nodes by Z-depth (back to front for proper rendering)
    nodes.sort((a, b) => (a.z || 0) - (b.z || 0));

    // No simulation - just render at fixed positions
    const simulation = d3
      .forceSimulation(nodes)
      .alpha(0)
      .stop();

    // Create container with zoom
    const g = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create links - minimal and subtle
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) => {
        const isCreatorLink = !d.source.toString().includes('query') && !d.target.toString().includes('query');
        return isCreatorLink ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.1)';
      })
      .attr('stroke-width', (d: any) => {
        const isCreatorLink = !d.source.toString().includes('query') && !d.target.toString().includes('query');
        return isCreatorLink ? 0.5 : 1;
      });

    // Create node groups
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', (d) => (d.type === 'match' ? 'pointer' : 'default'));

    // Add circles for nodes - with 3D depth effect
    node
      .append('circle')
      .attr('r', (d) => {
        const baseSize = d.type === 'query' ? 40 : Math.min(Math.max(Math.log10(d.followers + 1) * 3, 25), 35);
        // Scale based on depth
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return baseSize * scale;
      })
      .attr('fill', (d) => {
        if (d.type === 'query') return 'url(#query-gradient)';
        // Opacity based on depth - closer = more visible
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        const opacity = Math.max(0.05, Math.min(0.15, 0.12 * scale));
        
        const score = d.score;
        if (score >= 0.55) return `rgba(255, 255, 255, ${opacity + 0.03})`;
        if (score >= 0.5) return `rgba(255, 255, 255, ${opacity})`;
        return `rgba(255, 255, 255, ${opacity - 0.03})`;
      })
      .attr('stroke', (d) => {
        if (d.type === 'query') return 'none';
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        const opacity = Math.max(0.05, Math.min(0.2, 0.15 * scale));
        return `rgba(255, 255, 255, ${opacity})`;
      })
      .attr('stroke-width', 1);

    // Add images
    node
      .append('clipPath')
      .attr('id', (d) => `clip-${d.id}`)
      .append('circle')
      .attr('r', (d) => {
        if (d.type === 'query') return 36;
        const followerSize = Math.log10(d.followers + 1) * 3;
        return Math.min(Math.max(followerSize, 21), 31);
      });

    node
      .filter((d) => d.imageUrl)
      .append('image')
      .attr('xlink:href', (d) => d.imageUrl!.replace('_normal', '_bigger'))
      .attr('x', (d) => {
        const r = d.type === 'query' ? 36 : Math.min(Math.max(Math.log10(d.followers + 1) * 3, 21), 31);
        return -r;
      })
      .attr('y', (d) => {
        const r = d.type === 'query' ? 36 : Math.min(Math.max(Math.log10(d.followers + 1) * 3, 21), 31);
        return -r;
      })
      .attr('width', (d) => {
        const r = d.type === 'query' ? 36 : Math.min(Math.max(Math.log10(d.followers + 1) * 3, 21), 31);
        return r * 2;
      })
      .attr('height', (d) => {
        const r = d.type === 'query' ? 36 : Math.min(Math.max(Math.log10(d.followers + 1) * 3, 21), 31);
        return r * 2;
      })
      .attr('clip-path', (d) => `url(#clip-${d.id})`);

    // Add labels with depth scaling
    node
      .append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return (d.type === 'query' ? 55 : 45) * scale;
      })
      .attr('fill', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        const opacity = Math.max(0.3, Math.min(1, scale));
        return `rgba(255, 255, 255, ${opacity})`;
      })
      .attr('font-size', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        const baseSize = d.type === 'query' ? 14 : 12;
        return `${baseSize * scale}px`;
      })
      .attr('font-weight', (d) => (d.type === 'query' ? '600' : '500'))
      .style('pointer-events', 'none');

    // Add score badges for matches - with depth scaling
    node
      .filter((d) => d.type === 'match')
      .append('circle')
      .attr('cx', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return 20 * scale;
      })
      .attr('cy', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return -20 * scale;
      })
      .attr('r', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return 11 * scale;
      })
      .attr('fill', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1);

    node
      .filter((d) => d.type === 'match')
      .append('text')
      .text((d) => ((d.score || 0) * 100).toFixed(0))
      .attr('x', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return 20 * scale;
      })
      .attr('y', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return -17 * scale;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', (d) => {
        const perspective = 600;
        const scale = perspective / (perspective + (d.z || 0));
        return `${9 * scale}px`;
      })
      .attr('font-weight', '600')
      .style('pointer-events', 'none');

    // Add verified badges
    node
      .filter((d) => d.verified)
      .append('circle')
      .attr('cx', (d) => (d.type === 'query' ? 28 : 22))
      .attr('cy', (d) => (d.type === 'query' ? 28 : 22))
      .attr('r', 8)
      .attr('fill', 'rgb(29, 155, 240)');

    node
      .filter((d) => d.verified)
      .append('text')
      .text('✓')
      .attr('x', (d) => (d.type === 'query' ? 28 : 22))
      .attr('y', (d) => (d.type === 'query' ? 32 : 26))
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .style('pointer-events', 'none');

    // Event handlers
    node
      .on('mouseenter', function (event, d) {
        setHoveredNode(d);
        d3.select(this).select('circle').attr('stroke-width', 4);
      })
      .on('mouseleave', function () {
        setHoveredNode(null);
        d3.select(this).select('circle').attr('stroke-width', 2);
      })
      .on('click', (event, d) => {
        if (d.type === 'match') {
          onCreatorClick(d.username);
        }
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Define gradients - minimalistic (blue accent only)
    const defs = svg.append('defs');

    const queryGradient = defs
      .append('radialGradient')
      .attr('id', 'query-gradient');
    queryGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(59, 130, 246)');
    queryGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(37, 99, 235)');

    return () => {
      simulation.stop();
    };
  }, [queryProfile, matches, dimensions, onCreatorClick, rotationX, rotationY]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-2xl bg-[#080808] border border-white/[0.08]"
      />

      {/* Legend - minimalistic */}
      <div className="absolute top-4 left-4 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs">
        <div className="text-white/50 text-[10px] mb-2 leading-relaxed">
          Similar creators cluster together<br/>
          Distance ≈ Vector similarity
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-white/40 text-[10px]">Your Profile</span>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/[0.08] rounded-xl px-4 py-2 text-xs text-white/40">
        Scroll to zoom • Click creator to generate captions
      </div>

      {/* 3D Rotation Controls */}
      <div className="absolute bottom-4 right-4 bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/[0.08] rounded-lg p-2">
        <div className="text-[9px] text-white/30 mb-2 text-center font-medium">3D ROTATION</div>
        <div className="flex flex-col gap-2">
          {/* Horizontal rotation */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setRotationY(r => r - Math.PI / 8)}
              className="w-8 h-8 border border-white/[0.08] rounded flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-all"
              title="Rotate left"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-[9px] text-white/30 w-8 text-center">Y</span>
            <button
              onClick={() => setRotationY(r => r + Math.PI / 8)}
              className="w-8 h-8 border border-white/[0.08] rounded flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-all"
              title="Rotate right"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Vertical rotation */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setRotationX(r => r - Math.PI / 8)}
              className="w-8 h-8 border border-white/[0.08] rounded flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-all"
              title="Rotate up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-[9px] text-white/30 w-8 text-center">X</span>
            <button
              onClick={() => setRotationX(r => r + Math.PI / 8)}
              className="w-8 h-8 border border-white/[0.08] rounded flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-all"
              title="Rotate down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => { setRotationX(0); setRotationY(0); }}
            className="mt-1 px-3 py-1.5 border border-white/[0.08] rounded text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-all text-[9px] font-medium"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Hover card */}
      {hoveredNode && hoveredNode.type === 'match' && (
        <div className="absolute top-4 right-4 bg-[#0a0a0a]/95 backdrop-blur-sm border border-white/[0.12] rounded-xl p-4 max-w-xs">
          <div className="flex items-start gap-3">
            {hoveredNode.imageUrl && (
              <img
                src={hoveredNode.imageUrl.replace('_normal', '_bigger')}
                alt={hoveredNode.name}
                className="w-12 h-12 rounded-full flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white">{hoveredNode.name}</span>
                {hoveredNode.verified && (
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-white/40 mb-2">@{hoveredNode.username}</div>
              <div className="text-xs text-white/50 mb-3 line-clamp-2">
                {hoveredNode.description || 'No bio'}
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="text-white/40">
                  {formatFollowers(hoveredNode.followers)} followers
                </div>
                <div className="px-2 py-1 rounded-md bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 font-medium">
                  {((hoveredNode.score || 0) * 100).toFixed(0)}% match
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
