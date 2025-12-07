"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Text } from "@react-three/drei";
import * as THREE from "three";

type ProfileCard = {
  id: string;
  name: string;
  username: string;
  description?: string;
  followerCount: number;
  profileImageUrl?: string;
  score: number;
  engagement: number;
};

type Match3DGalleryProps = {
  matches: {
    score: number;
    profile: {
      username: string;
      name: string;
      description?: string;
      follower_count: number;
      profile_image_url?: string;
      sample_tweets?: string[];
    };
  }[];
  onExit?: () => void;
};

type CardInstance = ProfileCard & {
  position: [number, number, number];
  radius: number;
};

const WORLD_BOUNDS = {
  minX: -40,
  maxX: 40,
  minY: -10,
  maxY: 15,
  minZ: -60,
  maxZ: 50,
};

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 2.5, 12);

const Axes = () => {
  const axisLength = 5;
  // const { scene } = useThree(); // Access the scene object from the React Three Fiber context

  return (
    <>
    {/* X Axis */}
    <Line
      points={[[-axisLength, 0, -8], [axisLength, 0, -8]]}
      color="red"
      lineWidth={2}
    />
    {/* Y Axis */}
    <Line
      points={[[0, -axisLength, -8], [0, axisLength, -8]]}
      color="blue"
      lineWidth={2}
    />
    {/* Z Axis */}
    <Line
      points={[[0, 0, -8-axisLength], [0, 0, axisLength -8]]}
      color="green"
      lineWidth={2}
    />
    </>
  )
};

function FirstPersonControls({
  cards,
  paused,
}: {
  cards: CardInstance[];
  paused: boolean;
}) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    camera.position.copy(INITIAL_CAMERA_POSITION);
    camera.lookAt(0, 2, 0);
  }, [camera]);

  useEffect(() => {
    // Mouse look (click + drag on canvas)
    const handlePointerDown = (e: PointerEvent) => {
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = "grabbing";
    };

    const handlePointerUp = () => {
      dragging.current = false;
      gl.domElement.style.cursor = "grab";
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      const lookSpeed = 0.012; // Increased from 0.005 for higher sensitivity
      yaw.current -= dx * lookSpeed;
      pitch.current -= dy * lookSpeed;
      // Very loose pitch clamp for smoother movement
      pitch.current = THREE.MathUtils.clamp(pitch.current, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    };

    // Scroll to move forward/backward
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const amount = -e.deltaY * 0.015; // Increased from 0.008 for faster movement
      scrollRef.current += amount;
    };

    const canvas = gl.domElement;
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (paused) return;

    // Apply look
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    const speed = 10; // Increased from 7 for faster movement
    const dir = new THREE.Vector3();

    // get camera forward vector (full 3D, including vertical)
    camera.getWorldDirection(dir);
    const forwardVec = dir.clone().normalize();

    const move = new THREE.Vector3();

    // Scroll-based forward/back along view direction
    if (Math.abs(scrollRef.current) > 0.0001) {
      move.add(forwardVec.clone().multiplyScalar(scrollRef.current));
      scrollRef.current *= 0.75;
    }

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
    }

    // simple smoothing - increased for more responsive controls
    velocity.current.lerp(move, 0.35);

    const nextPosition = camera.position.clone().add(velocity.current);

    // world bounds
    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    nextPosition.y = THREE.MathUtils.clamp(nextPosition.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

    // collision with cards (very soft, just to avoid exact overlap)
    const minDistance = 0.15; // Reduced from 0.3 to allow closer approach
    let blocked = false;
    for (const card of cards) {
      const center = new THREE.Vector3(...card.position);
      const dist = nextPosition.distanceTo(center);
      if (dist < minDistance + card.radius) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      camera.position.copy(nextPosition);
    }
  });

  return null;
}

function CardMesh({
  card,
  onHover,
  onUnhover,
  setActiveId,
}: {
  card: CardInstance;
  onHover: (id: string) => void;
  onUnhover: () => void;
  setActiveId: (id: string | null) => void;
}) {
  const { position } = card;
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    // check proximity for activating detail
    const dist = camera.position.distanceTo(ref.current.position);
    if (dist < 4) {
      setActiveId(card.id);
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(card.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onUnhover();
      }}
    >
      {/* Pure UI card, no 3D geometry */}
      <Html
        position={[0, 0, 0]}
        transform
        distanceFactor={1.6}
        zIndexRange={[0, 0]}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`w-56 rounded-2xl border px-3 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition-all`}
          style={{
            backgroundColor: cardColor,
            borderColor: hovered ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.05)",
          }}    
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-full bg-black/5 flex items-center justify-center text-[11px] font-medium text-black/50 overflow-hidden">
              {card.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.profileImageUrl.replace("_normal", "_bigger")}
                  alt={card.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{card.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-black/80 truncate">{card.name}</p>
              <p className="text-[10px] text-black/40 truncate">@{card.username}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 text-black/50 mb-0.5">
                {(card.score * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-black/40">
                {card.followerCount >= 1000000
                  ? `${(card.followerCount / 1000000).toFixed(1)}M`
                  : card.followerCount >= 1000
                  ? `${(card.followerCount / 1000).toFixed(1)}K`
                  : card.followerCount}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-black/55 line-clamp-2 leading-snug">
            {card.description || "No bio available."}
          </p>
        </div>
      </Html>
    </group>
  );
}

function SimpleProfile({
  card,
  onHover,
  onUnhover,
  setActiveId,
}: {
  card: CardInstance;
  onHover: (id: string) => void;
  onUnhover: () => void;
  setActiveId: (id: string | null) => void;
}) {
  const { position } = card;
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    // check proximity for activating detail
    const dist = camera.position.distanceTo(ref.current.position);
    if (dist < 4) {
      setActiveId(card.id);
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(card.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onUnhover();
      }}
      onClick={(e) => {
        setActiveId(card.id)
      }}
    >
      <Html
        position={[0, 0, 0]}
        transform
        distanceFactor={1.6}
        zIndexRange={[0, 0]}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`w-50 rounded-2xl border px-3 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition-all ${
            hovered
              ? "bg-[#fff7ea]/100 border-black/10"
              : "bg-[#fdf2e1]/95 border-black/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-full bg-black/5 flex items-center justify-center text-[11px] font-medium text-black/50 overflow-hidden">
              {card.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.profileImageUrl.replace("_normal", "_bigger")}
                  alt={card.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{card.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-black/80 truncate">{card.name}</p>
              <p className="text-[10px] text-black/40 truncate">@{card.username}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 text-black/50 mb-0.5">
                {(card.score * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-black/40">
                {card.followerCount >= 1000000
                  ? `${(card.followerCount / 1000000).toFixed(1)}M`
                  : card.followerCount >= 1000
                  ? `${(card.followerCount / 1000).toFixed(1)}K`
                  : card.followerCount}
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function GalleryScene({
  cards,
  paused,
  setHoveredId,
  setActiveId,
}: {
  cards: CardInstance[];
  paused: boolean;
  setHoveredId: (id: string | null) => void;
  setActiveId: (id: string | null) => void;
}) {
  return (
    <>
      {/* Soft beige ambient world */}
      <color attach="background" args={["#f6efe4"]} />
      <fog attach="fog" args={["#f6efe4", 30, 100]} />

      <ambientLight intensity={0.7} color="#f6e5cc" />
      <directionalLight position={[8, 12, 6]} intensity={0.9} color="#ffffff" />
      <hemisphereLight args={["#fff3d8", "#e8ddcf", 0.6]} />

      {/* Cards */}
      {cards.map((card) => (
        <SimpleProfile
          key={card.id}
          card={card}
          onHover={(id) => setHoveredId(id)}
          onUnhover={() => setHoveredId(null)}
          setActiveId={setActiveId}
        />
      ))}

      <FirstPersonControls cards={cards} paused={paused} />
    </>
  );
}

export default function Match3DGallery({ matches, onExit }: Match3DGalleryProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const cards: CardInstance[] = useMemo(() => {
    if (matches.length === 0) return [];

    // Sort so right side of the arc tends to be larger accounts
    const sorted = [...matches].sort(
      (a, b) => (a.profile.follower_count ?? 0) - (b.profile.follower_count ?? 0)
    );

    const followerVals = sorted.map((m) =>
      Math.log10((m.profile.follower_count ?? 0) + 1)
    );
    const engagementVals = sorted.map(
      (m) => m.profile.sample_tweets?.length ?? 0
    );
    const scoreVals = sorted.map((m) => m.score);

    const min = (arr: number[]) => Math.min(...arr);
    const max = (arr: number[]) => Math.max(...arr);

    const minFollowers = min(followerVals);
    const maxFollowers = max(followerVals);
    const minEng = min(engagementVals);
    const maxEng = max(engagementVals);
    const minScore = min(scoreVals);
    const maxScore = max(scoreVals);

    const norm = (value: number, minVal: number, maxVal: number) => {
      if (maxVal === minVal) return 0.5;
      return (value - minVal) / (maxVal - minVal);
    };

    const n = sorted.length;
    const ringRadius = 6; // wider donut radius for better spacing
    const ringCenterZ = -8; // further from camera

    return sorted.map((m, index) => {
      const followerLog = Math.log10((m.profile.follower_count ?? 0) + 1);
      const engagement = m.profile.sample_tweets?.length ?? 0;
      const score = m.score ?? 0;

      const nf = norm(followerLog, minFollowers, maxFollowers);
      const ne = norm(engagement, minEng, maxEng);
      const ns = norm(score, minScore, maxScore);

      // Create a full donut/ring shape - distribute evenly in a circle
      const angle = (index / n) * Math.PI * 2; // full 360 degrees
      
      // Base ring position with better spacing
      const x = Math.sin(angle) * ringRadius;
      const z = ringCenterZ + Math.cos(angle) * ringRadius * 0.5; // more Z spread
      
      // Y = engagement (vertical position)
      const y = (ne - 0.5) * 3.5;
      
      // Brand fit pulls slightly closer/further
      const zNudge = (ns - 0.5) * 1.0;
      
      // Radial offset based on followers (bigger = further out)
      const radiusNudge = (nf - 0.5) * 1.2;

      // Better jitter to prevent z-fighting and overlap
      const jitterX = Math.sin(index * 12.9898) * 0.3;
      const jitterY = Math.cos(index * 78.233) * 0.3;
      const jitterZ = Math.sin(index * 45.123) * 0.5; // More Z separation

      const finalX = x * (1 + radiusNudge / ringRadius) + jitterX;
      const finalZ = (z - ringCenterZ) * (1 + radiusNudge / (ringRadius * 0.5)) + ringCenterZ + zNudge + jitterZ;

      return {
        id: m.profile.username,
        name: m.profile.name,
        username: m.profile.username,
        description: m.profile.description,
        followerCount: m.profile.follower_count,
        profileImageUrl: m.profile.profile_image_url,
        score: m.score,
        engagement,
        position: [finalX, y + jitterY, finalZ] as [number, number, number],
        radius: 0.6,
      };
    });
  }, [matches]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const currentCard = useMemo(
    () => cards.find((c) => c.id === (activeId || hoveredId)),
    [cards, activeId, hoveredId]
  );

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-3xl overflow-hidden bg-[#f6efe4] shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
      {/* Top-left UI controls */}
      <div className="pointer-events-none absolute left-6 top-6 z-40 flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 backdrop-blur-md pointer-events-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
          <span className="uppercase tracking-[0.16em] text-[10px] text-black/50 font-medium">
            3D MATCH SPACE
          </span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setShowIntro(true);
              setPaused(false);
            }}
            className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-black/70 shadow-sm hover:bg-white transition-colors"
          >
            Reset
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="ml-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white/90 hover:bg-black/90 transition-colors"
            >
              Back to list
            </button>
          )}
        </div>
      </div>

      {/* Axis legend (top-right) */}
      <div className="pointer-events-none absolute right-6 top-6 z-40">
        <div className="pointer-events-auto rounded-2xl bg-white/85 px-5 py-4 border border-black/5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] uppercase text-black/40">
            3D Axis Guide
          </p>
          <div className="flex items-start gap-4">
            {/* 3D Axis Diagram */}
            <svg width="80" height="90" viewBox="0 0 80 90" className="shrink-0">
              <defs>
                <marker id="arrowZ" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#000000" fillOpacity="0.6" />
                </marker>
                <marker id="arrowX" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#000000" fillOpacity="0.6" />
                </marker>
                <marker id="arrowY" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#000000" fillOpacity="0.6" />
                </marker>
              </defs>
              
              {/* Z axis (diagonal left-down) */}
              <line x1="40" y1="60" x2="12" y2="78" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.6" markerEnd="url(#arrowZ)" />
              <text x="1" y="82" fontSize="9" fontWeight="500" fill="#000000" fillOpacity="0.7">Z</text>
              
              {/* X axis (right) */}
              <line x1="40" y1="60" x2="68" y2="60" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.6" markerEnd="url(#arrowX)" />
              <text x="73" y="63" fontSize="9" fontWeight="500" fill="#000000" fillOpacity="0.7">X</text>
              
              {/* Y axis (up) */}
              <line x1="40" y1="60" x2="40" y2="28" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.6" markerEnd="url(#arrowY)" />
              <text x="37" y="22" fontSize="9" fontWeight="500" fill="#000000" fillOpacity="0.7">Y</text>
              
              {/* Origin point */}
              <circle cx="40" cy="60" r="2" fill="#000000" fillOpacity="0.6" />
            </svg>
            
            {/* Labels */}
            <div className="space-y-2.5">
              <p className="text-xs text-black/70">
                <span className="font-semibold">X · Followers</span>
                <br />
                <span className="text-black/45">larger audience →</span>
              </p>
              <p className="text-xs text-black/70">
                <span className="font-semibold">Y · Engagement</span>
                <br />
                <span className="text-black/45">more active ↑</span>
              </p>
              <p className="text-xs text-black/70">
                <span className="font-semibold">Z · Brand fit</span>
                <br />
                <span className="text-black/45">closer = better</span>
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Pause overlay */}
      {paused && !showIntro && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-xs rounded-3xl bg-[#0c0c0c] border border-white/10 px-6 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">
              Paused
            </p>
            <p className="text-sm text-white/80 mb-4">
              Movement is frozen. Press ESC again or click resume to continue exploring.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPaused(false)}
                className="flex-1 rounded-full bg-white text-xs font-medium text-black py-2.5 hover:bg-white/90"
              >
                Resume
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  className="flex-1 rounded-full bg-white/5 text-xs font-medium text-white/80 py-2.5 hover:bg-white/10"
                >
                  Back to list
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Intro overlay (always on top) */}
      {showIntro && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#f6efe4] to-[#f1e3cf]">
          <div className="w-full max-w-md rounded-3xl bg-white/70 border border-black/5 px-8 py-7 shadow-[0_40px_110px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-black/40 mb-4">
              Welcome to the space
            </p>
            <h2 className="text-xl font-semibold text-black mb-3">
              Navigate your matches in 3D
            </h2>
            <p className="text-sm text-black/65 mb-4">
              Navigate a 3D space where X = followers, Y = engagement, Z = brand alignment.
            </p>
            <div className="mt-2 mb-5 grid grid-cols-2 gap-3 text-[11px] text-black/70">
              <div className="rounded-2xl bg-black/4 px-3 py-2">
                <p className="font-semibold mb-1">Move</p>
                <p>Scroll to move forward / back</p>
              </div>
              <div className="rounded-2xl bg-black/4 px-3 py-2">
                <p className="font-semibold mb-1">Look around</p>
                <p>Click & drag to look around</p>
              </div>
              <div className="rounded-2xl bg-black/4 px-3 py-2">
                <p className="font-semibold mb-1">Pause</p>
                <p>ESC to pause / resume</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowIntro(false);
                setPaused(false);
              }}
              className="mt-1 w-full rounded-full bg-black text-white text-sm font-medium py-3.5 hover:bg-black/90"
            >
              Click to start
            </button>
          </div>
        </div>
      )}

      <Canvas
        id="match-3d-canvas"
        camera={{ position: INITIAL_CAMERA_POSITION.toArray(), fov: 60, near: 0.01, far: 200 }}
        shadows
        gl={{ logarithmicDepthBuffer: true }}
      >
        <GalleryScene
          cards={cards}
          paused={paused || showIntro}
          setHoveredId={setHoveredId}
          setActiveId={setActiveId}
        />
        <Axes />
      </Canvas>
    </div>
  );
}
