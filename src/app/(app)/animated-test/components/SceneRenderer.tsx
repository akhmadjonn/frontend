'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { SceneConfig, OutcomeConfig, Position, Locale, AnimationStep, TrafficLightConfig, RoadElement } from '../types';
import { useAnimation } from '../hooks/useAnimation';
import { interpolatePath, easeInOutCubic, computeStepProgress, generateParticles } from '../utils/animation';
import VehicleSvg from './scenes/VehicleSvg';
import PedestrianSvg from './scenes/PedestrianSvg';
import SignSvg from './scenes/SignSvg';

interface SceneRendererProps {
  scene: SceneConfig;
  outcomes: Record<string, OutcomeConfig>;
  selectedOption: string | null;
  phase: 'idle' | 'animating' | 'done';
  onAnimationComplete: () => void;
  locale: Locale;
}

interface AnimatedVehicleState {
  [vehicleId: string]: { x: number; y: number; rotation: number };
}

const ANIMATION_DURATION = 2800;

export default function SceneRenderer({
  scene,
  outcomes,
  selectedOption,
  phase,
  onAnimationComplete,
  locale,
}: SceneRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [shaking, setShaking] = useState(false);
  const [crashEffect, setCrashEffect] = useState<{ pos: Position; progress: number } | null>(null);
  const [safeEffect, setSafeEffect] = useState(false);

  const outcome = selectedOption ? outcomes[selectedOption] ?? null : null;
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;
  const outcomeRef = useRef(outcome);
  outcomeRef.current = outcome;

  const handleAnimDone = useCallback(() => {
    const oc = outcomeRef.current;
    if (oc?.type === 'crash' && oc.crashPoint) {
      setCrashEffect({ pos: oc.crashPoint, progress: 1 });
      setTimeout(() => setShaking(false), 400);
    } else if (oc?.type === 'safe') {
      setSafeEffect(true);
    }
    setTimeout(() => onAnimationCompleteRef.current(), 500);
  }, []);

  const animation = useAnimation(ANIMATION_DURATION, handleAnimDone);

  const initialPositions = useMemo(() => {
    const map: AnimatedVehicleState = {};
    for (const v of scene.vehicles)
      map[v.id] = { x: v.position.x, y: v.position.y, rotation: v.rotation };
    for (const p of scene.pedestrians ?? [])
      map[p.id] = { x: p.position.x, y: p.position.y, rotation: 0 };
    return map;
  }, [scene.vehicles, scene.pedestrians]);

  const [vehiclePositions, setVehiclePositions] = useState<AnimatedVehicleState>(initialPositions);

  useEffect(() => {
    setVehiclePositions(initialPositions);
    setCrashEffect(null);
    setSafeEffect(false);
    setShaking(false);
  }, [initialPositions]);

  useEffect(() => {
    if (phase !== 'animating' || !selectedOption || !outcome) return;
    setVehiclePositions(initialPositions);
    setCrashEffect(null);
    setSafeEffect(false);
    setShaking(false);
    animation.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption]);

  useEffect(() => {
    if (animation.phase !== 'running' || !outcome) return;
    const easedProgress = easeInOutCubic(animation.progress);
    const next: AnimatedVehicleState = { ...initialPositions };

    for (const step of outcome.animations) {
      const stepProgress = computeStepProgress(step, easedProgress, outcome.animations);
      if (stepProgress <= 0) continue;
      const { position, rotation } = interpolatePath(step.path, Math.min(stepProgress, 1), step.rotations);
      next[step.targetId] = { x: position.x, y: position.y, rotation };
    }

    setVehiclePositions(next);

    if (outcome.type === 'crash' && outcome.crashPoint && easedProgress > 0.72) {
      const crashProgress = Math.min((easedProgress - 0.72) / 0.28, 1);
      setCrashEffect({ pos: outcome.crashPoint, progress: crashProgress });
      if (!shaking) setShaking(true);
    }
  }, [animation.phase, animation.progress, outcome, initialPositions, shaking]);

  const particles = useMemo(() => generateParticles(16), []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10">
      <svg
        ref={svgRef}
        viewBox={scene.viewBox}
        className="w-full h-auto"
        style={{
          transform: shaking ? `translate(${(Math.random() - 0.5) * 6}px, ${(Math.random() - 0.5) * 6}px)` : undefined,
          transition: shaking ? 'none' : 'transform 0.4s ease-out',
          background: 'linear-gradient(180deg, #3D7A1E 0%, #4A8C25 100%)',
        }}
      >
        <defs>
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A9E2F" />
            <stop offset="50%" stopColor="#4A8C25" />
            <stop offset="100%" stopColor="#3D7A1E" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A4A4A" />
            <stop offset="100%" stopColor="#383838" />
          </linearGradient>
          <linearGradient id="roadGradH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#484848" />
            <stop offset="100%" stopColor="#3A3A3A" />
          </linearGradient>
          <linearGradient id="sidewalkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4B8A8" />
            <stop offset="100%" stopColor="#B0A898" />
          </linearGradient>
          <filter id="roadTexture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
            <feBlend in="SourceGraphic" in2="gray" mode="overlay" />
          </filter>
          <radialGradient id="explosionGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
            <stop offset="15%" stopColor="#FFAA00" stopOpacity={0.9} />
            <stop offset="35%" stopColor="#FF4500" stopOpacity={0.7} />
            <stop offset="60%" stopColor="#FF2200" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FF0000" stopOpacity={0} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="treeShadow">
            <feDropShadow dx={2} dy={3} stdDeviation={2} floodColor="#000" floodOpacity={0.2} />
          </filter>
        </defs>

        {/* Grass background */}
        <rect x={0} y={0} width={600} height={400} fill="url(#grassGrad)" />

        {/* Grass texture spots */}
        {Array.from({ length: 45 }, (_, i) => {
          const gx = (i * 97 + 31) % 600;
          const gy = (i * 67 + 13) % 400;
          return (
            <circle
              key={`g${i}`}
              cx={gx} cy={gy}
              r={1 + (i % 3)}
              fill={i % 2 === 0 ? '#3D7A1E' : '#5A9E2F'}
              opacity={0.25}
            />
          );
        })}

        {/* Environment — trees and bushes */}
        <SceneEnvironment sceneType={scene.type} />

        {/* Road layout */}
        <RoadLayout type={scene.type} />

        {/* Custom road elements */}
        {scene.roadElements?.map((el, i) => (
          <RoadElementSvg key={`re${i}`} element={el} />
        ))}

        {/* Signs */}
        {scene.signs?.map((sign, i) => (
          <SignSvg key={`s${i}`} {...sign} />
        ))}

        {/* Traffic lights */}
        {scene.trafficLights?.map((tl) => (
          <TrafficLightSvg key={tl.id} config={tl} />
        ))}

        {/* Pedestrians */}
        {scene.pedestrians?.map((ped) => {
          const pos = vehiclePositions[ped.id] ?? { x: ped.position.x, y: ped.position.y };
          return (
            <PedestrianSvg
              key={ped.id}
              x={pos.x}
              y={pos.y}
              direction={ped.direction}
              walking={phase === 'animating'}
            />
          );
        })}

        {/* Vehicles */}
        {scene.vehicles.map((v) => {
          const pos = vehiclePositions[v.id] ?? { x: v.position.x, y: v.position.y, rotation: v.rotation };
          const isPlayerCrashing = shaking && v.isPlayer && outcome?.type === 'crash';
          return (
            <VehicleSvg
              key={v.id}
              type={v.type}
              color={v.color}
              label={v.label?.[locale]}
              x={pos.x}
              y={pos.y}
              rotation={pos.rotation}
              opacity={1}
              shake={isPlayerCrashing}
            />
          );
        })}

        {/* Crash explosion effect */}
        {crashEffect && (
          <g transform={`translate(${crashEffect.pos.x}, ${crashEffect.pos.y})`}>
            {/* Shockwave ring */}
            <circle
              cx={0} cy={0}
              r={crashEffect.progress * 40}
              fill="none"
              stroke="#FF4500"
              strokeWidth={2}
              opacity={Math.max(0, 1 - crashEffect.progress)}
            />
            {/* Main explosion */}
            <circle
              cx={0} cy={0}
              r={crashEffect.progress * 28}
              fill="url(#explosionGrad)"
              opacity={Math.max(0, 0.9 - crashEffect.progress * 0.5)}
            />
            {/* Inner hot core */}
            <circle
              cx={0} cy={0}
              r={crashEffect.progress * 12}
              fill="white"
              opacity={Math.max(0, 0.8 - crashEffect.progress)}
            />
            {/* Debris particles */}
            {particles.map((p) => (
              <rect
                key={`dp${p.id}`}
                x={p.x * crashEffect.progress}
                y={p.y * crashEffect.progress}
                width={p.size}
                height={p.size}
                rx={1}
                fill={p.color}
                opacity={Math.max(0, 1 - crashEffect.progress * 1.2)}
                transform={`rotate(${p.rotation + crashEffect.progress * 180})`}
              />
            ))}
            {/* Spark lines */}
            {Array.from({ length: 10 }, (_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              const len = 20 + (i % 3) * 10;
              return (
                <line
                  key={`sp${i}`}
                  x1={Math.cos(angle) * 8 * crashEffect.progress}
                  y1={Math.sin(angle) * 8 * crashEffect.progress}
                  x2={Math.cos(angle) * len * crashEffect.progress}
                  y2={Math.sin(angle) * len * crashEffect.progress}
                  stroke={i % 2 === 0 ? '#FF6B00' : '#FFD700'}
                  strokeWidth={1.5 - crashEffect.progress}
                  opacity={Math.max(0, 0.8 - crashEffect.progress)}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Warning icon */}
            <text
              x={0} y={4}
              textAnchor="middle"
              fontSize={18}
              opacity={crashEffect.progress > 0.5 ? Math.min(1, (crashEffect.progress - 0.5) * 4) : 0}
              style={{ pointerEvents: 'none' }}
            >
              💥
            </text>
          </g>
        )}

        {/* Safe checkmark effect */}
        {safeEffect && (() => {
          const center = outcome?.animations?.[0]?.path?.at(-1) ?? { x: 300, y: 200 };
          return (
            <g transform={`translate(${center.x}, ${center.y})`}>
              <circle cx={0} cy={0} r={0} fill="none" stroke="#22C55E" strokeWidth={2} opacity={0.6}>
                <animate attributeName="r" from="5" to="35" dur="0.8s" fill="freeze" />
                <animate attributeName="opacity" from="0.6" to="0" dur="0.8s" fill="freeze" />
              </circle>
              <circle cx={0} cy={0} r={0} fill="none" stroke="#4ADE80" strokeWidth={1.5} opacity={0.4}>
                <animate attributeName="r" from="5" to="50" dur="1s" fill="freeze" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1s" fill="freeze" />
              </circle>
              <circle cx={0} cy={0} r={0} fill="#22C55E" opacity={0.9}>
                <animate attributeName="r" from="0" to="16" dur="0.35s" fill="freeze" />
              </circle>
              <circle cx={0} cy={0} r={0} fill="white">
                <animate attributeName="r" from="0" to="13" dur="0.35s" fill="freeze" />
              </circle>
              <circle cx={0} cy={0} r={0} fill="#22C55E">
                <animate attributeName="r" from="0" to="12" dur="0.35s" fill="freeze" />
              </circle>
              <path
                d="M -5,0 L -2,4 L 6,-5"
                fill="none"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="20"
                strokeDashoffset={20}
              >
                <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.4s" begin="0.2s" fill="freeze" />
              </path>
            </g>
          );
        })()}
      </svg>

      {/* Phase overlay label */}
      {phase === 'animating' && (
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {locale === 'ru' ? 'Анимация...' : locale === 'uz' ? 'Анимация...' : 'Animatsiya...'}
        </div>
      )}
    </div>
  );
}

function SceneEnvironment({ sceneType }: { sceneType: string }) {
  const trees: Array<{ x: number; y: number; size: number; type: 'tree' | 'bush' }> = [];

  switch (sceneType) {
    case 'railway_crossing':
      trees.push(
        { x: 60, y: 60, size: 1.2, type: 'tree' }, { x: 100, y: 330, size: 1, type: 'tree' },
        { x: 500, y: 70, size: 1.1, type: 'tree' }, { x: 520, y: 340, size: 0.9, type: 'tree' },
        { x: 40, y: 150, size: 0.7, type: 'bush' }, { x: 540, y: 280, size: 0.8, type: 'bush' },
      );
      break;
    case 'intersection_4way':
    case 'intersection_t':
    case 'traffic_light_intersection':
      trees.push(
        { x: 60, y: 55, size: 1, type: 'tree' }, { x: 540, y: 55, size: 1.1, type: 'tree' },
        { x: 60, y: 340, size: 0.9, type: 'tree' }, { x: 540, y: 340, size: 1, type: 'tree' },
        { x: 100, y: 90, size: 0.6, type: 'bush' }, { x: 500, y: 310, size: 0.7, type: 'bush' },
      );
      break;
    case 'pedestrian_crossing':
      trees.push(
        { x: 50, y: 80, size: 1.1, type: 'tree' }, { x: 550, y: 80, size: 1, type: 'tree' },
        { x: 50, y: 320, size: 0.8, type: 'bush' }, { x: 550, y: 320, size: 0.9, type: 'bush' },
        { x: 80, y: 50, size: 0.7, type: 'bush' }, { x: 520, y: 350, size: 0.6, type: 'bush' },
      );
      break;
    case 'roundabout':
      trees.push(
        { x: 60, y: 50, size: 1, type: 'tree' }, { x: 540, y: 50, size: 0.9, type: 'tree' },
        { x: 60, y: 350, size: 0.9, type: 'tree' }, { x: 540, y: 350, size: 1, type: 'tree' },
        { x: 100, y: 100, size: 0.6, type: 'bush' }, { x: 500, y: 100, size: 0.7, type: 'bush' },
        { x: 100, y: 300, size: 0.6, type: 'bush' }, { x: 500, y: 300, size: 0.7, type: 'bush' },
      );
      break;
    default:
      trees.push(
        { x: 55, y: 70, size: 1, type: 'tree' }, { x: 545, y: 70, size: 1, type: 'tree' },
        { x: 55, y: 330, size: 0.9, type: 'tree' }, { x: 545, y: 330, size: 0.8, type: 'tree' },
      );
  }

  return (
    <g>
      {trees.map((t, i) => (
        <g key={`env${i}`} transform={`translate(${t.x}, ${t.y}) scale(${t.size})`} filter="url(#treeShadow)">
          {t.type === 'tree' ? (
            <>
              <rect x={-2} y={-3} width={4} height={14} rx={1.5} fill="#5D4037" />
              <circle cx={0} cy={-10} r={12} fill="#2E7D32" opacity={0.85} />
              <circle cx={-5} cy={-7} r={9} fill="#388E3C" opacity={0.7} />
              <circle cx={5} cy={-8} r={8} fill="#43A047" opacity={0.65} />
              <circle cx={0} cy={-13} r={7} fill="#4CAF50" opacity={0.5} />
            </>
          ) : (
            <>
              <ellipse cx={0} cy={0} rx={10} ry={7} fill="#2E7D32" opacity={0.8} />
              <ellipse cx={3} cy={-2} rx={7} ry={5} fill="#388E3C" opacity={0.6} />
              <ellipse cx={-3} cy={-1} rx={6} ry={4} fill="#43A047" opacity={0.5} />
            </>
          )}
        </g>
      ))}
    </g>
  );
}

function RoadLayout({ type }: { type: string }) {
  switch (type) {
    case 'intersection_4way':
    case 'traffic_light_intersection':
      return <Intersection4Way />;
    case 'intersection_t':
      return <IntersectionT />;
    case 'railway_crossing':
      return <RailwayCrossingRoad />;
    case 'pedestrian_crossing':
      return <PedestrianCrossingRoad />;
    case 'two_lane_road':
      return <TwoLaneRoad />;
    case 'roundabout':
      return <RoundaboutRoad />;
    default:
      return <TwoLaneRoad />;
  }
}

function Intersection4Way() {
  return (
    <g>
      {/* Sidewalks / curbs */}
      <rect x={215} y={0} width={8} height={160} fill="url(#sidewalkGrad)" />
      <rect x={377} y={0} width={8} height={160} fill="url(#sidewalkGrad)" />
      <rect x={215} y={240} width={8} height={160} fill="url(#sidewalkGrad)" />
      <rect x={377} y={240} width={8} height={160} fill="url(#sidewalkGrad)" />
      <rect x={0} y={155} width={215} height={8} fill="url(#sidewalkGrad)" />
      <rect x={385} y={155} width={215} height={8} fill="url(#sidewalkGrad)" />
      <rect x={0} y={237} width={215} height={8} fill="url(#sidewalkGrad)" />
      <rect x={385} y={237} width={215} height={8} fill="url(#sidewalkGrad)" />

      {/* Horizontal road */}
      <rect x={0} y={163} width={600} height={74} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      {/* Vertical road */}
      <rect x={223} y={0} width={154} height={400} fill="url(#roadGrad)" filter="url(#roadTexture)" />

      {/* White edge lines */}
      <line x1={0} y1={164} x2={223} y2={164} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={377} y1={164} x2={600} y2={164} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={0} y1={236} x2={223} y2={236} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={377} y1={236} x2={600} y2={236} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={224} y1={0} x2={224} y2={163} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={376} y1={0} x2={376} y2={163} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={224} y1={237} x2={224} y2={400} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={376} y1={237} x2={376} y2={400} stroke="white" strokeWidth={1.5} opacity={0.7} />

      {/* Center dashed lines — horizontal */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`hd${i}`} x={i * 30 + 5} y={199} width={18} height={2} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`hd2${i}`} x={385 + i * 30 + 5} y={199} width={18} height={2} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}

      {/* Center dashed lines — vertical */}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`vd${i}`} x={299} y={i * 30 + 5} width={2} height={18} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`vd2${i}`} x={299} y={245 + i * 30 + 5} width={2} height={18} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
    </g>
  );
}

function IntersectionT() {
  return (
    <g>
      {/* Sidewalks */}
      <rect x={0} y={155} width={600} height={8} fill="url(#sidewalkGrad)" />
      <rect x={0} y={237} width={600} height={8} fill="url(#sidewalkGrad)" />
      <rect x={215} y={245} width={8} height={155} fill="url(#sidewalkGrad)" />
      <rect x={377} y={245} width={8} height={155} fill="url(#sidewalkGrad)" />

      {/* Horizontal road */}
      <rect x={0} y={163} width={600} height={74} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      {/* Vertical road (bottom only) */}
      <rect x={223} y={237} width={154} height={163} fill="url(#roadGrad)" filter="url(#roadTexture)" />

      {/* Edge lines */}
      <line x1={0} y1={164} x2={600} y2={164} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={0} y1={236} x2={223} y2={236} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={377} y1={236} x2={600} y2={236} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={224} y1={237} x2={224} y2={400} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={376} y1={237} x2={376} y2={400} stroke="white" strokeWidth={1.5} opacity={0.7} />

      {/* Center dashed lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={`td${i}`} x={i * 30 + 5} y={199} width={18} height={2} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`tvd${i}`} x={299} y={245 + i * 30 + 5} width={2} height={18} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
    </g>
  );
}

function RailwayCrossingRoad() {
  return (
    <g>
      {/* Main horizontal road */}
      <rect x={0} y={175} width={600} height={70} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      {/* Sidewalks */}
      <rect x={0} y={170} width={600} height={6} fill="url(#sidewalkGrad)" />
      <rect x={0} y={245} width={600} height={6} fill="url(#sidewalkGrad)" />

      {/* Edge lines */}
      <line x1={0} y1={176} x2={600} y2={176} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={0} y1={244} x2={600} y2={244} stroke="white" strokeWidth={1.5} opacity={0.7} />

      {/* Center dashed line */}
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={`rrd${i}`} x={i * 30 + 5} y={209} width={18} height={2} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
    </g>
  );
}

function PedestrianCrossingRoad() {
  return (
    <g>
      {/* Main horizontal road */}
      <rect x={0} y={163} width={600} height={74} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      {/* Sidewalks */}
      <rect x={0} y={157} width={600} height={7} fill="url(#sidewalkGrad)" />
      <rect x={0} y={237} width={600} height={7} fill="url(#sidewalkGrad)" />

      {/* Edge lines */}
      <line x1={0} y1={164} x2={600} y2={164} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={0} y1={236} x2={600} y2={236} stroke="white" strokeWidth={1.5} opacity={0.7} />

      {/* Center dashed */}
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={`pd${i}`} x={i * 30 + 5} y={199} width={18} height={2} fill="#FFD54F" opacity={0.7} rx={1} />
      ))}
    </g>
  );
}

function TwoLaneRoad() {
  return (
    <g>
      <rect x={0} y={163} width={600} height={74} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      <rect x={0} y={157} width={600} height={7} fill="url(#sidewalkGrad)" />
      <rect x={0} y={237} width={600} height={7} fill="url(#sidewalkGrad)" />

      <line x1={0} y1={164} x2={600} y2={164} stroke="white" strokeWidth={1.5} opacity={0.7} />
      <line x1={0} y1={236} x2={600} y2={236} stroke="white" strokeWidth={1.5} opacity={0.7} />

      {/* Solid center line for no-overtaking scenarios */}
      <line x1={0} y1={200} x2={600} y2={200} stroke="#FFD54F" strokeWidth={2.5} opacity={0.8} />
    </g>
  );
}

function RoundaboutRoad() {
  const cx = 300, cy = 200, outerR = 90, innerR = 45;
  return (
    <g>
      {/* Entry/exit roads — 4 directions */}
      {/* North */}
      <rect x={260} y={0} width={80} height={110} fill="url(#roadGrad)" filter="url(#roadTexture)" />
      <rect x={255} y={0} width={6} height={110} fill="url(#sidewalkGrad)" />
      <rect x={339} y={0} width={6} height={110} fill="url(#sidewalkGrad)" />
      {/* South */}
      <rect x={260} y={290} width={80} height={110} fill="url(#roadGrad)" filter="url(#roadTexture)" />
      <rect x={255} y={290} width={6} height={110} fill="url(#sidewalkGrad)" />
      <rect x={339} y={290} width={6} height={110} fill="url(#sidewalkGrad)" />
      {/* West */}
      <rect x={0} y={160} width={210} height={80} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      <rect x={0} y={155} width={210} height={6} fill="url(#sidewalkGrad)" />
      <rect x={0} y={240} width={210} height={6} fill="url(#sidewalkGrad)" />
      {/* East */}
      <rect x={390} y={160} width={210} height={80} fill="url(#roadGradH)" filter="url(#roadTexture)" />
      <rect x={390} y={155} width={210} height={6} fill="url(#sidewalkGrad)" />
      <rect x={390} y={240} width={210} height={6} fill="url(#sidewalkGrad)" />

      {/* Roundabout circle — outer road */}
      <circle cx={cx} cy={cy} r={outerR} fill="#3D3D3D" filter="url(#roadTexture)" />
      {/* Center island */}
      <circle cx={cx} cy={cy} r={innerR} fill="#4A8C25" stroke="#3D7A1E" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={innerR - 5} fill="#5A9E2F" opacity={0.5} />
      {/* Center island decoration */}
      <circle cx={cx} cy={cy} r={8} fill="#388E3C" />
      <circle cx={cx} cy={cy - 12} r={6} fill="#43A047" opacity={0.7} />
      <circle cx={cx + 10} cy={cy + 8} r={5} fill="#2E7D32" opacity={0.6} />

      {/* Road markings — dashed circle */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const r = (outerR + innerR) / 2;
        const dashLen = 8;
        const x1 = cx + Math.cos(angle) * r;
        const y1 = cy + Math.sin(angle) * r;
        const x2 = cx + Math.cos(angle + 0.08) * r;
        const y2 = cy + Math.sin(angle + 0.08) * r;
        return (
          <line key={`rc${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="white" strokeWidth={1.2} opacity={0.5} strokeDasharray="4 4" />
        );
      })}

      {/* Outer edge of roundabout */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
      {/* Inner edge */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />

      {/* Directional arrows on entry roads */}
      {/* North entry */}
      <polygon points="300,115 295,125 305,125" fill="white" opacity={0.4} />
      {/* South entry */}
      <polygon points="300,285 295,275 305,275" fill="white" opacity={0.4} />
      {/* West entry */}
      <polygon points="215,200 225,195 225,205" fill="white" opacity={0.4} />
      {/* East entry */}
      <polygon points="385,200 375,195 375,205" fill="white" opacity={0.4} />

      {/* Center dashed lines on entry roads */}
      {Array.from({ length: 3 }, (_, i) => (
        <rect key={`rnd${i}`} x={299} y={i * 30 + 15} width={2} height={18} fill="#FFD54F" opacity={0.6} rx={1} />
      ))}
      {Array.from({ length: 3 }, (_, i) => (
        <rect key={`rsd${i}`} x={299} y={300 + i * 30 + 5} width={2} height={18} fill="#FFD54F" opacity={0.6} rx={1} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`rwd${i}`} x={i * 30 + 15} y={199} width={18} height={2} fill="#FFD54F" opacity={0.6} rx={1} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`red${i}`} x={395 + i * 30 + 5} y={199} width={18} height={2} fill="#FFD54F" opacity={0.6} rx={1} />
      ))}
    </g>
  );
}

function RoadElementSvg({ element }: { element: RoadElement }) {
  const { type, position, width, height, rotation = 0 } = element;

  switch (type) {
    case 'railway_tracks':
      return (
        <g transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}>
          {/* Railway bed (ballast) */}
          <rect x={-width / 2 - 8} y={0} width={width + 16} height={height} fill="#8D6E63" opacity={0.5} />
          {/* Wooden ties */}
          {Array.from({ length: Math.floor(height / 10) }, (_, i) => (
            <rect key={`tie${i}`} x={-width / 2 - 6} y={i * 10 + 2} width={width + 12} height={5} rx={1} fill="#795548" opacity={0.7} />
          ))}
          {/* Steel rails */}
          <rect x={-width / 2 + 2} y={0} width={3} height={height} fill="#9E9E9E" />
          <rect x={width / 2 - 5} y={0} width={3} height={height} fill="#9E9E9E" />
          {/* Rail highlight */}
          <rect x={-width / 2 + 2.5} y={0} width={1} height={height} fill="#BDBDBD" opacity={0.5} />
          <rect x={width / 2 - 4.5} y={0} width={1} height={height} fill="#BDBDBD" opacity={0.5} />
        </g>
      );

    case 'zebra_crossing':
      return (
        <g transform={`translate(${position.x}, ${position.y})`}>
          {Array.from({ length: Math.floor(height / 8) }, (_, i) => (
            <rect key={`zb${i}`} x={0} y={i * 8} width={width} height={5} rx={0.5} fill="white" opacity={0.85} />
          ))}
        </g>
      );

    case 'barrier':
      return (
        <g transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}>
          {/* Barrier post */}
          <rect x={-2} y={-15} width={4} height={20} fill="#666" rx={1} />
          {/* Barrier arm */}
          <rect x={0} y={-2} width={width} height={height} rx={1} fill="white" />
          {/* Red stripes */}
          {Array.from({ length: Math.floor(width / 8) }, (_, i) => (
            <rect key={`bs${i}`} x={i * 8 + 2} y={-2} width={4} height={height} fill="#CC0000" />
          ))}
          {/* Warning light */}
          <circle cx={0} cy={-18} r={3.5} fill="#FF1744">
            <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />
          </circle>
        </g>
      );

    default:
      return null;
  }
}

function TrafficLightSvg({ config }: { config: TrafficLightConfig }) {
  const { position, state } = config;
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Pole */}
      <rect x={-1.5} y={0} width={3} height={20} fill="#555" rx={1} />
      {/* Housing */}
      <rect x={-7} y={-30} width={14} height={32} rx={3} fill="#333" stroke="#222" strokeWidth={0.8} />
      {/* Visor */}
      <rect x={-8} y={-31} width={16} height={3} rx={1} fill="#444" />

      {/* Red */}
      <circle cx={0} cy={-22} r={4} fill={state === 'red' ? '#FF1744' : '#4a1a1a'} />
      {state === 'red' && <circle cx={0} cy={-22} r={7} fill="#FF1744" opacity={0.25} />}

      {/* Yellow */}
      <circle cx={0} cy={-13} r={4} fill={state === 'yellow' ? '#FFC107' : '#4a3a1a'} />
      {state === 'yellow' && <circle cx={0} cy={-13} r={7} fill="#FFC107" opacity={0.25} />}

      {/* Green */}
      <circle cx={0} cy={-4} r={4} fill={state === 'green' ? '#00E676' : '#1a3a1a'} />
      {state === 'green' && <circle cx={0} cy={-4} r={7} fill="#00E676" opacity={0.25} />}
    </g>
  );
}
