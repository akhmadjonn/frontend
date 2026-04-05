'use client';

import type { VehicleType } from '../../types';

interface VehicleSvgProps {
  type: VehicleType;
  color: string;
  label?: string;
  x: number;
  y: number;
  rotation: number;
  opacity?: number;
  shake?: boolean;
}

export default function VehicleSvg({ type, color, label, x, y, rotation, opacity = 1, shake }: VehicleSvgProps) {
  if (type === 'train') return <TrainSvg x={x} y={y} rotation={rotation} opacity={opacity} />;
  if (type === 'truck') return <TruckSvg x={x} y={y} rotation={rotation} opacity={opacity} color={color} label={label} shake={shake} />;
  if (type === 'bus') return <BusSvg x={x} y={y} rotation={rotation} opacity={opacity} color={color} label={label} shake={shake} />;
  return <CarSvg x={x} y={y} rotation={rotation} opacity={opacity} color={color} label={label} shake={shake} />;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `rgb(${r},${g},${b})`;
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return `rgb(${r},${g},${b})`;
}

function CarSvg({ x, y, rotation, opacity, color, label, shake }: {
  x: number; y: number; rotation: number; opacity: number; color: string; label?: string; shake?: boolean;
}) {
  const bodyDark = darkenColor(color, 40);
  const bodyLight = lightenColor(color, 30);
  const uid = `car-${x}-${y}`.replace(/\./g, '_');

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={opacity}
      style={shake ? { filter: 'brightness(1.3) saturate(1.8) drop-shadow(0 0 6px rgba(255,50,0,0.7))' } : undefined}
    >
      <defs>
        <linearGradient id={`bodyGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bodyDark} />
          <stop offset="30%" stopColor={color} />
          <stop offset="50%" stopColor={bodyLight} />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor={bodyDark} />
        </linearGradient>
        <linearGradient id={`roofGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={darkenColor(color, 20)} />
          <stop offset="50%" stopColor={lightenColor(color, 15)} />
          <stop offset="100%" stopColor={darkenColor(color, 20)} />
        </linearGradient>
        <linearGradient id={`windshield-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#B3E5FC" />
          <stop offset="40%" stopColor="#4FC3F7" />
          <stop offset="100%" stopColor="#0288D1" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx={0} cy={2} rx={15} ry={28} fill="rgba(0,0,0,0.25)" />

      {/* Wheels with tread detail */}
      {[[-14, -18], [10, -18], [-14, 14], [10, 14]].map(([wx, wy], i) => (
        <g key={`w${i}`}>
          <rect x={wx} y={wy} width={5} height={11} rx={2} fill="#1a1a1a" stroke="#333" strokeWidth={0.4} />
          <rect x={wx + 0.8} y={wy + 1} width={3.4} height={9} rx={1.5} fill="#2a2a2a" />
          {/* Tire tread lines */}
          <line x1={wx + 0.5} y1={wy + 3} x2={wx + 4.5} y2={wy + 3} stroke="#444" strokeWidth={0.3} />
          <line x1={wx + 0.5} y1={wy + 5.5} x2={wx + 4.5} y2={wy + 5.5} stroke="#444" strokeWidth={0.3} />
          <line x1={wx + 0.5} y1={wy + 8} x2={wx + 4.5} y2={wy + 8} stroke="#444" strokeWidth={0.3} />
          {/* Hub cap */}
          <circle cx={wx + 2.5} cy={wy + 5.5} r={1.5} fill="#555" stroke="#666" strokeWidth={0.3} />
        </g>
      ))}

      {/* Main body shell */}
      <rect x={-11} y={-26} width={22} height={52} rx={7} ry={7} fill={`url(#bodyGrad-${uid})`} stroke={bodyDark} strokeWidth={0.8} />

      {/* Body panel lines */}
      <line x1={-11} y1={-8} x2={-11} y2={14} stroke={bodyDark} strokeWidth={0.3} opacity={0.5} />
      <line x1={11} y1={-8} x2={11} y2={14} stroke={bodyDark} strokeWidth={0.3} opacity={0.5} />

      {/* Hood with contour */}
      <rect x={-9} y={-25} width={18} height={13} rx={5} fill={`url(#bodyGrad-${uid})`} />
      <path d="M -3,-24 Q 0,-26 3,-24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.6} />
      <line x1={0} y1={-24} x2={0} y2={-14} stroke="rgba(0,0,0,0.08)" strokeWidth={0.6} />

      {/* Front bumper */}
      <rect x={-10} y={-27} width={20} height={3} rx={1.5} fill={bodyDark} />

      {/* Headlights — amber LED style */}
      <rect x={-9} y={-28} width={5} height={2.5} rx={1.2} fill="#FFF8E1" stroke="#FFD54F" strokeWidth={0.4} />
      <rect x={4} y={-28} width={5} height={2.5} rx={1.2} fill="#FFF8E1" stroke="#FFD54F" strokeWidth={0.4} />
      <ellipse cx={-6.5} cy={-28.5} rx={4} ry={4} fill="#FFEE58" opacity={0.12} />
      <ellipse cx={6.5} cy={-28.5} rx={4} ry={4} fill="#FFEE58" opacity={0.12} />

      {/* Windshield */}
      <rect x={-8} y={-12} width={16} height={9} rx={2.5} fill={`url(#windshield-${uid})`} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
      {/* Windshield reflection streak */}
      <rect x={-6} y={-11} width={4} height={7} rx={2} fill="rgba(255,255,255,0.25)" />

      {/* A-pillars */}
      <line x1={-8.5} y1={-12} x2={-10} y2={-5} stroke="rgba(0,0,0,0.2)" strokeWidth={1.2} />
      <line x1={8.5} y1={-12} x2={10} y2={-5} stroke="rgba(0,0,0,0.2)" strokeWidth={1.2} />

      {/* Roof */}
      <rect x={-9} y={-3} width={18} height={13} rx={3} fill={`url(#roofGrad-${uid})`} />
      {/* Roof edge highlight */}
      <rect x={-7} y={-2} width={14} height={1} rx={0.5} fill="rgba(255,255,255,0.12)" />

      {/* Rear window */}
      <rect x={-7} y={11} width={14} height={7} rx={2.5} fill={`url(#windshield-${uid})`} opacity={0.8} stroke="rgba(255,255,255,0.2)" strokeWidth={0.4} />

      {/* Trunk */}
      <rect x={-9} y={18} width={18} height={6} rx={3} fill={`url(#bodyGrad-${uid})`} />

      {/* Rear bumper */}
      <rect x={-10} y={24} width={20} height={2.5} rx={1} fill={bodyDark} />

      {/* Taillights — red LED */}
      <rect x={-10} y={23} width={5} height={3} rx={1} fill="#EF5350" />
      <rect x={5} y={23} width={5} height={3} rx={1} fill="#EF5350" />
      <ellipse cx={-7.5} cy={25} rx={3} ry={2} fill="#F44336" opacity={0.2} />
      <ellipse cx={7.5} cy={25} rx={3} ry={2} fill="#F44336" opacity={0.2} />

      {/* Side mirrors with chrome */}
      <ellipse cx={-13} cy={-9} rx={2.5} ry={2} fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />
      <ellipse cx={-13} cy={-9} rx={1.5} ry={1.2} fill="rgba(200,200,200,0.4)" />
      <ellipse cx={13} cy={-9} rx={2.5} ry={2} fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />
      <ellipse cx={13} cy={-9} rx={1.5} ry={1.2} fill="rgba(200,200,200,0.4)" />

      {/* Door handles */}
      <rect x={-10} y={2} width={3} height={1} rx={0.5} fill="rgba(200,200,200,0.5)" />
      <rect x={7} y={2} width={3} height={1} rx={0.5} fill="rgba(200,200,200,0.5)" />

      {/* License plate */}
      <rect x={-4} y={24.5} width={8} height={2.5} rx={0.8} fill="white" stroke="#888" strokeWidth={0.3} />
      <rect x={-3} y={25} width={6} height={1.5} rx={0.3} fill="#eee" />

      {/* Label badge */}
      {label && (
        <g>
          <rect x={-11} y={-1} width={22} height={10} rx={5} fill="rgba(0,0,0,0.7)" />
          <rect x={-10.5} y={-0.5} width={21} height={9} rx={4.5} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
          <text x={0} y={6.5} textAnchor="middle" fontSize={7} fontWeight="800" fill="white" fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

function TruckSvg({ x, y, rotation, opacity, color, label, shake }: {
  x: number; y: number; rotation: number; opacity: number; color: string; label?: string; shake?: boolean;
}) {
  const bodyDark = darkenColor(color, 40);
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={opacity}
      style={shake ? { filter: 'brightness(1.3) saturate(1.8) drop-shadow(0 0 6px rgba(255,50,0,0.7))' } : undefined}
    >
      <ellipse cx={0} cy={3} rx={16} ry={34} fill="rgba(0,0,0,0.2)" />

      {/* Wheels */}
      {[[-16, -26], [11, -26], [-16, 10], [11, 10], [-16, 20], [11, 20]].map(([wx, wy], i) => (
        <g key={`tw${i}`}>
          <rect x={wx} y={wy} width={5} height={11} rx={2} fill="#1a1a1a" stroke="#333" strokeWidth={0.3} />
          <circle cx={wx + 2.5} cy={wy + 5.5} r={1.3} fill="#555" />
        </g>
      ))}

      {/* Cargo bed */}
      <rect x={-12} y={-2} width={24} height={34} rx={2} fill={color} stroke={bodyDark} strokeWidth={0.8} />
      <rect x={-12} y={6} width={24} height={1.5} fill="rgba(0,0,0,0.08)" />
      <rect x={-12} y={16} width={24} height={1.5} fill="rgba(0,0,0,0.08)" />
      <rect x={-12} y={26} width={24} height={1.5} fill="rgba(0,0,0,0.08)" />

      {/* Cab */}
      <rect x={-11} y={-32} width={22} height={30} rx={5} fill={color} stroke={bodyDark} strokeWidth={0.8} />
      <rect x={-8} y={-22} width={16} height={10} rx={3} fill="#4FC3F7" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
      <rect x={-6} y={-21} width={5} height={8} rx={2} fill="rgba(255,255,255,0.2)" />

      {/* Headlights */}
      <rect x={-9} y={-34} width={5} height={2.5} rx={1} fill="#FFF8E1" stroke="#FFD54F" strokeWidth={0.3} />
      <rect x={4} y={-34} width={5} height={2.5} rx={1} fill="#FFF8E1" stroke="#FFD54F" strokeWidth={0.3} />

      {/* Taillights */}
      <rect x={-10} y={31} width={5} height={2.5} rx={1} fill="#EF5350" />
      <rect x={5} y={31} width={5} height={2.5} rx={1} fill="#EF5350" />

      {/* Mirrors */}
      <rect x={-15} y={-20} width={3.5} height={5} rx={1.5} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={0.4} />
      <rect x={11.5} y={-20} width={3.5} height={5} rx={1.5} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={0.4} />

      {label && (
        <g>
          <rect x={-11} y={1} width={22} height={10} rx={5} fill="rgba(0,0,0,0.7)" />
          <text x={0} y={8.5} textAnchor="middle" fontSize={7} fontWeight="800" fill="white" fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>{label}</text>
        </g>
      )}
    </g>
  );
}

function BusSvg({ x, y, rotation, opacity, color, label, shake }: {
  x: number; y: number; rotation: number; opacity: number; color: string; label?: string; shake?: boolean;
}) {
  const bodyDark = darkenColor(color, 40);
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      opacity={opacity}
      style={shake ? { filter: 'brightness(1.3) saturate(1.8) drop-shadow(0 0 6px rgba(255,50,0,0.7))' } : undefined}
    >
      <ellipse cx={0} cy={3} rx={14} ry={32} fill="rgba(0,0,0,0.2)" />

      {/* Wheels */}
      {[[-14, -22], [10, -22], [-14, 18], [10, 18]].map(([wx, wy], i) => (
        <g key={`bw${i}`}>
          <rect x={wx} y={wy} width={4.5} height={10} rx={2} fill="#1a1a1a" />
          <circle cx={wx + 2.25} cy={wy + 5} r={1.2} fill="#555" />
        </g>
      ))}

      {/* Body */}
      <rect x={-12} y={-28} width={24} height={56} rx={5} fill={color} stroke={bodyDark} strokeWidth={0.8} />

      {/* Horizontal stripe */}
      <rect x={-12} y={-2} width={24} height={3} fill="rgba(255,255,255,0.2)" />

      {/* Windows */}
      {[-22, -15, -8, 5, 12, 19].map((wy) => (
        <g key={`bwn${wy}`}>
          <rect x={-11} y={wy} width={5} height={5} rx={1.2} fill="#4FC3F7" opacity={0.7} stroke="rgba(255,255,255,0.15)" strokeWidth={0.3} />
          <rect x={6} y={wy} width={5} height={5} rx={1.2} fill="#4FC3F7" opacity={0.7} stroke="rgba(255,255,255,0.15)" strokeWidth={0.3} />
        </g>
      ))}

      {/* Windshield */}
      <rect x={-9} y={-27} width={18} height={7} rx={2} fill="#4FC3F7" stroke="rgba(255,255,255,0.3)" strokeWidth={0.4} />

      {/* Headlights */}
      <rect x={-8} y={-30} width={4} height={2.5} rx={1} fill="#FFF8E1" />
      <rect x={4} y={-30} width={4} height={2.5} rx={1} fill="#FFF8E1" />

      {/* Taillights */}
      <rect x={-9} y={27.5} width={5} height={2.5} rx={1} fill="#EF5350" />
      <rect x={4} y={27.5} width={5} height={2.5} rx={1} fill="#EF5350" />

      {label && (
        <g>
          <rect x={-11} y={-1} width={22} height={10} rx={5} fill="rgba(0,0,0,0.7)" />
          <text x={0} y={6.5} textAnchor="middle" fontSize={7} fontWeight="800" fill="white" fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>{label}</text>
        </g>
      )}
    </g>
  );
}

function TrainSvg({ x, y, rotation, opacity }: { x: number; y: number; rotation: number; opacity: number }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`} opacity={opacity}>
      <ellipse cx={0} cy={0} rx={22} ry={70} fill="rgba(0,0,0,0.15)" />

      {/* === LOCOMOTIVE === */}
      <rect x={-16} y={-62} width={32} height={46} rx={6} fill="#C62828" stroke="#8E0000" strokeWidth={1} />
      {/* Cab front plate - metallic */}
      <rect x={-14} y={-60} width={28} height={10} rx={4} fill="#D32F2F" />
      {/* Front grill */}
      <rect x={-10} y={-63} width={20} height={3} rx={1} fill="#424242" />
      {/* Windshield */}
      <rect x={-11} y={-50} width={22} height={11} rx={3} fill="#4FC3F7" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
      <rect x={-9} y={-49} width={7} height={9} rx={2} fill="rgba(255,255,255,0.2)" />
      {/* Gold body stripes */}
      <rect x={-16} y={-38} width={32} height={3.5} fill="#FFC107" opacity={0.8} />
      <rect x={-16} y={-22} width={32} height={2.5} fill="#FFC107" opacity={0.6} />
      {/* Number plate */}
      <rect x={-7} y={-34} width={14} height={5.5} rx={2} fill="#212121" />
      <text x={0} y={-30} textAnchor="middle" fontSize={4.5} fill="#FFC107" fontWeight="bold" fontFamily="monospace">TE-33</text>

      {/* Front warning lights with glow */}
      <circle cx={-9} cy={-64} r={3.5} fill="#FF1744" opacity={0.8} />
      <circle cx={9} cy={-64} r={3.5} fill="#FF1744" opacity={0.8} />
      <circle cx={-9} cy={-64} r={6} fill="#FF1744" opacity={0.15} />
      <circle cx={9} cy={-64} r={6} fill="#FF1744" opacity={0.15} />
      {/* Alternating flash animation */}
      <circle cx={-9} cy={-64} r={3} fill="white" opacity={0.6}>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={9} cy={-64} r={3} fill="white" opacity={0}>
        <animate attributeName="opacity" values="0;0.6;0" dur="0.8s" repeatCount="indefinite" />
      </circle>

      {/* Coupling */}
      <rect x={-5} y={-16} width={10} height={5} rx={2} fill="#616161" stroke="#424242" strokeWidth={0.5} />

      {/* === WAGON 1 === */}
      <rect x={-16} y={-10} width={32} height={40} rx={4} fill="#1565C0" stroke="#0D47A1" strokeWidth={0.8} />
      {[{wy: -4}, {wy: 6}, {wy: 16}, {wy: 24}].map(({wy}) => (
        <g key={`w1-${wy}`}>
          <rect x={-14} y={wy} width={6} height={5.5} rx={1.5} fill="#4FC3F7" opacity={0.45} />
          <rect x={8} y={wy} width={6} height={5.5} rx={1.5} fill="#4FC3F7" opacity={0.45} />
        </g>
      ))}
      <rect x={-16} y={22} width={32} height={1.5} fill="rgba(255,255,255,0.08)" />

      {/* Coupling 2 */}
      <rect x={-5} y={30} width={10} height={5} rx={2} fill="#616161" stroke="#424242" strokeWidth={0.5} />

      {/* === WAGON 2 === */}
      <rect x={-16} y={36} width={32} height={40} rx={4} fill="#1565C0" stroke="#0D47A1" strokeWidth={0.8} />
      {[{wy: 42}, {wy: 52}, {wy: 62}].map(({wy}) => (
        <g key={`w2-${wy}`}>
          <rect x={-14} y={wy} width={6} height={5.5} rx={1.5} fill="#4FC3F7" opacity={0.45} />
          <rect x={8} y={wy} width={6} height={5.5} rx={1.5} fill="#4FC3F7" opacity={0.45} />
        </g>
      ))}

      {/* Wheels — all along length with proper detail */}
      {[-56, -46, -34, -4, 8, 22, 42, 52, 66].map((wy) => (
        <g key={`trw-${wy}`}>
          <circle cx={-18} cy={wy} r={4.5} fill="#212121" stroke="#111" strokeWidth={0.6} />
          <circle cx={18} cy={wy} r={4.5} fill="#212121" stroke="#111" strokeWidth={0.6} />
          <circle cx={-18} cy={wy} r={2} fill="#444" />
          <circle cx={18} cy={wy} r={2} fill="#444" />
          <circle cx={-18} cy={wy} r={0.8} fill="#666" />
          <circle cx={18} cy={wy} r={0.8} fill="#666" />
        </g>
      ))}
    </g>
  );
}
