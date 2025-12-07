"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
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
  minX: -16,
  maxX: 16,
  minY: -4,
  maxY: 8,
  minZ: -40,
  maxZ: 20,
};

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 2.5, 8);

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

      const lookSpeed = 0.003;
      yaw.current -= dx * lookSpeed;
      pitch.current -= dy * lookSpeed;
      const maxPitch = Math.PI / 2 - 0.02;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -maxPitch, maxPitch);
    };

    // Scroll to move forward/backward
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const amount = -e.deltaY * 0.008;
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

    const speed = 7;
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

    // simple smoothing
    velocity.current.lerp(move, 0.25);

    const nextPosition = camera.position.clone().add(velocity.current);

    // world bounds
    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    nextPosition.y = THREE.MathUtils.clamp(nextPosition.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

    // collision with cards (very soft, just to avoid exact overlap)
    const minDistance = 0.3;
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
        zIndexRange={[0, 20]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`w-56 rounded-2xl border px-3 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition-all ${
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
          <p className="text-[10px] text-black/55 line-clamp-2 leading-snug">
            {card.description || "No bio available."}
          </p>
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
      <fog attach="fog" args={["#f6efe4", 6, 22]} />

      <ambientLight intensity={0.7} color="#f6e5cc" />
      <directionalLight position={[8, 12, 6]} intensity={0.9} color="#ffffff" />
      <hemisphereLight skyColor="#fff3d8" groundColor="#e8ddcf" intensity={0.6} />

      {/* Cards */}
      {cards.map((card) => (
        <CardMesh
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

    const xRange = 4; // X bias from followers
    const yRange = 3; // Y = engagement
    const zBase = -5; // main ring depth

    const n = sorted.length;
    const arc = Math.PI * 1.1; // front-facing arc

    return sorted.map((m, index) => {
      const followerLog = Math.log10((m.profile.follower_count ?? 0) + 1);
      const engagement = m.profile.sample_tweets?.length ?? 0;
      const score = m.score ?? 0;

      const nf = norm(followerLog, minFollowers, maxFollowers);
      const ne = norm(engagement, minEng, maxEng);
      const ns = norm(score, minScore, maxScore);

      // Place on a tighter arc ring
      const t = n <= 1 ? 0.5 : index / (n - 1);
      const angle = (t - 0.5) * arc;
      const ringRadius = 4.5;
      const ringX = Math.sin(angle) * ringRadius;
      const ringZ = -Math.cos(angle) * ringRadius + zBase;

      // Followers still bias left/right along the arc
      const xOffset = (nf - 0.5) * xRange * 0.7;
      // Engagement = vertical (tighter range)
      const y = (ne - 0.5) * 2 * yRange * 0.8;
      // Brand fit nudges closer / further from camera but keeps a band
      const zOffset = (1 - ns) * 1.0;

      const x = ringX + xOffset;
      const z = ringZ + zOffset;

      // small jitter to avoid perfect overlap
      const jitterX = Math.sin(index * 12.9898) * 0.25;
      const jitterY = Math.cos(index * 78.233) * 0.2;

      return {
        id: m.profile.username,
        name: m.profile.name,
        username: m.profile.username,
        description: m.profile.description,
        followerCount: m.profile.follower_count,
        profileImageUrl: m.profile.profile_image_url,
        score: m.score,
        engagement,
        position: [x + jitterX, y + jitterY, z] as [number, number, number],
        radius: 0.7,
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
      <div className="pointer-events-none absolute left-4 top-4 z-40 flex flex-col gap-2 text-[11px]">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 backdrop-blur-md pointer-events-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
          <span className="uppercase tracking-[0.16em] text-[9px] text-black/50">
            3D MATCH SPACE
          </span>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setShowIntro(true);
              setPaused(false);
            }}
            className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-medium text-black/70 shadow-sm hover:bg-white"
          >
            Reset
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="ml-1 rounded-full bg-black px-3 py-1.5 text-[11px] font-medium text-white/90 hover:bg-black/90"
            >
              Back to list
            </button>
          )}
        </div>
      </div>

      {/* Axis legend (top-right) */}
      <div className="pointer-events-none absolute right-4 top-4 z-40 text-[10px]">
        <div className="pointer-events-auto rounded-2xl bg-white/80 px-3 py-2 border border-black/5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <p className="mb-1 text-[9px] font-semibold tracking-[0.16em] uppercase text-black/40">
            Space map
          </p>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute left-1/2 top-0 h-6 border-l border-black/30" />
              <div className="absolute bottom-0 left-1/2 translate-x-[-6px] text-[8px] text-black/50">
                ↑ Y
              </div>
              <div className="absolute left-0 top-1/2 w-full border-t border-black/30" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] text-black/50">
                X →
              </div>
              <div className="absolute left-1/2 top-1/2 h-5 w-px rotate-45 border-l border-dashed border-black/30" />
              <div className="absolute left-1/2 top-1/2 translate-x-1 translate-y-2 text-[8px] text-black/50">
                Z
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] text-black/70">
                <span className="font-medium">X · Followers</span>{" "}
                <span className="text-black/45">→ bigger audience to the right</span>
              </p>
              <p className="text-[9px] text-black/70">
                <span className="font-medium">Y · Engagement</span>{" "}
                <span className="text-black/45">↑ more active at the top</span>
              </p>
              <p className="text-[9px] text-black/70">
                <span className="font-medium">Z · Brand fit</span>{" "}
                <span className="text-black/45">closer = stronger alignment</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Focus card details (bottom-left) */}
      {currentCard && (
        <div className="pointer-events-none absolute left-4 bottom-4 z-30 max-w-xs">
          <div className="pointer-events-auto rounded-2xl bg-[#fdf7eb]/95 border border-black/5 px-4 py-3 shadow-[0_22px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.18em] text-black/40 mb-1.5">
              Profile in focus
            </p>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-medium text-black/50 overflow-hidden">
                {currentCard.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentCard.profileImageUrl.replace("_normal", "_bigger")}
                    alt={currentCard.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{currentCard.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-black/80 truncate">
                  {currentCard.name}
                </p>
                <p className="text-[11px] text-black/45 truncate">
                  @{currentCard.username}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[11px] text-black/45">Match</p>
                <p className="text-sm font-semibold text-black/80">
                  {(currentCard.score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            {currentCard.description && (
              <p className="mt-1 text-[11px] leading-snug text-black/55 line-clamp-4">
                {currentCard.description}
              </p>
            )}
          </div>
        </div>
      )}

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
              Each card lives in a 3D map: X = followers, Y = engagement, Z = alignment with your brand.
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
        camera={{ position: INITIAL_CAMERA_POSITION.toArray(), fov: 60, near: 0.1, far: 200 }}
        shadows
      >
        <GalleryScene
          cards={cards}
          paused={paused || showIntro}
          setHoveredId={setHoveredId}
          setActiveId={setActiveId}
        />
      </Canvas>
    </div>
  );
}
